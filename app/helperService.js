var fs = require('fs');
const {dirname, join} = require('path');
//

var rulesData = getConfig('rulesConfig');
var appData = getConfig('appConfig');
var ptDefaultData = getConfig('ptDefaultConfig');
var exchangeData = {}



function getContent(path, alternative = {}) {
  try {
    return JSON.parse(fs.readFileSync(join(__basedir,path)));
  } catch (e) {
    logger(path + ' is not a valid json file. Check that the file exists and that the json format is correct.')
    return alternative
  }
}

function getConfig(type) {
  var config = getContent('./config/app.json');
  try {
    return getContent(config['path'][type]);
  } catch (e) {
    logger('Unable to get ' + type + '.')
  }
}

function getPath(path) {
  var config = getContent('./config/app.json');
  return config.path[path]
}


function getRules() {
  return rulesData
}
function getApp() {
  return appData
}
function getPtDefault() {
  return ptDefaultData
}

function loadExchange(alternative) {
  exchangeData = getConfig('exchangeData', alternative);
  return exchangeData
}
function getExchange() {
  return exchangeData
}
function writeExchange(content) {
  fs.writeFile(join(__basedir, getPath('exchangeData')), JSON.stringify(content), function (err) {
    if (err) logger(err, true)
    logger('Updated ' + getPath('exchangeData') + ' file.', true)
  })
}

// Send messages to log with timestamp
function logger(message, debugOnly) {
  if ((!debugOnly) || (appData.debug)) {
    var time = new Date().toISOString();
    if (debugOnly) {
      console.log(time + " - DEBUG: " + message)
    } else { console.log(time + " - " + message) }
  }
}

function getUpdateInterval(type) {
  if (type == 'licenseService') {
    return 60 * 60 * 4
    // 60 seconds * 60 minutes * 4 hours
  } else if (appData.updateIntervals.hasOwnProperty(type)) {
    return appData.updateIntervals[type];
  } else {
    return appData.updateIntervals.default;
  }
}


function observeConfig(type) {
  var config = getContent('./config/app.json');
  try {
    fs.watch(join(__basedir,config.path[type]), (eventType, filename) => {
      if (filename) {
        logger('Detected changes in ' + filename)
        switch(type) {
          case 'rulesConfig':
            rulesData = getConfig(type);
            break;
          case 'appConfig':
            appData = getConfig(type);
            break;
          case 'ptDefaultConfig':
            ptDefaultData = getConfig(type);
            break
        }
      }
    })
  } catch (e) {
    logger('Unable to monitor ' + type + 'changes.')
  }
}

function heartbeat(serviceStatus, type) {
  var currentTime = new Date().getTime();
  var timeDifference = currentTime - (getUpdateInterval(type) * 2 * 1000)
  if (serviceStatus > timeDifference) {
    return true
  } else {
    return false
  }
}


observeConfig('rulesConfig');
observeConfig('appConfig');
observeConfig('ptDefaultConfig');


function orderKeys(obj) {

  var keys = Object.keys(obj).sort(function keyOrder(k1, k2) {
      if (k1 < k2) return -1;
      else if (k1 > k2) return +1;
      else return 0;
  });

  var i, after = {};
  for (i = 0; i < keys.length; i++) {
    after[keys[i]] = obj[keys[i]];
    delete obj[keys[i]];
  }

  for (i = 0; i < keys.length; i++) {
    obj[keys[i]] = after[keys[i]];
  }
  return obj;
}

function checkDiff(trigger, maDiff) {
  if (("minTrigger" in trigger) && ("maxTrigger" in trigger)) {
    if ((maDiff > trigger.minTrigger) && (maDiff < trigger.maxTrigger)) {
      return true
    } else { return false }
  } else if (("minTrigger" in trigger) && (maDiff > trigger.minTrigger)) {
    return true
  } else if (("maxTrigger" in trigger) && (maDiff < trigger.maxTrigger)) {
    return true
  } else if (!("minTrigger" in trigger) && !("maxTrigger" in trigger)) {
    return true
  } else {
    return false
  }
}

module.exports = {
  getConfig: getConfig,
  getPath: getPath,
  logger: logger,
  getRules: getRules,
  rulesData: rulesData,
  getApp: getApp,
  appData: appData,
  getPtDefault: getPtDefault,
  ptDefaultData: ptDefaultData,
  getExchange: getExchange,
  exchangeData: exchangeData,
  getUpdateInterval: getUpdateInterval,
  heartbeat: heartbeat,
  orderKeys: orderKeys,
  checkDiff: checkDiff,
  loadExchange: loadExchange,
  writeExchange: writeExchange
}
