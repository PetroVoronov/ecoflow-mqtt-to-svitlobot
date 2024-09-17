const {LEVEL, MESSAGE} = require('triple-beam');
const {format} = require('logform');
const {combine, timestamp, colorize, printf} = format;

class SecuredLogger {
  maskCharactersVisible = 3;
  maskWords = [
    'token',
    'secret',
    'key',
    'pass',
    'pwd',
    'auth',
    'username',
    'user',
    'mail',
    'login',
    'credential',
    'session',
    'cookie',
    'bearer',
  ];

  levels = {
    debug: 'cyan',
    info: 'yellow',
    warn: 'magenta',
    error: 'red',
  };

  constructor(level = 'info') {
    this.level = level;
    this.formatter = combine(
      timestamp({format: 'YYYY-MM-DD' + 'T' + 'HH:mm:ss.SSS' /* myTimeFormat */}),
      printf(({level, message, timestamp}) => `[${timestamp}] [${level}] - [${message}]`),
      colorize({all: true, colors: this.levels}),
    );
  }

  setLevel(level) {
    if (!Object.keys(this.levels).includes(level)) {
      throw new Error(`Invalid log level: ${level}`);
    } else {
      this.level = level;
    }
  }

  setMaskCharactersVisible(value) {
    this.maskCharactersVisible = value;
  }

  setMaskWords(value) {
    if (Array.isArray(value)) {
      this.maskWords = value;
    }
  }

  appendMaskWord(...value) {
    this.maskWords.push(...value.map((item) => item.toLowerCase()));
  }

  removeMaskWord(...value) {
    this.maskWords = this.maskWords.filter((word) => !value.map((item) => item.toLowerCase()).includes(word));
  }

  canSend(level) {
    return (
      Object.keys(this.levels).includes(level) && Object.keys(this.levels).indexOf(level) >= Object.keys(this.levels).indexOf(this.level)
    );
  }

  log(level, message) {
    if (this.canSend(level)) {
      let messageText = message;
      if (typeof messageText === 'string') {
        super._log(level, message, color);
      } else if (Array.isArray(message)) {
        messageText = message.reduce((acc, item) => {
          return `${acc}${this.processMessageObject(item)}`;
        }, '');
      }
      if (typeof messageText === 'string') {
        console.log(this.formatter.transform({level, [LEVEL]: level, message: messageText})[MESSAGE]);
      }
    }
  }

  processMessageObject(message) {
    if (typeof message === 'object') {
      return Object.keys(message).reduce((acc, key) => {
        return `${acc ? acc + ', ' : ''}${this.processMessageItem(key, message[key])}`;
      }, '');
    }
    return message;
  }

  maskString(value) {
    if (typeof value !== 'string') {
      return value;
    } else {
      let visibleLength = this.maskCharactersVisible;
      if ((value.startsWith(`"`) && value.endsWith(`"`)) || (value.startsWith(`'`) && value.endsWith(`'`))) {
        visibleLength += 1;
      }
      if (value.length <= visibleLength) {
        return '*'.repeat(value.length);
      } else if (value.length <= visibleLength * 3) {
        return value.substring(0, visibleLength) + '*'.repeat(value.length);
      } else {
        return (
          value.substring(0, visibleLength) + '*'.repeat(value.length - visibleLength * 2) + value.substring(value.length - visibleLength)
        );
      }
    }
  }

  maskMessageItem(key, value) {
    if (typeof key === 'string' && typeof value === 'string') {
      const keyLower = key.toLowerCase();
      return this.maskWords.some((word) => keyLower.includes(word)) ? this.maskString(value) : value;
    }
    return value;
  }

  processMessageItem(key, value) {
    let maskedValue = this.maskMessageItem(key, value);
    if (key.startsWith('-')) {
      return maskedValue;
    } else {
      if (typeof maskedValue === 'string') {
        maskedValue = `"${maskedValue}"`;
      }
      return `${key}: ${maskedValue}`;
    }
  }

  error(...message) {
    this.log('error', message);
  }

  warn(...message) {
    this.log('warn', message);
  }

  info(...message) {
    this.log('info', message);
  }

  debug(...message) {
    this.log('debug', message);
  }
}

const securedLogger = new SecuredLogger('info');

exports.securedLogger = securedLogger;
