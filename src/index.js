const {stdin: input, stdout: output, exit} = require('node:process');
const stringify = require('json-stringify-safe');
const {LocalStorage} = require('node-localstorage');
const yargs = require('yargs');
const {Cache} = require('./modules/cache/Cache');
const {securedLogger: log} = require('./modules/logging/logging');
const {name: scriptName, version: scriptVersion} = require('./version');
const axios = require('axios');
const {v4: uuidv4} = require('uuid');
const mqtt = require('mqtt');
const crypto = require('crypto');
const {Input, Select, Form} = require('enquirer');


const ecoflowAPIURLDefault = 'https://api.ecoflow.com';

const options = yargs
  .usage('Usage: $0 [options]')
  .option('a', {
    alias: 'api-url',
    describe: 'Ecoflow API URL',
    type: 'string',
    default: ecoflowAPIURLDefault,
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
  .option('e', {
    alias: 'errors-count-max',
    describe: 'Maximum number of errors count for the SvitloBot ping',
    type: 'number',
    default: 5,
    min: 1,
    demandOption: false,
  })
  .option('auth-via-access-key', {
    describe: 'Authenticate to the EcoFlow API via access key',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('auth-via-username', {
    describe: 'Authenticate to the EcoFlow API via username',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('t', {
    alias: 'test-only',
    describe: 'Run without sending messages to the SvitloBot API',
    type: 'boolean',
    default: false,
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

if (options.debug) {
  log.setLevel('debug');
}

log.appendMaskWord('DeviceSN', 'ClientId', 'ChannelKey');

log.info(`Starting ${scriptName} v${scriptVersion} ...`);

const storage = new LocalStorage('config');
const cache = new Cache({
  getItem: (key) => storage.getItem(key),
  setItem: (key, value) => storage.setItem(key, value),
  removeItem: (key) => storage.removeItem(key),
});

const paramsMinLength = 3;

let ecoflowAccessKey = process.env.ECOFLOW_ACCESS_KEY || cache.getItem('ecoflowAccessKey');
let ecoflowSecretKey = process.env.ECOFLOW_SECRET_KEY || cache.getItem('ecoflowSecretKey');
let ecoflowUserName = process.env.ECOFLOW_USERNAME || cache.getItem('ecoflowUserName');
let ecoflowPassword = process.env.ECOFLOW_PASSWORD || cache.getItem('ecoflowPassword');
let ecoflowDeviceSN = process.env.ECOFLOW_DEVICE_SN || cache.getItem('ecoflowDeviceSN');
let svitlobotChannelKey = process.env.SVITLOBOT_CHANNEL_KEY || cache.getItem('svitlobotChannelKey');
let inputACConnectionState = false;
let firstPing = true;

const mqttClientIdPrefix = cache.getItem('mqttClientIdPrefix') || `ANDROID_${uuidv4().toUpperCase()}`;

if (ecoflowAccessKey) cache.setItem('ecoflowAccessKey', ecoflowAccessKey);
if (ecoflowSecretKey) cache.setItem('ecoflowSecretKey', ecoflowSecretKey);
if (ecoflowUserName) cache.setItem('ecoflowUserName', ecoflowUserName);
if (ecoflowPassword) cache.setItem('ecoflowPassword', ecoflowPassword);
if (ecoflowDeviceSN) cache.setItem('ecoflowDeviceSN', ecoflowDeviceSN);
if (svitlobotChannelKey) cache.setItem('svitlobotChannelKey', svitlobotChannelKey);
if (mqttClientIdPrefix) cache.setItem('mqttClientIdPrefix', mqttClientIdPrefix);


const ecoflowAPIURL = options.apiURL || ecoflowAPIURLDefault;
const ecoflowAPIAuthenticationPath = '/auth/login';
const ecoflowAPIAccessCertificationPath = '/iot-open/sign/certification';
const ecoflowAPIUserCertificationPath = '/iot-auth/app/certification';
const headers = {lang: 'en_US', 'content-type': 'application/json'};
const ecoflowAPI = axios.create({
  baseURL: ecoflowAPIURL,
  timeout: 10000,
});
const svitlobotPingURL = `https://api.svitlobot.in.ua/channelPing?channel_key=${svitlobotChannelKey}`;
const svitlobotUpdateInterval = options.svitlobotUpdateInterval * 1000;
const keepAliveInterval = options.keepAlive * svitlobotUpdateInterval;
const logAliveStatusInterval = options.logAliveStatusInterval * 60 * 1000;

const ecoAuthenticationFlowTopic = `/app/device/property/${ecoflowDeviceSN}`;
let ecoFlowTopic = ecoAuthenticationFlowTopic;

const ecoFlowACInput = 'inv.acIn';
const ecoFlowACInputVoltage = `${ecoFlowACInput}Vol`;
const ecoFlowACInputFrequency = `${ecoFlowACInput}Freq`;
const ecoFlowACInputCurrent = `${ecoFlowACInput}Amp`;

let mqttClient = null;
let mqttOptions = null;
let lastMQTTMessageTimeStamp = new Date().getTime();
let lastAliveInfoMessageTimeStamp = new Date().getTime();

let svitlobotPingErrorsCount = 0;

function ecoflowAPIAccessIsValid() {
  return typeof ecoflowAccessKey === 'string' &&
    ecoflowAccessKey.length > paramsMinLength &&
    typeof ecoflowSecretKey === 'string' &&
    ecoflowSecretKey.length > paramsMinLength &&
    options.authViaUsername === false;
}

function ecoflowAPIUserIsValid() {
  return typeof ecoflowUserName === 'string' &&
    ecoflowUserName.length > paramsMinLength &&
    typeof ecoflowPassword === 'string' &&
    ecoflowPassword.length > paramsMinLength &&
    options.authViaAccessKey === false;
}

function ecoflowDeviceSNIsValid() {
  return typeof ecoflowDeviceSN === 'string' && ecoflowDeviceSN.length > paramsMinLength;
}

function ecoflowCredentialsIsValid() {
  return (ecoflowAPIAccessIsValid() || ecoflowAPIUserIsValid()) && ecoflowDeviceSNIsValid();
}

async function getEcoFlowCredentials() {
  let result = ecoflowCredentialsIsValid();
  if (!result) {
    if (ecoflowAPIAccessIsValid() && ecoflowDeviceSNIsValid()) {
      result = true;
    } else if (ecoflowAPIUserIsValid() && ecoflowDeviceSNIsValid()) {
      result = true;
    } else {
      if (!(ecoflowAPIAccessIsValid() || ecoflowAPIUserIsValid())) {
        let method = '';
        if (options.authViaAccessKey) {
          method = 'Access key';
        } else if (options.authViaUsername) {
          method = 'Username';
        }
        if (method === '') {
          const prompt = new Select({
            message: 'Please select the EcoFlow authentication method:',
            choices: ['Access key', 'Username'],
          });
          method = await prompt.run();
        }
        if (method === 'Access key') {
          const prompt = new Form({
            name: 'ecoflowAccessData',
            message: 'Please enter your EcoFlow access & secret keys:',
            choices: [
              {name: 'accessKey', message: 'Access key:', initial: ecoflowAccessKey || ''},
              {name: 'secretKey', message: 'Secret key:', initial: ecoflowSecretKey || ''},
            ],
          });
          const {accessKey, secretKey} = await prompt.  run();
          cache.setItem('ecoflowAccessKey', accessKey);
          cache.setItem('ecoflowSecretKey', secretKey);
          ecoflowAccessKey = accessKey;
          ecoflowSecretKey = secretKey;
          result = ecoflowAPIAccessIsValid();
        } else {
          const prompt = new Form({
            name: 'ecoflowUserData',
            message: 'Please enter your EcoFlow username & password:',
            choices: [
              {name: 'userName', message: 'Username:', initial: ecoflowUserName || ''},
              {name: 'password', message: 'Password:', initial: ecoflowPassword || ''},
            ],
          });
          const {userName, password} = await prompt.run();
          cache.setItem('ecoflowUserName', userName);
          cache.setItem('ecoflowPassword', password);
          ecoflowUserName = userName;
          ecoflowPassword = password;
          result = ecoflowAPIUserIsValid();
        }
      }
      if (result && !ecoflowDeviceSNIsValid()) {
        const prompt = new Input({
          message: 'Please enter your EcoFlow device SN:',
          initial: ecoflowDeviceSN || '',
        });
        ecoflowDeviceSN = await prompt.run();
        cache.setItem('ecoflowDeviceSN', ecoflowDeviceSN);
        result = ecoflowDeviceSNIsValid();
      }
    }
  }
  return result;
}

function createEcoFlowSignature(params, secretKey) {
  const queryString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
}

function svitlobotChannelKeyIsValid() {
  return typeof svitlobotChannelKey === 'string' && svitlobotChannelKey.length > paramsMinLength;
}

async function getSvitlobotChannelKey() {
  let result = svitlobotChannelKeyIsValid();
  if (!result) {
    const prompt = new Input({
      message: 'Please enter your SvitloBot channel key:',
      initial: svitlobotChannelKey || '',
    });
    svitlobotChannelKey = await prompt.run();
    cache.setItem('svitlobotChannelKey', svitlobotChannelKey);
    result = svitlobotChannelKeyIsValid();
  }
  return result;
}

function mqttExit() {
  if (mqttClient && mqttClient.connected) {
    mqttClient.end();
    mqttClient = null;
    log.info('Ecoflow MQTT broker is disconnected!');
  }
  exit(0);
}

function mqttSubscribe() {
  mqttClient.subscribe(ecoFlowTopic, (error) => {
    if (error) {
      log.error(`Ecoflow MQTT subscription error: ${error}`);
      mqttExit();
    } else {
      log.info('Ecoflow MQTT subscription is successful. Listening to messages ...');
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
    log.debug(
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
    if (options.testOnly) {
      log.info('Test only: Svitlobot ping is successful!');
    } else {
      axios
        .get(svitlobotPingURL)
        .then((response) => {
          const pingMessage = `Svitlobot status is updated! Response: ${response.statusText}(${response.status}).`;
          if (options.logPing) {
            log.info(pingMessage);
          } else {
            log.debug(pingMessage);
          }
          svitlobotPingErrorsCount = 0;
        })
        .catch((error) => {
          log.error(`Svitlobot error: ${error}`);
          svitlobotPingErrorsCount++;
          if (svitlobotPingErrorsCount > options.errorsCountMax) {
            log.error(`Svitlobot ping error count is more than ${options.errorsCountMax}! Exiting ...`);
            mqttExit();
          }
        });
    }
  }
}

function svitlobotStatusUpdate() {
  const currentTimeStamp = new Date().getTime();
  if (currentTimeStamp - lastMQTTMessageTimeStamp <= svitlobotUpdateInterval) {
    svitlobotPing();
    if (logAliveStatusInterval > 0 && currentTimeStamp - lastAliveInfoMessageTimeStamp > logAliveStatusInterval) {
      lastAliveInfoMessageTimeStamp = currentTimeStamp;
      log.info('Ecoflow MQTT client is alive!');
    }
  }
  if (currentTimeStamp - lastMQTTMessageTimeStamp > keepAliveInterval) {
    log.warn(`Ecoflow MQTT client is not alive for ${options.svitlobotUpdateInterval * options.keepAlive} seconds!`);
    mqttClient.reconnect();
  }
}

function svitlobotStatusUpdateInit() {
  if (mqttClient) {
    lastMQTTMessageTimeStamp = new Date().getTime();
    setInterval(svitlobotStatusUpdate, svitlobotUpdateInterval);
  }
}

function processResponse(response, stage) {
  if (response?.status === 200 && response?.data?.code == 0 && typeof response?.data?.data === 'object') {
    log.info(`Ecoflow ${stage} is successful. Getting MQTT client ...`);
    return response.data.data;
  } else {
    log.error(
      `Error: Ecoflow ${stage} failed! Response: status=${response?.status}, code=${response?.data?.code}, message=${response?.data?.message}`,
    );
    mqttExit();
  }
}

process.on('SIGINT', mqttExit);
process.on('SIGTERM', mqttExit);

(async () => {
  try {
    if ((await getEcoFlowCredentials()) && (await getSvitlobotChannelKey())) {
      let certResponse = {};
      let mqttClientId = mqttClientIdPrefix;
      if ( ecoflowAPIAccessIsValid() ) {
        const params = {
          accessKey: ecoflowAccessKey,
          // eslint-disable-next-line sonarjs/pseudo-random
          nonce: Math.floor(Math.random() * 1000000),
          timestamp: Date.now(),
        };
        const signature = createEcoFlowSignature(params, ecoflowSecretKey);
        try {
          const response = await ecoflowAPI.get(ecoflowAPIAccessCertificationPath, {
            headers: {
              ...params,
              sign: signature,
            },
          });
          certResponse = processResponse(response, 'access keys certification');
          if (certResponse?.protocol === 'mqtts') {
            ecoFlowTopic = `/open/${certResponse.certificateAccount}/${ecoflowDeviceSN}/quota`;
          }
        } catch (error) {
          log.error(`Error: ${error}`);
          mqttExit();
        }
      } else if (ecoflowAPIUserIsValid()) {
        try {
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
          const apiResponse = processResponse(response, 'authentication');
          if (typeof apiResponse.token === 'string' && apiResponse.token.length > paramsMinLength) {
            const token = apiResponse.token;
            const {userId, name: userName} = apiResponse.user;
            log.debug(`Ecoflow token:`, {token});
            log.debug(`Ecoflow userId:`, {userId});
            log.debug(`Ecoflow userName:`, {userName});
            const response = await ecoflowAPI.get(`${ecoflowAPIUserCertificationPath}?userId=${userId}`, {
              headers: {lang: 'en_US', authorization: `Bearer ${token}`},
            });
            certResponse = processResponse(response, 'authenticated certification');
            mqttClientId += `_${userId}`;
          } else {
            log.error(`Error: Ecoflow authentication failed!`);
            mqttExit();
          }
        } catch (error) {
          log.error(`Error: ${error}`);
          mqttExit();
        }
      }
      if (typeof certResponse === 'object' && certResponse?.protocol === 'mqtts') {
        const {
          url: mqttUrl,
          port: mqttPort,
          protocol: mqttProtocol,
          certificateAccount: mqttUsername,
          certificatePassword: mqttPassword,
        } = certResponse;
        log.debug(`Ecoflow MQTT URL: ${mqttUrl}`);
        log.debug(`Ecoflow MQTT port: ${mqttPort}`);
        log.debug(`Ecoflow MQTT protocol: ${mqttProtocol}`);
        log.debug(`Ecoflow MQTT username:`, {mqttUsername});
        log.debug(`Ecoflow MQTT password:`, {mqttPassword});
        log.debug(`Ecoflow MQTT client ID:`, {mqttClientId});
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
          log.info('Ecoflow MQTT broker is connected. Subscribing to MQTT topic ...');
          mqttSubscribe();
        });

        mqttClient.on('error', (error) => {
          log.error(`Ecoflow MQTT broker error: ${error}`);
          mqttExit();
        });

        mqttClient.on('reconnect', () => {
          log.info('Ecoflow MQTT broker is reconnecting ...');
        });

        mqttClient.on('close', () => {
          log.info('Ecoflow MQTT broker is closed ...');
        });

        mqttClient.on('offline', () => {
          log.info('Ecoflow MQTT broker is offline ...');
        });

        mqttClient.on('end', () => {
          log.info('Ecoflow MQTT broker is ended ...');
        });

        mqttClient.on('message', mqttMessageHandler);
      } else {
        log.error(`Error: Ecoflow certification failed!`);
        mqttExit();
      }
    } else {
      log.error(`Error: Ecoflow credentials are invalid!`);
      mqttExit();
    }
  } catch (error) {
    log.error(`Error: ${error}`);
    mqttExit();
  }
})();
