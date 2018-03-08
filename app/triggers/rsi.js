var helperService = require('../helperService');
var exchangeService = require('../exchangeService');

/*function isRsi(trigger, coinPair) {
  try {
    var priceData = exchangeService.getPrices()
    var candles = priceData[trigger.candleSize + 'min']
    var price = 0;
    var oldprice = 0;
    var gain = 0;
    var loss = 0
    if (candles.length > trigger.periods) {
      for (i = 0; i < trigger.periods; i++) {
        var depth = (candles.length - trigger.periods) + i
        oldprice = price
        price = candles[depth]['data'][coinPair][trigger.price]
        console.log(candles[depth]['data'][coinPair][trigger.price])
        if (i > 0) {
          if (price > oldprice) {
            gain += (price - oldprice)
          } else {
            loss += (oldprice - price)
          }
        }
      }
      var again = gain / trigger.periods
      var aloss = loss / trigger.periods
      var rs = again / aloss
      var rsi = 100 - (100 / (1 + rs))
      console.log(coinPair + ": " + rsi)
      console.log("again: " + again + " - aloss: " + aloss)
      console.log("gain: " + gain + " - loss: " + loss)
      console.log("oldprice: " + oldprice + " - price: " + price)
      return helperService.checkDiff(trigger, rsi)
    } else {
      return false
    }
  } catch (e) {
    console.log(e)
  }
}*/

function isRsi(trigger, coinPair) {
  try {
    var priceData = exchangeService.getPrices()
    var candles = priceData[trigger.candleSize + 'min']
    var price = 0;
    var oldprice = 0;
    var again = 0;
    var aloss = 0
    if (candles.length > trigger.periods) {
      for (candle in candles) {
        oldprice = price
        price = candles[candle]['data'][coinPair][trigger.price]

        if (candle == 0) {
        } if (candle <= trigger.periods) {
          //first rs
          if (price > oldprice) {
            again += (price - oldprice)
          } else if (price < oldprice) {
            aloss += (oldprice - price)
          }
          if (candle == trigger.periods) {
            again = again / trigger.periods
            aloss = aloss / trigger.periods
          }
        } else {
          if (price > oldprice) {
            var gain = (price - oldprice)
            var loss = 0
          } else if (price < oldprice) {
            var loss = (oldprice - price)
            var gain = 0
          } else {
            var gain = 0
            var loss = 0
          }
          again = ((again * (trigger.periods - 1)) + gain) / trigger.periods
          aloss = ((aloss * (trigger.periods - 1)) + loss) / trigger.periods
        }
      }
      var rs = again / aloss
      var rsi = 100 - (100 / (1 + rs))
      return { "status": helperService.checkDiff(trigger, rsi), "value": rsi }
    } else {
      helperService.logger('Unable to calculate RSI for ' + coinPair + '. Probably missing enough data...', true)
      return {
        "status": false,
        "error": 'Unable to calculate RSI for ' + coinPair + '. Probably missing enough data...'
      }
    }
  } catch (e) {
    helperService.logger('Something went wrong calculating RSI for ' + coinPair)
    helperService.logger(e, true)
    return {
      "status": false,
      "error": 'Something went wrong calculating RSI for ' + coinPair
    }
  }
}
module.exports = {
  isRsi: isRsi
}
