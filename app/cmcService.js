
const request = require("request");
const url = "https://api.coinmarketcap.com/v1/ticker/?limit=1000";
const url_global = "https://api.coinmarketcap.com/v1/global/";

var helperService = require('./helperService');

var globalData = {}
var serviceData = {}
// calls to coin market cap
var serviceStatus = new Date().getTime();
var serviceType = 'loadCMCData'
function heartbeat() {
  return helperService.heartbeat(serviceStatus, serviceType)
}

function start() {
  serviceStatus = new Date().getTime();

  backupData(function() {
    checkBackup(function() {
      pullData(function() {
        cleanData(function() {
          writeData(function() {
            checkData(function() {
              setTimeout(start, helperService.getUpdateInterval(serviceType) * 1000)
            })
          })
        })
      })
    })
  })
  // pull data from CMC https://api.coinmarketcap.com/v1/ticker/
}

function backupData(callback) {
  try {
    callback()
  } catch (e) {
    helperService.logger('Unable to backup CMC data.')
    helperService.logger(e)
  }
}
function checkBackup(callback) {
  try {
    callback()
  } catch (e) {
    helperService.logger('Unable to check CMC data backup.')
    helperService.logger(e)
  }
}

function pullData(callback) {
  try {
    request(url_global, function(err, response, body_global) {
      var json_global = JSON.parse(body_global);

      globalData = {
        "total_market_cap_usd": parseFloat(json_global['total_market_cap_usd']),
        "total_24h_volume_usd": parseFloat(json_global['total_24h_volume_usd'])
      }

      request(url, function(err, response, body) {
        var json = JSON.parse(body);
        var resultData = {}
        for (var coin in json) {
          var percentage_market_cap_usd = (100 / globalData['total_market_cap_usd']) * parseFloat(json[coin]['market_cap_usd'])
          var percentage_24h_volume_usd = (100 / globalData['total_24h_volume_usd']) * parseFloat(json[coin]['24h_volume_usd'])

          resultData[json[coin]['symbol']] = {
            "rank": parseFloat(json[coin]['rank']),
            "price_usd": parseFloat(json[coin]['price_usd']),
            "24h_volume_usd": parseFloat(json[coin]['24h_volume_usd']),
            "market_cap_usd": parseFloat(json[coin]['market_cap_usd']),
            "total_supply": parseFloat(json[coin]['total_supply']),
            "max_supply": parseFloat(json[coin]['max_supply']),
            "percent_change_1h": parseFloat(json[coin]['percent_change_1h']),
            "percent_change_24h": parseFloat(json[coin]['percent_change_24h']),
            "percent_change_7d": parseFloat(json[coin]['percent_change_7d']),
            "percent_market_cap_usd": percentage_market_cap_usd.round(4),
            "percent_24h_volume_usd": percentage_24h_volume_usd.round(4)

          }
        }
        serviceData = resultData;
        callback();
      })
    })

  } catch (e) {
    helperService.logger('Unable to pull data from CMC website.')
    helperService.logger(e)
  }
}
function cleanData(callback) {
  try {
    // clean up storage after 24h and reduce to 5 minute values
    // clean up storage after 7days and reduce to 15 minute values
    // clean up storage after 30days and reduce to 1 hour values
    // clean up storage after 6month  and reduce to 4 hour values
    // clean up storage after 12month and reduce to 12 hour values
    callback()
  } catch (e) {
    helperService.logger('Unable to clean up CMC data.')
    helperService.logger(e)
  }
}
function writeData(callback) {
  try {
    callback()
  } catch (e) {
    helperService.logger('Unable to write CMC data.')
    helperService.logger(e)
  }
}
function checkData(callback) {
  try {
    callback()
  } catch (e) {
    helperService.logger('Unable to check CMC data.')
    helperService.logger(e)
  }
}

function getData() {
  return serviceData
}

module.exports = {
  start: start,
  heartbeat: heartbeat,
  getData: getData
}

Number.prototype.round = function(places) {
  return +(Math.round(this + "e+" + places)  + "e-" + places);
}
