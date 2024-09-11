const readline = require('node:readline/promises');
const {stdin: input, stdout: output, exit} = require('node:process');
const stringify = require('json-stringify-safe');
const {LocalStorage} = require('node-localstorage');
const yargs = require('yargs');
const {Cache} = require('./modules/cache/Cache');
const {logLevelInfo, logLevelDebug, setLogLevel, logDebug, logInfo, logWarning, logError} = require('./modules/logging/logging');
const {name: scriptName, version: scriptVersion} = require('./version');
const axios = require('axios');
const {v4: uuidv4} = require('uuid');
const mqtt = require('mqtt');

const storage = new LocalStorage('config');
const cache = new Cache({
  getItem: (key) => storage.getItem(key),
  setItem: (key, value) => storage.setItem(key, value),
  removeItem: (key) => storage.removeItem(key),
});

let ecoflowUserName = process.env.ECOFLOW_USERNAME || cache.getItem('ecoflowUserName');
let ecoflowPassword = process.env.ECOFLOW_PASSWORD || cache.getItem('ecoflowPassword');
let ecoflowDeviceSN = process.env.ECOFLOW_DEVICE_SN || cache.getItem('ecoflowDeviceSN');
let svitlobotChannelKey = process.env.SVITLOBOT_CHANNEL_KEY || cache.getItem('svitlobotChannelKey');
let inputACConnectionState = false;
let firstPing = true;

if (ecoflowUserName) cache.setItem('ecoflowUserName', ecoflowUserName);
if (ecoflowPassword) cache.setItem('ecoflowPassword', ecoflowPassword);
if (ecoflowDeviceSN) cache.setItem('ecoflowDeviceSN', ecoflowDeviceSN);
if (svitlobotChannelKey) cache.setItem('svitlobotChannelKey', svitlobotChannelKey);

const options = yargs
  .usage('Usage: $0 [options]')
  .option('e', {
    alias: 'errors-count-max',
    describe: 'Maximum number of errors count for the SvitloBot ping',
    type: 'number',
    default: 5,
    min: 1,
    demandOption: false,
  })
  .option('i', {
    alias: 'svitlobot-update-interval',
    describe: 'Update status of the svitlobot every X seconds',
    type: 'number',
    default: 60,
    min: 31,
    demandOption: false,
  })
  .option('k', {
    alias: 'keep-alive',
    describe: 'Check if the MQTT client is alive every Y update intervals',
    type: 'number',
    default: 3,
    min: 1,
    demandOption: false,
  })
  .option('log-ping', {
    describe: 'Log the "ping" status of the SvitloBot API',
    type: 'boolean',
    demandOption: false,
  })
  .option('l', {
    alias: 'log-alive-status-interval',
    describe: 'Log the MQTT client alive status every Z minutes',
    type: 'number',
    default: 0,
    demandOption: false,
  })
  .option('d', {
    alias: 'debug',
    describe: 'Debug level of logging',
    type: 'boolean',
    demandOption: false,
  })
  .version(scriptVersion)
  .help('h')
  .alias('h', 'help')
  .epilog(`${scriptName} v${scriptVersion}`).argv;

setLogLevel(options.debug ? logLevelDebug : logLevelInfo);

const ecoflowAPIURL = 'https://api.ecoflow.com';
const ecoflowAPIAuthenticationPath = '/auth/login';
const ecoflowAPICertificationPath = '/iot-auth/app/certification';
const headers = {lang: 'en_US', 'content-type': 'application/json'};
const ecoflowAPI = axios.create({
  baseURL: ecoflowAPIURL,
  timeout: 10000,
});
const svitlobotPingURL = `https://api.svitlobot.in.ua/channelPing?channel_key=${svitlobotChannelKey}`;
const svitlobotUpdateInterval = options.svitlobotUpdateInterval * 1000;
const keepAliveInterval = options.keepAlive * svitlobotUpdateInterval;
const logAliveStatusInterval = options.logAliveStatusInterval * 60 * 1000;


const ecoFlowTopic = `/app/device/property/${ecoflowDeviceSN}`;

const ecoFlowACInput = 'inv.acIn';
const ecoFlowACInputVoltage = `${ecoFlowACInput}Vol`;
const ecoFlowACInputFrequency = `${ecoFlowACInput}Freq`;
const ecoFlowACInputCurrent = `${ecoFlowACInput}Amp`;

let mqttClient = null;
let mqttOptions = null;
let lastMQTTMessageTimeStamp = new Date().getTime();
let lastAliveInfoMessageTimeStamp = new Date().getTime();

let svitlobotPingErrorsCount = 0;

async function getEcoFlowCredentials() {
  let result = ecoflowUserName && ecoflowPassword && ecoflowDeviceSN;
  if (!result) {
    const rl = readline.createInterface({input, output});
    try {
      ecoflowUserName = await rl.question('Enter your EcoFlow username: ');
      cache.setItem('ecoflowUserName', ecoflowUserName);
      ecoflowPassword = await rl.question('Enter your EcoFlow password: ');
      cache.setItem('ecoflowPassword', ecoflowPassword);
      ecoflowDeviceSN = await rl.question('Enter your EcoFlow device SN: ');
      cache.setItem('ecoflowDeviceSN', ecoflowDeviceSN);
      result = true;
    } catch (error) {
      logError(`Error: ${error}`);
      throw error;
    } finally {
      rl.close();
    }
  }
  return result;
}

async function getSvitlobotChannelKey() {
  let result = !!svitlobotChannelKey;
  if (!result) {
    const rl = readline.createInterface({input, output});
    try {
      svitlobotChannelKey = await rl.question('Enter your SvitloBot channel key: ');
      cache.setItem('svitlobotChannelKey', svitlobotChannelKey);
      result = true;
    } catch (error) {
      logError(`Error: ${error}`);
      throw error;
    } finally {
      rl.close();
    }
  }
  return result;
}

function mqttExit() {
  if (mqttClient && mqttClient.connected) {
    mqttClient.end();
    mqttClient = null;
    logInfo('Ecoflow MQTT broker is disconnected!');
  }
  exit(0);
}

function mqttSubscribe() {
  mqttClient.subscribe(ecoFlowTopic, (error) => {
    if (error) {
      logError(`Ecoflow MQTT subscription error: ${error}`);
      mqttExit();
    } else {
      logInfo('Ecoflow MQTT subscription is successful. Listening to messages ...');
      svitlobotStatusUpdateInit();
    }
  });
}

function mqttMessageHandler(topic, message) {
  const data = JSON.parse(message.toString());
  if (
    typeof data.params?.[ecoFlowACInputVoltage] === 'number' &&
    typeof data.params?.[ecoFlowACInputFrequency] === 'number' &&
    typeof data.params?.[ecoFlowACInputCurrent] === 'number'
  ) {
    lastMQTTMessageTimeStamp = new Date().getTime();
    const inputVoltage = data.params[ecoFlowACInputVoltage] / 1000;
    const inputCurrent = data.params[ecoFlowACInputCurrent] / 1000;
    const inputFrequency = data.params[ecoFlowACInputFrequency];
    inputACConnectionState = inputVoltage > 0 && inputCurrent > 0 && inputFrequency > 0;
    logDebug(
      `Ecoflow AC input connection state: ${inputACConnectionState} (voltage: ${inputVoltage} V, current: ${inputCurrent} A, frequency: ${inputFrequency} Hz)`,
    );
    if (firstPing) {
      firstPing = false;
      svitlobotPing();
    }
  }
}

function svitlobotPing() {
  if (inputACConnectionState) {
    axios
      .get(svitlobotPingURL)
      .then((response) => {
        const pingMessage = `Svitlobot status is updated! Response: ${response.statusText}(${response.status}).`;
        if (options.logPing) {
          logInfo(pingMessage);
        } else {
          logDebug(pingMessage);
        }
        svitlobotPingErrorsCount = 0;
      })
      .catch((error) => {
        logError(`Svitlobot error: ${error}`);
        svitlobotPingErrorsCount++;
        if (svitlobotPingErrorsCount > options.errorsCountMax) {
          logError(`Svitlobot ping error count is more than ${options.errorsCountMax}! Exiting ...`);
          mqttExit();
        }
      });
  }
}

function svitlobotStatusUpdate() {
  const currentTimeStamp = new Date().getTime();
  if (currentTimeStamp - lastMQTTMessageTimeStamp <= svitlobotUpdateInterval) {
    svitlobotPing();
    if (logAliveStatusInterval > 0 && currentTimeStamp - lastAliveInfoMessageTimeStamp > logAliveStatusInterval) {
      lastAliveInfoMessageTimeStamp = currentTimeStamp;
      logInfo('Ecoflow MQTT client is alive!');
    }
  }
  if (currentTimeStamp - lastMQTTMessageTimeStamp > keepAliveInterval) {
    logWarning(`Ecoflow MQTT client is not alive for ${options.svitlobotUpdateInterval * options.keepAlive} seconds!`);
    mqttClient.reconnect();
  }
}

function svitlobotStatusUpdateInit() {
  if (mqttClient) {
    lastMQTTMessageTimeStamp = new Date().getTime();
    setInterval(svitlobotStatusUpdate, svitlobotUpdateInterval);
  }
}

function maskString(value) {
  return typeof value === 'string' ? value.substring(0, 3) + '*'.repeat(value.length - 3) : value;
}

process.on('SIGINT', mqttExit);
process.on('SIGTERM', mqttExit);

(async () => {
  try {
    if ((await getEcoFlowCredentials()) && (await getSvitlobotChannelKey())) {
      const response = await ecoflowAPI.post(
        ecoflowAPIAuthenticationPath,
        {
          email: ecoflowUserName,
          password: Buffer.from(ecoflowPassword).toString('base64'),
          scene: 'IOT_APP',
          userType: 'ECOFLOW',
        },
        {headers},
      );
      logInfo('Ecoflow authentication is successful. Getting certification ...');
      const token = response.data.data.token;
      const {userId, name: userName} = response.data.data.user;
      logDebug(`Ecoflow token: ${maskString(token)}`);
      logDebug(`Ecoflow userId: ${maskString(userId)}`);
      logDebug(`Ecoflow userName: ${userName}`);
      const certResponse = await ecoflowAPI.get(`${ecoflowAPICertificationPath}?userId=${userId}`, {
        headers: {lang: 'en_US', authorization: `Bearer ${token}`},
      });
      logInfo('Ecoflow certification is successful. Getting MQTT client ...');
      const {
        url: mqttUrl,
        port: mqttPort,
        protocol: mqttProtocol,
        certificateAccount: mqttUsername,
        certificatePassword: mqttPassword,
      } = certResponse.data.data;
      const mqttClientId = `ANDROID_${uuidv4().toUpperCase()}_${userId}`;
      logDebug(`Ecoflow MQTT URL: ${mqttUrl}`);
      logDebug(`Ecoflow MQTT port: ${mqttPort}`);
      logDebug(`Ecoflow MQTT protocol: ${mqttProtocol}`);
      logDebug(`Ecoflow MQTT username: ${mqttUsername}`);
      logDebug(`Ecoflow MQTT password: ${maskString(mqttPassword)}`);
      logDebug(`Ecoflow MQTT client ID: ${maskString(mqttClientId)}`);
      const connectMQTTUrl = `${mqttProtocol}://${mqttUrl}:${mqttPort}`;
      mqttOptions = {
        clientId: mqttClientId,
        clean: true,
        connectTimeout: 4000,
        username: mqttUsername,
        password: mqttPassword,
        reconnectPeriod: 1000,
        protocol: mqttProtocol,
      };

      mqttClient = mqtt.connect(connectMQTTUrl, mqttOptions);
      mqttClient.on('connect', () => {
        logInfo('Ecoflow MQTT broker is connected. Subscribing to MQTT topic ...');
        mqttSubscribe();
      });

      mqttClient.on('error', (error) => {
        logError(`Ecoflow MQTT broker error: ${error}`);
        mqttExit();
      });

      mqttClient.on('reconnect', () => {
        logInfo('Ecoflow MQTT broker is reconnecting ...');
      });

      mqttClient.on('close', () => {
        logInfo('Ecoflow MQTT broker is closed ...');
      });

      mqttClient.on('offline', () => {
        logInfo('Ecoflow MQTT broker is offline ...');
      });

      mqttClient.on('end', () => {
        logInfo('Ecoflow MQTT broker is ended ...');
      });

      mqttClient.on('message', mqttMessageHandler);
    }
  } catch (error) {
    logError(`Error: ${error}`);
    mqttExit();
  }
})();
