/** @module logging **/
const strftime = require('strftime');

const logLevelDebug = 0,
  logLevelInfo = 1,
  logLevelWarning = 2,
  logLevelError = 3;

let logLevel = logLevelInfo;

/**
 * Set the log level
 * @param {number} level - The log level
 **/
function setLogLevel(level) {
  logLevel = level;
}

/**
 * To show the prefix of the logs
 * @param {string} level - The log level
 * @returns {string} - The prefix of the log
 **/
function logPrefix(level) {
  return `[${strftime('%Y-%m-%dT%H:%M:%S.%L')}] [${level}] - `;
}

/**
 * Log debug messages
 * @param {string} message - The message to log
 */
function logDebug(message) {
  if (logLevel <= logLevelDebug) {
    console.log(`${logPrefix('DBG ')}${message}`);
  }
}

/**
 * Log informational messages
 * @param {string} message - The message to log
 */
function logInfo(message) {
  if (logLevel <= logLevelInfo) {
    console.log(`${logPrefix('INFO')}${message}`);
  }
}

/**
 * Log warnings
 * @param {string} message - The message to log
 */
function logWarning(message) {
  if (logLevel <= logLevelWarning) {
    console.warn(`${logPrefix('WARN')}${message}`);
  }
}

/**
 * Log errors messages
 * @param {string} message - The message to log
 */
function logError(message) {
  if (logLevel <= logLevelError) {
    console.error(`${logPrefix('ERR ')}${message}`);
  }
}

module.exports = {
  logLevelDebug,
  logLevelInfo,
  logLevelWarning,
  logLevelError,
  setLogLevel,
  logDebug,
  logInfo,
  logWarning,
  logError,
};
