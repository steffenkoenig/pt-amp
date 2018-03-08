var helperService = require('../helperService');
var exchangeService = require('../exchangeService');
var movingAverage = require('./movingAverage');


function isMacdHistogram(trigger, coinPair) {
  var priceData = exchangeService.getPrices()
  var macd = getMacd(priceData, coinPair, trigger)
  var result = (100 / macd.signal) * (macd.histogram)
  var diff = helperService.checkDiff(trigger, result)
  return { "status": diff, "value": result }
}

function isMacdTrend(trigger, coinPair) {
  try {
    var priceData = exchangeService.getPrices()
    var macdOld = getMacd(priceData, coinPair, trigger, trigger.periods)
    var macdNow = getMacd(priceData, coinPair, trigger)

    //if ((macdNew.histogram > macdOld.histogram) && (trigger.direction == "up")) {
      var maDiff = (100 / macdOld.histogram) * (macdNow.histogram - macdOld.histogram)
      var diff = helperService.checkDiff(trigger, maDiff)
      return { "status": diff, "value": maDiff }
    //} else if ((macdNew.histogram < macdOld.histogram) && (trigger.direction == "down")) {
    //  var maDiff = (100 / macdOld.histogram) * (macdOld.histogram - macdNow.histogram)
    //  var diff = helperService.checkDiff(trigger, maDiff)
    //  return diff
    //} else {
    //  return false
    //}
  } catch (e) {
    helperService.logger('Unable to check MACD trend trigger for ' + coinPair + '.')
    helperService.logger(e, true)
    return {
      "status": false,
      "value": 'Unable to check MACD trend trigger for ' + coinPair + '.'
    }
  }
}

function getMacd(priceData, coinPair, trigger, depth = 0) {
  var macdLine = getMacdLine(priceData, coinPair, trigger, depth)
  var macdData = {
    "1min": []
  }
  for (i = 0; i <= trigger.maSignal; i++) {
    depth = (trigger.maSignal - i) + depth
    var macdOld = getMacdLine(priceData, coinPair, trigger, depth)
    macdData['1min'].push({
      "data": {
        "MACD": {
          "price": macdOld
        }
      }
    })
  }
  var macdSignal = movingAverage.getEma(macdData, "MACD", 1, trigger.maSignal, "price")
  var macdHist  = macdLine - macdSignal
  var result = {
    "line": macdLine,
    "signal": macdSignal,
    "histogram": macdHist
  }
  return result
}

function getMacdLine(priceData, coinPair, trigger = { "candleSize": 5, "maShort": 12, "maLong": 26, "maSignal": 9 }, depth = 0) {
  var maFast = movingAverage.getEma(priceData, coinPair, trigger.candleSize, trigger.maShort, trigger.price, depth)
  var maSlow = movingAverage.getEma(priceData, coinPair, trigger.candleSize, trigger.maLong, trigger.price, depth)
  var macdLine = maFast - maSlow
  return macdLine
}

module.exports = {
  isMacdHistogram: isMacdHistogram,
  isMacdTrend: isMacdTrend
}
