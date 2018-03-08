const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');

var helperService = require('./helperService');

var cmcService = require('./cmcService');
var exchangeService = require('./exchangeService');
var triggerService = require('./triggerService');

function start() {
    const app = express();
    const port = process.env.PORT || '3000';
    // Parsers for POST data
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    // Set our api routes
    //app.use('/api', api);
    // Catch all other routes and return the index file
    app.get('/api/cmcData', (req, res) => {
      res.send(cmcService.getData());
    });
    app.get('/api/exchange/prices', (req, res) => {
      res.send(exchangeService.getPrices());
    });
    app.get('/api/exchange/pairs', (req, res) => {
      res.send(exchangeService.getPairs());
    });
    app.get('/api/trigger', (req, res) => {
      res.send(triggerService.getStatus());
    });
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname,'./gui/index.html'));
    });
    // Start server
    app.set('port', port);
    const server = http.createServer(app);
    server.listen(port, () => helperService.logger(`GUI running on localhost:${port}`));
};



function reset() {

}
function heartbeat() {

}

module.exports = {
  start: start,
  reset: reset,
  heartbeat: heartbeat
}
