// Handler for different exchange apis

// select exchange according to settings and forward calls accordingly
// individual exchange files all return results in same format
var helperService = require('./helperService');
var config = helperService.getConfig('appConfig')

var priceData = {
  "1min": [],
  "5min": [],
  "15min": [],
  "30min": [],
  "60min": [],
  "240min": []
}
var cycles = {
  "1min": 0,
  "5min": 0,
  "15min": 0,
  "30min": 0,
  "60min": 0,
  "240min": 0
}

var serviceStatus = new Date().getTime();
var serviceType = 'loadExchangeData'
function heartbeat() {
  return helperService.heartbeat(serviceStatus, serviceType)
}


function start() {
  serviceStatus = new Date().getTime();
  switch(config.exchange) {
    case 'BINANCE':
      exchange = require('./exchanges/binance')
      break;
    case 'BITTREX':
      // not yet implemented
      //this.exchange = require('./bittrex')
      //break;
    case 'POLONIEX':
      // not yet implemented
      //this.exchange = require('./poloniex')
      //break;
    default:
      exchange = require('./exchanges/binance')
      break;
  }
  var market = helperService.getPtDefault()['pairs']['MARKET']
  priceData = helperService.loadExchange(priceData);
  exchange.pullPrices(market,  function(resultData) {
    generateCandlesProcess(resultData, priceData, function(priceResult) {
      priceData = priceResult
      helperService.writeExchange(priceData);
      setTimeout(start, helperService.getUpdateInterval(serviceType) * 1000)
    })
  });
}

function generateCandlesProcess(resultData, priceData, callback) {
  addToPriceData(resultData, priceData, '1min', function(priceResult) {

    generateCandles(priceResult, { 'size': 5, 'source': 1 }, true, function(resultData, increase) {
      addToPriceData(resultData, priceData, '5min', function(priceResult) {

        generateCandles(priceResult, { 'size': 15, 'source': 5 }, increase, function(resultData, increase) {
          addToPriceData(resultData, priceData, '15min', function(priceResult) {

            generateCandles(priceResult, { 'size': 30, 'source': 15 }, increase, function(resultData, increase) {
              addToPriceData(resultData, priceData, '30min', function(priceResult) {

                generateCandles(priceResult, { 'size': 60, 'source': 30 }, increase, function(resultData, increase) {
                  addToPriceData(resultData, priceData, '60min', function(priceResult) {

                    generateCandles(priceResult, { 'size': 240, 'source': 60 }, increase, function(resultData, increase) {
                      addToPriceData(resultData, priceData, '240min', function(priceResult) {

                        callback(priceResult);
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })
}

function generateCandles(priceData, window, increase, callback) {
  var rate = window.size / window.source
  var resultData = {}
  if (cycles[window.size + 'min'] >= rate) {
    // generate generate candles..
    /*
    priceData = {
    "1min": [
      {"time": 1234567890, "data": {
      "COIN": {"price": 123}
      }}
    ],
    "5min": [
      {"time": 1234567890, "data": {
      "COIN": {"price": avarage, "high": 1, "low": 1, "open": 1, "close": 1}
    }}
  ]}
    */
    var oldwindow = window.source + 'min'
    var entries = priceData[oldwindow].length
    var candle = {}
    for (i = rate; i > 0; i--) {

      var oldcandle = priceData[oldwindow][entries - i]['data'];
      for (pair in oldcandle) {
        if (!candle.hasOwnProperty(pair)) {
          candle[pair] = {
            "price": 0,
            "high": 0,
            "low": 0,
            "open": 0,
            "close": 0,
            "trend": "none"
          }
        }
        if (i == rate) {
          candle[pair]['open'] = oldcandle[pair]['open']
        }
        if (i == 1) {
          candle[pair]['close'] = oldcandle[pair]['close']
        }
        if (oldcandle[pair]['high'] > candle[pair]['high']) {
          candle[pair]['high'] = oldcandle[pair]['high']
        }
        if ((oldcandle[pair]['low'] < candle[pair]['low']) || (candle[pair]['low'] == 0)) {
          candle[pair]['low'] = oldcandle[pair]['low']
        }
        var lastprice = candle[pair]['price']
        var oldprice = oldcandle[pair]['price']
        var n = rate - i;
        var newprice = ((lastprice * n) + oldprice) / (n + 1)
        candle[pair]['price'] = +newprice.round(8)

        if (candle[pair]['open'] < candle[pair]['close']) {
          candle[pair]['trend'] = "up";
        } else {
          candle[pair]['trend'] = "down";
        }

      }
    }
    cycles[window.size + 'min'] = 0
    callback(candle, true)
  } else {
    if (increase) {
      cycles[window.size + 'min']++
    }
    callback()
  }
}

function addToPriceData(resultData, priceData, time, callback) {
  if (resultData !== undefined) {
    if (!priceData.hasOwnProperty(time)) {
      priceData[time] = [];
    }
    priceData[time].push({
      "time": serviceStatus,
      "data": resultData
    });
    var length = 500
    if (priceData[time].length > length) {
      var delamount = priceData[time].length - length
      priceData[time].splice(0,delamount)
    }
  }
  callback(priceData)
}



function getPrices() {
  return priceData
}

function getPairs() {
  var lastentry = priceData['1min'][priceData['1min'].length - 1]
  var pairs = []
  for (pair in lastentry.data) {
    pairs.push(pair)
  }
  return pairs
}

module.exports = {
  start: start,
  heartbeat: heartbeat,
  getPrices: getPrices,
  getPairs: getPairs
}

Number.prototype.round = function(places) {
  return +(Math.round(this + "e+" + places)  + "e-" + places);
}
