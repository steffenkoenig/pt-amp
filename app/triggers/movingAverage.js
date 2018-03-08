var helperService = require('../helperService');
var exchangeService = require('../exchangeService');


function getSma(priceData, coinPair, candleSize = 5, length = 12, type = "close", depth = 0) {
  try {
    var candles = priceData[candleSize + 'min']
    var sma = 0
    for (i = 0; i < length; i++) {
      var candle = (candles.length + i) - ( length + depth + 1)
      if (candle < 0) { candle = 0 }
      sma += candles[candle]['data'][coinPair][type]
    }
    sma = sma / length
    return sma
  } catch (e) {
    helperService.logger('Unable to calculate SMA for ' + coinPair + ' using candle size ' + candleSize + ' and length ' + length)
    helperService.logger(e, true)
  }
}

function getEma(priceData, coinPair, candleSize = 5, length = 12, type = "close", depth = 0) {
  try {
    var ema = getSma(priceData, coinPair, candleSize, length, type, length)
    var multiplier = (2 / (length + 1))
    var candles = priceData[candleSize + 'min']
    for (i = 0; i < length; i++) {
      var candle = (candles.length + i) - (length + depth + 1)
      if (candle < 0) { candle = 0 }
      var price = candles[candle]['data'][coinPair][type]
      ema = ((price - ema) * multiplier) + ema
    }
    return ema
  } catch (e) {
    helperService.logger('Unable to calculate EMA for ' + coinPair + ' using candle size ' + candleSize + ' and length ' + length)
    helperService.logger(e, true)
  }
}

function isMaCross(trigger, coinPair, type = "SMA") {
  // compares candle open to candle close change.
  // trigger.candleSize = candle size 1min, 5min, 15min, 30min, 60min, 240min
  // trigger.maLong = slow moving avarage (larger number)
  // trigger.maShort = fast moving avarage (smaller number)
  // trigger.minTrigger = minimal percentage between higher SMA to lower SMA.
  // trigger.maxTrigger = maximal percentage
  // trigger.price = open, close, low, high, price(avg)
  // If one is not set it is open to that end.
  // If both not set than just go by direction "up" / "down"
  // "up" = maSlow > maFast       "down" = maSlow < maFast
  try {
    var priceData = exchangeService.getPrices()
    if (type == "SMA") {
      var maSlow = getSma(priceData, coinPair, trigger.candleSize, trigger.maLong, trigger.price)
      var maFast = getSma(priceData, coinPair, trigger.candleSize, trigger.maShort, trigger.price)
    } else if (type == "EMA"){
      var maSlow = getEma(priceData, coinPair, trigger.candleSize, trigger.maLong, trigger.price)
      var maFast = getEma(priceData, coinPair, trigger.candleSize, trigger.maShort, trigger.price)
    }

    //if ((maFast > maSlow) && (trigger.direction == "up")) {
      // uptrend
      var maDiff = (100 / maSlow) * (maFast - maSlow)
      var diff = helperService.checkDiff(trigger, maDiff)
      return { "status": diff, "value": maDiff }
  //  } else if ((maFast < maSlow) && (trigger.direction == "down")) {
      // downtrend
    //  var maDiff = (100 / maSlow) * (maSlow - maFast)
  //    var diff = helperService.checkDiff(trigger, maDiff)
    //  return diff
  //  } else {
  //    return false
  //  }

  } catch (e) {
    helperService.logger('Unable to check moving avarage cross trigger for ' + coinPair + '.')
    helperService.logger(e, true)
    return {
      "status": false,
      "value": 'Unable to check moving avarage cross trigger for ' + coinPair + '.'
    }
  }
}
function isMaTrend(trigger, coinPair, type = "SMA") {
  // compares two moving avarages over a certain period
  // maLong = old moving avarage
  // maShort = current moving avarage
  try {
    var priceData = exchangeService.getPrices()
    if (type == "SMA") {
      var maOld = getSma(priceData, coinPair, trigger.candleSize, trigger.maShort, trigger.price, trigger.periods)
      var maNow = getSma(priceData, coinPair, trigger.candleSize, trigger.maShort, trigger.price)
    } else if (type == "EMA"){
      var maOld = getEma(priceData, coinPair, trigger.candleSize, trigger.maShort, trigger.price, trigger.periods)
      var maNow = getEma(priceData, coinPair, trigger.candleSize, trigger.maShort, trigger.price)
    }

    //if ((maNow > maOld) && (trigger.direction == "up")) {
      // uptrend
      var maDiff = (100 / maOld) * (maNow - maOld)
      var diff = helperService.checkDiff(trigger, maDiff)
      return { "status": diff, "value": maDiff }
    //} else if ((maNow < maOld) && (trigger.direction == "down")) {
      // downtrend
    //  var maDiff = (100 / maOld) * (maOld - maNow)
    //  var diff = helperService.checkDiff(trigger, maDiff)
    //  return diff
    //} else {
    //  return false
    //}

  } catch (e) {
    helperService.logger('Unable to check moving avarage trend trigger for ' + coinPair + '.')
    helperService.logger(e, true)
    return {
      "status": false,
      "value": 'Unable to check moving avarage trend trigger for ' + coinPair + '.'
    }
  }
}


module.exports = {
  isMaTrend: isMaTrend,
  isMaCross: isMaCross
}
