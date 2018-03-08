var helperService = require('../helperService');
var exchangeService = require('../exchangeService');


function getCci(priceData, coinPair, candleSize = 5, length = 20, depth = 0) {
  try {
    var candles = priceData[candleSize + 'min']
    var tprice = []
    var tpsma = 0
    var mean = 0
    var cci = 0
    for (i = 0; i < length; i++) {
      var candle = (candles.length + i) - (length + depth + 1)
      var prices = candles[candle]['data'][coinPair]
      var tp = (prices['high'] + prices['low'] + prices['close']) / 3
      tprice.push(tp)
      tpsma += tp
    }
    tpsma = tpsma / length
    for (price in tprice) {
      mean += Math.abs(tpsma - tprice[price])
    }
    mean = mean / length
    cci = (tp - tpsma) / (0.015 * mean)
    return cci

  } catch (e) {
    helperService.logger('Unable to calculate CCI for ' + coinPair + ' using candle size ' + candleSize + ' and length ' + length)
    helperService.logger(e, true)
  }
}


function isCci(trigger, coinPair) {
  try {
    var priceData = exchangeService.getPrices()
    var cci = getCci(priceData, coinPair, trigger.candleSize, trigger.maShort)
    return { "status": helperService.checkDiff(trigger, cci), "value": cci }
  } catch (e) {
    helperService.logger('Something went wrong calculating CCI for ' + coinPair)
    helperService.logger(e, true)
    return {
      "status": false,
      "error": 'Something went wrong calculating CCI for ' + coinPair
    }
  }
}

function isCciTrend(trigger, coinPair) {
  var cciOld = getCci(priceData, coinPair, trigger.candleSize, trigger.maShort, trigger.periods)
  var cciNow = getCci(priceData, coinPair, trigger.candleSize, trigger.maShort)
  var cciDiff = (100 / cciOld) * (cciNow - cciOld)
  return { "status": helperService.checkDiff(trigger, cciDiff), "value": cciDiff }
}

module.exports = {
  isCci: isCci,
  isCciTrend: isCciTrend
}
