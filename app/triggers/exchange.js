var helperService = require('../helperService');
var exchangeService = require('../exchangeService');

function isMarketTrend(trigger, coinPair) {
  try {
    var priceData = exchangeService.getPrices()
    var candles = priceData[trigger.candleSize + 'min'];
    var cAmount = candles.length - 1;
    var aGain = 0
    var amount = 0
    for (coin in candles[cAmount - trigger.periods]['data']) {
      var priceNow = candles[cAmount]['data'][coin][trigger.price]

      var priceOld = candles[cAmount - trigger.periods]['data'][coin][trigger.price]

      var gain = (100 / priceOld) * (priceNow - priceOld)

      aGain += gain
      amount++
    }

    aGain = aGain / amount

    return { "status": helperService.checkDiff(trigger, aGain), "value": aGain }
  } catch (e) {
    helperService.logger('Unable to check market trend trigger for ' + coinPair + '.')
    helperService.logger(e, true)
    return {
      "status": false,
      "value": 'Unable to check market trend trigger for ' + coinPair + '.'
    }
  }
}
function isMarketTrend2(trigger, coinPair) {
  try {
    var priceData = exchangeService.getPrices()
    var candles = priceData[trigger.candleSize + 'min'];
    var cAmount = candles.length - 1;
    var priceNow = 0
    var priceOld = 0
    for (coin in candles[cAmount - trigger.periods]['data']) {
      priceNow += candles[cAmount]['data'][coin][trigger.price]
      priceOld += candles[cAmount - trigger.periods]['data'][coin][trigger.price]
    }
    var aGain = (100 / priceOld) * (priceNow - priceOld)
    return { "status": helperService.checkDiff(trigger, aGain), "value": aGain }
  } catch (e) {
    helperService.logger('Unable to check market trend 2 trigger for ' + coinPair + '.')
    helperService.logger(e, true)
    return {
      "status": false,
      "value": 'Unable to check market trend trigger 2 for ' + coinPair + '.'
    }
  }
}


function isCoinTrend(trigger, coinPair) {
  try {
    var priceData = exchangeService.getPrices()
    var candles = priceData[trigger.candleSize + 'min'];
    var cAmount = candles.length - 1;
    var priceNow = candles[cAmount]['data'][coinPair][trigger.price]
    var priceOld = candles[cAmount - trigger.periods]['data'][coinPair][trigger.price]
    var gain = (100 / priceOld) * (priceNow - priceOld)
    return { "status": helperService.checkDiff(trigger, gain), "value": gain }
  } catch (e) {
    helperService.logger('Unable to check coin trend trigger for ' + coinPair + '.')
    helperService.logger(e, true)
    return {
      "status": false,
      "value": 'Unable to check coin trend trigger for ' + coinPair + '.'
    }
  }
}



function isDump(trigger, coinPair) {
  // periods: length to look backup
  // candleSize: candle size
  var priceData = exchangeService.getPrices()
  var candles = priceData[trigger.candleSize + 'min'];
  var high_price = 0;
  var high_candle = 0;
  var low_price = 9999999;
  for (i = 0; i < trigger.periods; i++) {
    var candle = (candles.length + i) - (trigger.periods + 1)
    var price_high = candles[candle]['data'][coinPair]['high']
    if (price_high > high_price) {
      high_price = price_high
      high_candle = candle
    }
  }
  for (i = 0; i < trigger.periods; i++) {
    var candle = (candles.length + i) - (trigger.periods + 1)
    var price_low = candles[candle]['data'][coinPair]['low']
    if ((candle > high_candle) && (price_low < low_price)) {
      low_price = price_low
    }
  }
  var result = (100 / high_price) * (low_price - high_price)
  return { "status": helperService.checkDiff(trigger, result), "value": result }
}



function isPump(trigger, coinPair) {
  // periods: length to look backup
  // candleSize: candle size
  try {
    var priceData = exchangeService.getPrices()
    var candles = priceData[trigger.candleSize + 'min'];
    var high_price = 0;
    var high_candle = 0;
    var low_price = 9999999;
    for (i = 0; i < trigger.periods; i++) {
      var candle = (candles.length + i) - (trigger.periods + 1)
      var price_high = candles[candle]['data'][coinPair]['high']
      if (price_high > high_price) {
        high_price = price_high
        high_candle = candle
      }
    }
    for (i = 0; i < trigger.periods; i++) {
      var candle = (candles.length + i) - (trigger.periods + 1)
      var price_low = candles[candle]['data'][coinPair]['low']
      if ((candle < high_candle) && (price_low < low_price)) {
        low_price = price_low
      }
    }
    var result = (100 / low_price) * (high_price - low_price)
    return { "status": helperService.checkDiff(trigger, result), "value": result }
  } catch (e) {
    helperService.logger('Unable to check pump trigger for ' + coinPair + '.')
    helperService.logger(e, true)
    return {
      "status": false,
      "value": 'Unable to check pump trigger for ' + coinPair + '.'
    }
  }
}


function isCandleTrend(trigger, coinPair) {
  // compares candle open to candle close change.
  // trigger.direction = "up" or "down"
  // trigger.candleSize = candle size 1min, 5min, 15min, 30min, 60min, 240min
   try {
    var priceData = exchangeService.getPrices()
    var candles = priceData[trigger.candleSize + 'min']

    if (candles[candles.length -1]['data'][coinPair]['trend'] == trigger.direction) {
      return { "status": true, "value": trigger.direction }
    } else {
      return { "status": false, "value": trigger.direction }
    }
  } catch (e) {
    helperService.logger('Unable to check candle trend trigger for ' + coinPair + '.')
    helperService.logger(e, true)
    return {
      "status": false,
      "value": 'Unable to check candle trend trigger for ' + coinPair + '.'
    }
  }
}
function isPriceGroup(trigger, coinPair) {
  // checks if the price is in a certain range
  // trigger.candleSize = candle size 1min, 5min, 15min, 30min, 60min, 240min
   try {
    var priceData = exchangeService.getPrices()
    var candles = priceData[trigger.candleSize + 'min']
    var price = trigger.price || "price"

    if (helperService.checkDiff(trigger, candles[candles.length -1]['data'][coinPair][price])) {
      return { "status": true, "value": candles[candles.length -1]['data'][coinPair][price] }
    } else {
      return { "status": false, "value": candles[candles.length -1]['data'][coinPair][price] }
    }
  } catch (e) {
    helperService.logger('Unable to check candle price trigger for ' + coinPair + '.')
    helperService.logger(e, true)
    return false
  }
}

module.exports = {
  isMarketTrend: isMarketTrend,
  isMarketTrend2: isMarketTrend2,
  isCoinTrend: isCoinTrend,
  isCandleTrend: isCandleTrend,
  isPriceGroup: isPriceGroup,
  isPump: isPump,
  isDump: isDump
}
