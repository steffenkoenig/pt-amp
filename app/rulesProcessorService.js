var helperService = require('./helperService');
var triggerService = require('./triggerService');
var fs = require('fs');
const {dirname, join} = require('path');


var ruleStatus = {};
var resultConfig;
var rulesData;
var defaultConfig;

var serviceStatus = new Date().getTime();
var serviceType = 'generatePtConfig'
function heartbeat() {
  return helperService.heartbeat(serviceStatus, serviceType)
}

function start() {
  serviceStatus = new Date().getTime();
  //loop start every x minutes

  getData(function() {
    generateConfig(function() {
      updateCommands(function() {
        updateOffsets('pairs', function() {
          updateOffsets('dca', function() {
            updateOffsets('indicators', function() {
              writeResultConfig(function() {
                setTimeout(start, helperService.getUpdateInterval(serviceType) * 1000)
              })
            })
          })
        })
      })
    })
  })

}
function getData(callback) {
  rulesData = helperService.getRules();
  defaultConfig = helperService.getPtDefault();
  callback()
}
function generateConfig(callback) {
  ruleStatus = {};
  //defaultConfig = getDefaultConfig();
  //resultConfig = defaultConfig;
  try {
    for (var rule in rulesData.rules) {
      if (!((rulesData.rules[rule].hasOwnProperty('enabled')) && !(rulesData.rules[rule]['enabled']))) {
      //go through each rule
        ruleStatus[rule] = {};
        for (var trigger in rulesData.rules[rule]['triggerID']) {
          // go through each trigger in that rule
          if (!((rulesData.triggers[rulesData.rules[rule]['triggerID'][trigger]].hasOwnProperty('enabled')) && !(rulesData.triggers[rulesData.rules[rule]['triggerID'][trigger]]['enabled']))) {
            for (var coinPair in rulesData.coinPairs) {
              // Each coinpair gets checked for its triggers
              if (rulesData.rules[rule].triggerUseOr) {
                // If any of the rule needs to apply
                if (getTriggerStatus(rulesData.rules[rule]['triggerID'][trigger], rulesData.coinPairs[coinPair])) {
                  // if one trigger is active return true
                  ruleStatus[rule][rulesData.coinPairs[coinPair]] = true
                  //break;
                } else if (!ruleStatus[rule][rulesData.coinPairs[coinPair]]) {
                  ruleStatus[rule][rulesData.coinPairs[coinPair]] = false
                }
              } else {
                // If all of the rules have to apply
                if (!("cp" in ruleStatus[rule]) && getTriggerStatus(rulesData.rules[rule]['triggerID'][trigger], rulesData.coinPairs[coinPair])) {
                  ruleStatus[rule][rulesData.coinPairs[coinPair]] = true;
                } else if (!getTriggerStatus(rulesData.rules[rule]['triggerID'][trigger], rulesData.coinPairs[coinPair])) {
                  // if any trigger is not triggered, stop for loop
                  ruleStatus[rule][rulesData.coinPairs[coinPair]] = false;
                  //break;
                }
              }
            }
          }
        }
      }
      /*
      ruleStatus {
        "rule1": { "ETHBTC": true, "XVGBTC": true }
      }
      */
    }
    callback()
  } catch (e) {
    helperService.logger('Unable to check rule status.')
    helperService.logger(e, true)
  }
}

function updateCommands(callback) {
  try {
    resultConfig = JSON.parse(JSON.stringify(defaultConfig));
    // update commands in resultConfig based on rules
    for (var rule in rulesData.rules) {
      if (!((rulesData.rules[rule].hasOwnProperty('enabled')) && !(rulesData.rules[rule]['enabled']))) {
        for (var conf in rulesData.rules[rule].configSetID) {
          var config = rulesData.rules[rule].configSetID[conf]
          if (!((rulesData.configSets[config].hasOwnProperty('enabled')) && !(rulesData.configSets[config]['enabled']))) {
            for (var coinPair in ruleStatus[rule]) {
              if (ruleStatus[rule][coinPair]) {
                //general commands
                updateCommandTypes(rulesData.configSets[config]['commands'], 'pairs', coinPair);
                updateCommandTypes(rulesData.configSets[config]['commands'], 'dca', coinPair);
                updateCommandTypes(rulesData.configSets[config]['commands'], 'indicators', coinPair);
              }
            }
          }
        }
      }
    }
    callback()
  } catch (e) {
    helperService.logger('Unable to set commands of result config.')
    helperService.logger(e, true)
  }
}
function updateCommandTypes(commands, type, coinPair) {
  try {
    for (var cmd in commands[type]) {
      resultConfig[type][cmd.replace("COIN", coinPair)] = commands[type][cmd]
    }
  } catch (e) {
    helperService.logger('Unable to update command types.')
    helperService.logger(e, true)
  }
}

function updateOffsets(type, callback) {
  // add the offsets
  try {
    for (var rule in rulesData.rules) {
      if (!((rulesData.rules[rule].hasOwnProperty('enabled')) && !(rulesData.rules[rule]['enabled']))) {
        for (var conf in rulesData.rules[rule].configSetID) {
          var offsetDone = {}
          var config = rulesData.rules[rule].configSetID[conf]
          if (!((rulesData.configSets[config].hasOwnProperty('enabled')) && !(rulesData.configSets[config]['enabled']))) {
            for (var coinPair in ruleStatus[rule]) {
              if (ruleStatus[rule][coinPair]) {
                // offset commands
                // Each coinpair in each configset in each rule
                // add offset for each command once in each rule
                for (var cmd in rulesData.configSets[config]['offsets'][type]) {
                  var command = cmd.replace("COIN", coinPair);
                  var offset = rulesData.configSets[config]['offsets'][type][cmd];
                  if (!offsetDone.hasOwnProperty(command)) {
                    // If command has not yet been modified in this rule
                    if (!isNaN(offset)) {
                      // offset is a number
                      if (resultConfig[type].hasOwnProperty(command)) {
                        // If resultConfig knows that command already
                        resultConfig[type][command] = offset + resultConfig[type][command]
                      } else {
                        // resultConfig doesnt know the command
                        if (defaultConfig[type].hasOwnProperty(cmd.replace("COIN","ALL"))) {
                          // if ALL_command exists use that as basis
                          resultConfig[type][command] = offset + defaultConfig[type][cmd.replace("COIN","ALL")]
                        } else {
                          // else create new command just with offset
                          resultConfig[type][command] = offset
                        }
                      }
                    } else if (offset.endsWith('%')) {
                      // offset is not a number
                      var percentage = offset.replace( /\D+/g, '');
                      if (resultConfig[type].hasOwnProperty(command)) {

                        var perdiff = (resultConfig[type][command] / 100) * percentage
                        perdiff = +perdiff.round(8)
                        resultConfig[type][command] = resultConfig[type][command] + perdiff

                      } else if (defaultConfig[type].hasOwnProperty(cmd.replace("COIN","ALL"))) {

                        var perdiff = (defaultConfig[type][command] / 100) * percentage
                        perdiff = +perdiff.round(8)
                        resultConfig[type][command] = defaultConfig[type][cmd.replace("COIN","ALL")] + perdiff

                      }
                    }
                  }
                  offsetDone[command] = true
                }
              }
            }
          }
        }
      }
    }
    callback()
  } catch (e) {
    helperService.logger('Unable calculate ' + type + 'offsets in result config.')
    helperService.logger(e, true)
  }
}


function getTriggerStatus(trigger, coinPair) {
  try {
    if (triggerService.getStatus(trigger, coinPair)['status']) {
      return true
    } else {
      return false
    }
  } catch (e) {
    helperService.logger('Unable to get trigger status in rules processor.')
    helperService.logger(e, true)
  }
}




function writeResultConfig(callback) {
  try {
    if (helperService.getApp()['profittrailer']['updatePairs']) {
      writeConfig('pairs');
    }
  } catch (e) {
    helperService.logger('Unable to write pairs result config')
    helperService.logger(e, true)
  }
  try {
    if (helperService.getApp()['profittrailer']['updateDca']) {
      writeConfig('dca');
    }
  } catch (e) {
    helperService.logger('Unable to write DCA result config')
    helperService.logger(e, true)
  }
  try {
    if (helperService.getApp()['profittrailer']['updateIndicators']) {
      writeConfig('indicators')
    }
  } catch (e) {
    helperService.logger('Unable to write Indicators result config')
    helperService.logger(e, true)
  }
  callback();
}
function writeConfig(type) {
  var content = "";
  var orderedResult = helperService.orderKeys(resultConfig[type.toLowerCase()])
  for (var cmd in orderedResult) {
    content += cmd + " = " + orderedResult[cmd] + "\n"
  }
  fs.writeFile(join(__basedir, helperService.getPath('ptConfigFolder'), './' + type.toUpperCase() + '.properties'), content, function (err) {
    if (err) helperService.logger(err, true)
    helperService.logger('Updated ' + type.toLowerCase() + ' file.')
  })
}

Number.prototype.round = function(places) {
  return +(Math.round(this + "e+" + places)  + "e-" + places);
}


module.exports = {
  start: start,
  heartbeat: heartbeat
}
