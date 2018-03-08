var helperService = require('../helperService');
var cmc = require('../cmcService');


function isSupplyPercentage(trigger, coinPair) {
  // Check percentage of supply compared to max_supply
  try {
    var cmcData = cmc.getData()
    var market = helperService.getPtDefault()['pairs']['MARKET']
    var coin = coinPair.replace(market, "");
    coin = coin.replace("-", "");
    coin = coin.replace("_", "");
    var percentage = (100 * cmcData[coin]['total_supply']) / cmcData[coin]['total_supply']
    if (helperService.checkDiff(trigger, percentage)) {
      return { "status": true, "value": percentage }
    } else {
      return { "status": false, "value": percentage }
    }
  } catch (e) {
    helperService.logger('Unable to check CMC precentSupply trigger for ' + coin + '.')
    helperService.logger(e, true)
    return {
      "status": false,
      "error": 'Unable to check CMC precentSupply trigger for ' + coin + '.'
    }
  }
}

function isValueRange(trigger, coinPair, type) {
  try {
    var cmcData = cmc.getData()
    var market = helperService.getPtDefault()['pairs']['MARKET']
    var coin = coinPair.replace(market, "");
    coin = coin.replace("-", "");
    coin = coin.replace("_", "");
    if (helperService.checkDiff(trigger, cmcData[coin][type])) {
      return { "status": true, "value": cmcData[coin][type] }
    } else {
      return { "status": false, "value": cmcData[coin][type] }
    }
  } catch (e) {
    helperService.logger('Unable to check CMC ' + type + ' trigger for ' + coin + '.')
    helperService.logger(e, true)
    return {
      "status": false,
      "error": 'Unable to check CMC ' + type + ' trigger for ' + coin + '.'
    }
  }
}


module.exports = {
  isSupplyPercentage: isSupplyPercentage,
  isValueRange: isValueRange
}
