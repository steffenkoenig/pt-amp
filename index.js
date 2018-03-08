var fs = require('fs');
const {dirname, join} = require('path');
global.__basedir = __dirname;

var helper = require('./app/helperService')
helper.logger('░░░░░░░░░░╔═╦╗░░╔╗░░░░░░░░░░░░░░░░░░░')
helper.logger('░░░░░░░░░░║╔╝╚╗░║║░░░░░░░░░░░░░░░░░░░')
helper.logger('╔══╦╗╔╗╔╦╦╝╚╗╔╝░║║╔╦╦═╗╔══╗╔══╦══╦╗╔╗')
helper.logger('║══╣╚╝╚╝╠╬╗╔╣╠══╣╚╝╬╣╔╗╣╔╗║║╔═╣╔╗║╚╝║')
helper.logger('╠══╠╗╔╗╔╣║║║║╚╦═╣╔╗╣║║║║╚╝╠╣╚═╣╚╝║║║║')
helper.logger('╚══╝╚╝╚╝╚╝╚╝╚═╝░╚╝╚╩╩╝╚╩═╗╠╩══╩══╩╩╩╝')
helper.logger('░░░░░░░░░░░░░░░░░░░░░░░╔═╝║░░░░░░░░░░')
helper.logger('░░ © swift-king.com ░░░╚══╝░░░░░░░░░░')

var telegramBot = require('./app/telegramBot');

var web = require('./app/webService');
var rulesProcessor = require('./app/rulesProcessorService');
var cmc = require('./app/cmcService');
var exchange = require('./app/exchangeService');
var trigger = require('./app/triggerService');


try {
  helper.logger("Starting web interface service...")
  web.start();
} catch (e) {
  helper.logger("Unable to start web interface.")
  helper.logger(e)
}
try {
  helper.logger("Starting rules processor service...")
  rulesProcessor.start();
} catch (e) {
  helper.logger("Unable to start rules processor service.")
  helper.logger(e)
}
try {
  helper.logger("Starting trigger service...")
  trigger.start();
} catch (e) {
  helper.logger("Unable to start trigger service.")
  helper.logger(e)
}
try {
  helper.logger("Starting CMC service...")
  cmc.start();
} catch (e) {
  helper.logger("Unable to start CMC service.")
  helper.logger(e)
}
try {
  helper.logger("Starting exchange service...")
  exchange.start();
} catch (e) {
  helper.logger("Unable to start exchange service.")
  helper.logger(e)
}
heartbeat()

function heartbeat(interval = 1) {
  helper.logger("Heartbeat...")
  // Check whether a service continues to be executed. If unforseen happened and routine stopped start it again.
  if (!rulesProcessor.heartbeat()) {
    helper.logger("Detected heartbeat issues with rules processor service. Restarting service ...")
    rulesProcessor.start();
  };
  if (!trigger.heartbeat()) {
    helper.logger("Detected heartbeat issues with trigger service. Restarting service ...")
    trigger.start();
  };
  if (!cmc.heartbeat()) {
    helper.logger("Detected heartbeat issues with CoinMarketCap service. Restarting service ...")
    cmc.start();
  };
  if (!exchange.heartbeat()) {
    helper.logger("Detected heartbeat issues with exchange service. Restarting service ...")
    exchange.start();
  };
  setTimeout(heartbeat, 10 * 60 * 1000)
  // run every 10 minutes
}
