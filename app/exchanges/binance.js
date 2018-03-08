const request = require("request");

var helperService = require('../helperService');
// Call to the binance api, returns back results

function pullPrices(market, callback) {
  // pull prices for pairs from https://api.binance.com/api/v1/ticker/price
  var url = "https://api.binance.com/api/v1/ticker/price"
  try {
    request(url, function(err, response, body) {
      var json = JSON.parse(body);
      var resultData = {}
      for (var pair in json) {
        if (json[pair]['symbol'].endsWith(market)) {
          // only pairs from bot market
          resultData[json[pair]['symbol']] = {
            "price": parseFloat(json[pair]['price']),
            "high": parseFloat(json[pair]['price']),
            "low": parseFloat(json[pair]['price']),
            "open": parseFloat(json[pair]['price']),
            "close": parseFloat(json[pair]['price'])
          }
        }
      }
      callback(resultData);
    })
  } catch (e) {
    helperService.logger('Unable to pull prices from binance api.')
    helperService.logger(e)
  }
}


module.exports = {
  pullPrices: pullPrices
}
