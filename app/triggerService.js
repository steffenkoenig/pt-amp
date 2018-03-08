var status = {}
var helperService = require('./helperService');


var movingAverage = require('./triggers/movingAverage');
var exchange = require('./triggers/exchange');
var macd = require('./triggers/macd');
var rsi = require('./triggers/rsi');
var cci = require('./triggers/cci');
var cmc = require('./triggers/cmc');
var profittrailer = require('./triggers/profittrailer');

const {dirname, join} = require('path');

var rulesData = {}

var serviceStatus = new Date().getTime();
var serviceType = 'checkTriggers'
function heartbeat() {
  return helperService.heartbeat(serviceStatus, serviceType)
}

function start() {
  serviceStatus = new Date().getTime();
  //go through each trigger in the rules.json and check for each coin if active.
  //store status in an object
  /*
  status = {
    "trigger1": {
      "ETHBTC": true
    }
  }
  */
  getRules();
  checkTriggers();

  setTimeout(start, helperService.getUpdateInterval(serviceType) * 1000)
}

function getRules() {
  rulesData = helperService.getConfig('rulesConfig')
}


function checkTriggers() {
  var newstatus = {}
  for (var trigger in rulesData.triggers) {
    if (!((rulesData.triggers[trigger].hasOwnProperty('enabled')) && !(rulesData.triggers[trigger]['enabled']))) {
      if (typeof newstatus[trigger] == "undefined") {
        newstatus[trigger] = {}
      }
      for (coinPair in rulesData.coinPairs) {
        newstatus[trigger][rulesData.coinPairs[coinPair]] = checkTrigger(rulesData.triggers[trigger], rulesData.coinPairs[coinPair]);
      }
    }
  }
  status = newstatus;
}

function checkTrigger(trigger, coinPair) {

  var triggers = {}
  triggers['marketTrend'] = function() { return exchange.isMarketTrend(trigger, coinPair) }
  triggers['marketTrend2'] = function() { return exchange.isMarketTrend2(trigger, coinPair) }
  //triggers['marketDrop'] = function() { return isMarketDrop(trigger, coinPair) }
  triggers['coinTrend'] = function() { return exchange.isCoinTrend(trigger, coinPair) }
  //triggers['coinDrop'] = function() { return isCoinDrop(trigger, coinPair) }
  triggers['candleTrend'] = function() { return exchange.isCandleTrend(trigger, coinPair) }
  triggers['priceGroup'] = function() { return exchange.isPriceGroup(trigger, coinPair) }
  triggers['pump'] = function() { return exchange.isPump(trigger, coinPair) }
  triggers['dump'] = function() { return exchange.isDump(trigger, coinPair) }

  triggers['marketRank'] = function() { return cmc.isValueRange(trigger, coinPair, "rank") }
  triggers['usdPriceGroup'] = function() { return cmc.isValueRange(trigger, coinPair, "price_usd") }
  triggers['usd24hVolume'] = function() { return cmc.isValueRange(trigger, coinPair, "24h_volume_usd") }
  triggers['usdMarketCap'] = function() { return cmc.isValueRange(trigger, coinPair, "market_cap_usd") }
  triggers['totalSupply'] = function() { return cmc.isValueRange(trigger, coinPair, "total_supply") }
  triggers['maxSupply'] = function() { return cmc.isValueRange(trigger, coinPair, "max_supply") }
  triggers['usdPercent1h'] = function() { return cmc.isValueRange(trigger, coinPair, "percent_change_1h") }
  triggers['usdPercent24h'] = function() { return cmc.isValueRange(trigger, coinPair, "percent_change_24h") }
  triggers['usdPercent7d'] = function() { return cmc.isValueRange(trigger, coinPair, "percent_change_7d") }
  triggers['usdPercent24h'] = function() { return cmc.isValueRange(trigger, coinPair, "percent_change_24h") }
  triggers['usdPercentVolume'] = function() { return cmc.isValueRange(trigger, coinPair, "percent_24h_volume_usd") }
  triggers['usdPercentMarket'] = function() { return cmc.isValueRange(trigger, coinPair, "percent_market_cap_usd") }
  triggers['percentSupply'] = function() { return cmc.isSupplyPercentage(trigger, coinPair) }

  triggers['profit'] = function() { return profittrailer.isProfit(trigger, coinPair) }

  triggers['smaCross'] = function() { return movingAverage.isMaCross(trigger, coinPair, "SMA") }
  triggers['emaCross'] = function() { return movingAverage.isMaCross(trigger, coinPair, "EMA") }
  triggers['smaTrend'] = function() { return movingAverage.isMaTrend(trigger, coinPair, "SMA") }
  triggers['emaTrend'] = function() { return movingAverage.isMaTrend(trigger, coinPair, "EMA") }

  triggers['macdHistogram'] = function() { return macd.isMacdHistogram(trigger, coinPair) }
  triggers['macdTrend'] = function() { return macd.isMacdTrend(trigger, coinPair) }

  triggers['rsi'] = function() { return rsi.isRsi(trigger, coinPair) }
  triggers['cci'] = function() { return cci.isCci(trigger, coinPair) }
  triggers['cciTrend'] = function() { return cci.isCciTrend(trigger, coinPair) }

  if ((trigger.hasOwnProperty('type')) && (typeof triggers[trigger.type] === "function"))  {
    return triggers[trigger.type]()
  } else {
    return { "status": false }
  }
}

function getStatus(trigger, coinPair) {
  if (typeof trigger == "undefined") {
    return status
  } else if ((typeof status[trigger] == "undefined") || (typeof status[trigger] == "undefined")) {
    return false
  } else {
    return status[trigger][coinPair];
  }
}



module.exports = {
  start: start,
  heartbeat: heartbeat,
  getStatus: getStatus
}
