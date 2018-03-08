var telegramBot = require('slimbot');
var helper = require('./helperService')

try {
  var config = helper.getConfig('appConfig');
  const telegram = new telegramBot(config.telegram.token);
} catch (e) {
  helper.logger('Unable to start telegram bot.')
}

function start() {

    telegram.on('message', message => {
      telegram.sendMessage(message.chat.id, 'Message received')
    });
    telegram.startPolling();
}

function send(message) {
  return telegram.sendMessage(config.telegram.chatId, message);
}

module.exports = {
  start: start,
  send: send
}
