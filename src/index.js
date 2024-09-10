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

const storage = new LocalStorage('config'),
  cache = new Cache({
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  });

let ecoflowUserName = process.env.ECOFLOW_USERNAME || cache.getItem('ecoflowUserName'),
  ecoflowPassword = process.env.ECOFLOW_PASSWORD || cache.getItem('ecoflowPassword'),
  ecoflowDeviceSN = process.env.ECOFLOW_DEVICE_SN || cache.getItem('ecoflowDeviceSN'),
  svitlobotChannelKey = process.env.SVITLOBOT_CHANNEL_KEY || cache.getItem('svitlobotChannelKey'),
  inputACConnectionState = false,
  firstPing = true;

if (ecoflowUserName) cache.setItem('ecoflowUserName', ecoflowUserName);
if (ecoflowPassword) cache.setItem('ecoflowPassword', ecoflowPassword);
if (ecoflowDeviceSN) cache.setItem('ecoflowDeviceSN', ecoflowDeviceSN);
if (svitlobotChannelKey) cache.setItem('svitlobotChannelKey', svitlobotChannelKey);

const options = yargs
  .usage('Usage: $0 [options]')
  .option('i', {
    alias: 'svitlobot-update-interval',
    describe: 'Update status of the svitlobot every X seconds',
    type: 'number',
    default: 60,
    min:31,
    demandOption: false,
  })
  .option('k', {
    alias: 'keep-alive',
    describe: 'Check if is mqtt client is alive every Y update intervals',
    type: 'number',
    default: 3,
    min: 1,
    demandOption: false,
  })
  .option('l', {
    alias: 'log-alive-status-interval',
    describe: 'Log the mqtt client alive status every Z minutes',
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

const ecoflowAPIURL = 'https://api.ecoflow.com',
  ecoflowAPIAuthenticationPath = '/auth/login',
  ecoflowAPICertificationPath = '/iot-auth/app/certification',
  headers = {lang: 'en_US', 'content-type': 'application/json'},
  ecoflowAPI = axios.create({
    baseURL: ecoflowAPIURL,
    timeout: 10000,
  }),
  svitlobotPingURL= `https://api.svitlobot.in.ua/channelPing?channel_key=${svitlobotChannelKey}`,
  svitlobotUpdateInterval = options.svitlobotUpdateInterval * 1000,
  keepAliveInterval = options.keepAlive * svitlobotUpdateInterval,
  logAliveStatusInterval = options.logAliveStatusInterval * 60 * 1000;

const ecoFlowACInput = 'inv.acIn',
  ecoFlowACInputVoltage = `${ecoFlowACInput}Vol`,
  ecoFlowACInputFrequency = `${ecoFlowACInput}Freq`,
  ecoFlowACInputCurrent = `${ecoFlowACInput}Amp`;

let mqttClient = null,
  mqttOptions = null,
  ecoflowTopic = '/app/device/property/',
  lastMQTTMessageTimeStamp = new Date().getTime(),
  lastAliveInfoMessageTimeStamp = new Date().getTime();

function getEcoFlowCredentials() {
  return new Promise((resolve, reject) => {
    if (typeof ecoflowUserName !== 'string' || ecoflowUserName.length === 0
      || typeof ecoflowPassword !== 'string' || ecoflowPassword.length === 0
      || typeof ecoflowDeviceSN !== 'string' || ecoflowDeviceSN.length === 0) {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your EcoFlow username: ')
        .then((username) => {
          ecoflowUserName = username;
          cache.setItem('ecoflowUserName', username);
          rl.question('Enter your EcoFlow password: ')
            .then((password) => {
              ecoflowPassword = password;
              cache.setItem('ecoflowPassword', password);
              rl.question('Enter your EcoFlow device SN: ')
                // eslint-disable-next-line sonarjs/no-nested-functions
                .then((deviceSN) => {
                  ecoflowDeviceSN = deviceSN;
                  cache.setItem('ecoflowDeviceSN', deviceSN);
                  rl.close();
                  resolve();
                })
                // eslint-disable-next-line sonarjs/no-nested-functions
                .catch((error) => {
                  logError(`Error: ${error}`);
                  rl.close();
                  reject(error);
                });
            })
            .catch((error) => {
              logError(`Error: ${error}`);
              rl.close();
              reject(error);
            });
        })
        .catch((error) => {
          logError(`Error: ${error}`);
          rl.close();
          reject(error);
        });
    } else {
      resolve();
    }
  });
}

function getSvitlobotChannelKey() {
  return new Promise((resolve, reject) => {
    if (typeof svitlobotChannelKey !== 'string' || svitlobotChannelKey.length === 0) {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your SvitloBot channel key: ')
        .then((id) => {
          cache.setItem('svitlobotChannelKey', id);
          rl.close();
          if (typeof svitlobotChannelKey === 'string' && svitlobotChannelKey.length > 0) {
            resolve();
          } else {
            reject(new Error('Invalid SvitloBot channel key!'));
          }
        })
        .catch((error) => {
          logError(`Error: ${error}`);
          rl.close();
          reject(error);
        });
    } else {
      resolve();
    }
  });
}


function gracefulExit() {
  if (mqttClient !== null && mqttClient.connected === true) {
    mqttClient.end();
    mqttClient = null;
    logInfo(`Ecoflow MQTT broker is disconnected!`);
  }
  exit(0);
}

function mqttSubscribe() {
  mqttClient.subscribe(ecoflowTopic, (error) => {
    if (error) {
      logError(`Ecoflow MQTT subscription error: ${error}`);
      gracefulExit();
    } else {
      logInfo(`Ecoflow MQTT subscription is successful. Listening to messages ...`);
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
    const inputVoltage = data.params[ecoFlowACInputVoltage] / 1000,
      inputCurrent = data.params[ecoFlowACInputCurrent] / 1000,
      inputFrequency = data.params[ecoFlowACInputFrequency];
    inputACConnectionState = inputVoltage > 0 && inputCurrent > 0 && inputFrequency > 0;
    logDebug(`Ecoflow AC input connection state: ${inputACConnectionState} (voltage: ${inputVoltage} V, current: ${inputCurrent} A, frequency: ${inputFrequency} Hz)`);
    if (firstPing === true) {
      firstPing = false;
      if (inputACConnectionState === true) {
        svitlobotPing();
      }
    }
  }
}


function svitlobotPing() {
  axios
    .get(`${svitlobotPingURL}`)
    .then((response) => {
      logDebug(`Svitlobot status is updated! Response: ${response.statusText}(${response.status}).`);
    })
    .catch((error) => {
      logError(`Svitlobot error: ${error}`);
    });
}

function svitlobotStatusUpdate() {
  const currentTimeStamp = new Date().getTime();
  if (currentTimeStamp - lastMQTTMessageTimeStamp <= svitlobotUpdateInterval) {
    if (inputACConnectionState === true) {
      svitlobotPing();
    }
    if (logAliveStatusInterval > 0 && currentTimeStamp - lastAliveInfoMessageTimeStamp > logAliveStatusInterval) {
      lastAliveInfoMessageTimeStamp = currentTimeStamp;
      logInfo(`Ecoflow MQTT client is alive!`);
    }
  }
  if (currentTimeStamp - lastMQTTMessageTimeStamp > keepAliveInterval) {
    logWarning(`Ecoflow MQTT client is not alive for ${options.svitlobotUpdateInterval * options.keepAlive} seconds!`);
    mqttClient.reconnect();
  }
}

function svitlobotStatusUpdateInit() {
  if (mqttClient !== null) {
    lastMQTTMessageTimeStamp = new Date().getTime();
    setInterval(svitlobotStatusUpdate, svitlobotUpdateInterval);
  }
}

function maskString(value) {
  return typeof value === 'string' ? value.substring(0, 3) + '*'.repeat(value.length - 3) : value;
}

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

getEcoFlowCredentials()
  .then(() => {
    getSvitlobotChannelKey()
      .then(() => {
        ecoflowAPI
          .post(
            ecoflowAPIAuthenticationPath,
            {
              email: ecoflowUserName,
              password: Buffer.from(ecoflowPassword).toString('base64'),
              scene: 'IOT_APP',
              userType: 'ECOFLOW',
            },
            {headers: headers},
          )
          .then((response) => {
            logInfo('Ecoflow authentication is successful. Getting certification ...');
            let token, userId, userName;
            try {
              token = response.data.data.token;
              userId = response.data.data.user.userId;
              userName = response.data.data.user.name;
            } catch (error) {
              throw new Error(`Failed to extract key ${error.message} from response: ${stringify(response)}`);
            }
            logDebug(`Ecoflow token: ${maskString(token)}`);
            logDebug(`Ecoflow userId: ${userId}`);
            logDebug(`Ecoflow userName: ${userName}`);
            const headers = {
              lang: 'en_US',
              authorization: `Bearer ${token}`,
            };
            ecoflowAPI
              .get(`${ecoflowAPICertificationPath}?userId=${userId}`, {headers: headers})
              // eslint-disable-next-line sonarjs/no-nested-functions
              .then((response) => {
                logInfo('Ecoflow certification is successful. Getting MQTT client ...');
                let mqttUrl, mqttPort, mqttProtocol, mqttUsername, mqttPassword, mqttClientId;
                try {
                  mqttUrl = response.data.data.url;
                  mqttPort = parseInt(response.data.data.port, 10); // Ensure port is an integer
                  mqttProtocol = response.data.data.protocol;
                  mqttUsername = response.data.data.certificateAccount;
                  mqttPassword = response.data.data.certificatePassword;
                  // Generate a unique MQTT client ID
                  mqttClientId = `ANDROID_${uuidv4().toUpperCase()}_${userId}`;
                } catch (error) {
                  throw new Error(`Failed to extract key ${error.message} from response: ${stringify(response)}`);
                }
                logDebug(`Ecoflow MQTT URL: ${mqttUrl}`);
                logDebug(`Ecoflow MQTT port: ${mqttPort}`);
                logDebug(`Ecoflow MQTT protocol: ${mqttProtocol}`);
                logDebug(`Ecoflow MQTT username: ${mqttUsername}`);
                logDebug(`Ecoflow MQTT password: ${maskString(mqttPassword)}`);
                logDebug(`Ecoflow MQTT client ID: ${mqttClientId}`);
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
                ecoflowTopic += ecoflowDeviceSN;
                mqtt
                  .connectAsync(connectMQTTUrl, mqttOptions)
                  // eslint-disable-next-line sonarjs/no-nested-functions
                  .then((client) => {
                    mqttClient = client;
                    logInfo('Ecoflow MQTT broker is connected. Subscribing to MQTT topic ...');
                    mqttClient.on('error', (error) => {
                      logError(`Ecoflow MQTT broker error: ${error}`);
                      gracefulExit();
                    });
                    mqttClient.on('connect', () => {
                      logInfo('Ecoflow MQTT broker is connected ...');
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
                    mqttSubscribe();
                  })
                  // eslint-disable-next-line sonarjs/no-nested-functions
                  .catch((error) => {
                    logError(`Ecoflow MQTT broker connection error: ${error}`);
                    gracefulExit();
                  });
              })
              // eslint-disable-next-line sonarjs/no-nested-functions
              .catch((error) => {
                logError(`Ecoflow certification error: ${error}`);
                gracefulExit();
              });
          })
          .catch((error) => {
            logError(`Error: ${error}`);
            gracefulExit();
          });
      })
      .catch((error) => {
        logError(`Error: ${error}`);
        gracefulExit();
      });
  })
  .catch((error) => {
    logError(`Error: ${error}`);
    gracefulExit();
  });
