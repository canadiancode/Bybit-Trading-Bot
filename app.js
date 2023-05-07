// Heroku webhook URL to add into Tradingview: https://pcc-crab-market-bot.herokuapp.com/webhook

    // installed NPM packages:
// dotenv: pull info from .env file
// express: web application framework 
// ws: web socket 
// node-fetch: fetch API for node
// body-parser: parse incoming JSON payloads
// axios: promised based HTTPS requests 
// url: helps with parsing the proxy URL for setting up QuotaGuard Static IP

// sudo -g ngrok: sets up link to remote access apps for testing 

require('dotenv').config();


    // GET PRICE FEED -- GET PRICE FEED -- GET PRICE FEED -- GET PRICE FEED

const WebSocket = require('ws');

let currentBitcoinPrice = '';
let timestamp = Date.now().toString();

function connectWebSocket() {

  const webSocketEndpoint = 'wss://stream.bybit.com/contract/usdt/public/v3';
  const ws = new WebSocket(webSocketEndpoint);

  ws.on('open', () => {

    console.log('WebSocket connection established');

    // Subscribe to the kline channel for BTCUSD with a 1-second interval
    ws.send(JSON.stringify({
    op: 'subscribe',
    args: ["kline.1.BTCUSDT"],
    }));

  });

  ws.on('message', (data) => {

    let bitcoinObject = JSON.parse(data);

    if (bitcoinObject.topic && bitcoinObject.topic.startsWith('kline.1.BTCUSDT')) {
      
      const klineData = bitcoinObject.data[0];
      console.log(`Bitcoin Price: ${klineData.close}`);

      timestamp = klineData.timestamp;
      currentBitcoinPrice = klineData.close;

    } else {
    console.log('Received data:', currentBitcoinPrice);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', (code, reason) => {
    console.log(`WebSocket connection closed: ${code} - ${reason}`);
    setTimeout(() => {
      console.log('Reconnecting WebSocket...');
      connectWebSocket();
    }, 500);
  });

};
connectWebSocket();

    // CREATE WEBHOOK URL -- CREATE WEBHOOK URL -- CREATE WEBHOOK URL

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {

  console.log('TradingView alert received:', req.body);
  const comment = req.body.comment;

  if (comment === 'Long') {
    console.log('Going Long!')
    postLongOrderEntry();
  } else if (comment === 'Short') {
    console.log('Going Short!')
    postShortOrderEntry();
  } else {
    console.log('Exiting Position!')
    closePosition();
  };

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`TradingView webhook listener is running on port ${port}`);
});

// for testing purposes, open two terminals
// On one, run 'node app.js'
// On the other run 'ngrok http 3000' & copy the https link adding the /webhook at the end to tradingview
// the comment on Tradingview should be formatted like so: { "comment": "{{strategy.order.comment}}" }


    // POST ORDER TO BYBIT -- POST ORDER TO BYBIT -- POST ORDER TO BYBIT

const quotaGuardUrl = require('url');
const crypto = require('crypto');
const axios = require('axios');

// Configure axios to use the QuotaGuard Static proxy
if (process.env.QUOTAGUARDSTATIC_URL) {
  const proxyUrl = quotaGuardUrl.parse(process.env.QUOTAGUARDSTATIC_URL);
  axios.defaults.proxy = {
    host: proxyUrl.hostname,
    port: proxyUrl.port,
    auth: {
      username: proxyUrl.username,
      password: proxyUrl.password,
    },
  };
}

url = 'https://api.bybit.com';

var apiKey = process.env.BYBIT_API_KEY;
var secret = process.env.BYBIT_API_SECRET;
var recvWindow = 5000;

function getSignature(parameters, secret) {
  return crypto.createHmac('sha256', secret).update(timestamp + apiKey + recvWindow + parameters).digest('hex');
};

async function http_request(endpoint,method,data,Info) {

  var sign=getSignature(data,secret);
  if(method=="POST") {
    fullendpoint=url+endpoint;
  } else{
    fullendpoint=url+endpoint+"?"+data;
    data="";
  }

  // Add the proxy configuration
  const proxyURL = process.env.QUOTAGUARDSTATIC_URL;
  const proxyConfig = proxyURL ? quotaGuardUrl.parse(proxyURL) : null;

  var config = {
    method: method,
    url: fullendpoint,
    headers: { 
      'X-BAPI-SIGN-TYPE': '2', 
      'X-BAPI-SIGN': sign, 
      'X-BAPI-API-KEY': apiKey, 
      'X-BAPI-TIMESTAMP': timestamp, 
      'X-BAPI-RECV-WINDOW': '5000', 
      'Content-Type': 'application/json; charset=utf-8'
    },
    data : data ? JSON.stringify(JSON.parse(data)) : "",
    proxy: proxyConfig,
  };
  
  console.log(Info + " Calling....");

  await axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });
};

// Fetch Wallet Balance
let currentWalletBalance = 0;
async function walletBalance(endpoint, method, data, Info) {

  var sign = getSignature(data, secret);
  let fullendpoint = url + endpoint;

  // Add the proxy configuration
  const proxyURL = process.env.QUOTAGUARDSTATIC_URL;
  const proxyConfig = proxyURL ? quotaGuardUrl.parse(proxyURL) : null;

  var config = {
    method: method,
    url: fullendpoint,
    headers: { 
      'X-BAPI-SIGN-TYPE': '2', 
      'X-BAPI-SIGN': sign, 
      'X-BAPI-API-KEY': apiKey, 
      'X-BAPI-TIMESTAMP': timestamp, 
      'X-BAPI-RECV-WINDOW': '5000', 
      'Content-Type': 'application/json; charset=utf-8'
    },
    // params: data,
    proxy: proxyConfig,
  };

  console.log(Info + " Calling....");

  await axios(config)
  .then(function (response) {
    currentWalletBalance = response.data.result.availableBalance
    console.log(`Current wallet balance is ${currentWalletBalance} USDT.`);

  })
  .catch(function (error) {
    console.log(error);
  });
};

  // CREATE ORDER --  CREATE ORDER -- CREATE ORDER

let savedParentOrderId = '';

async function postLongOrderEntry() {

  // Fetch Wallet Balance:
  var walletEndpoint = "/contract/v3/private/copytrading/wallet/balance";
  const walletParams = '';
  await walletBalance(walletEndpoint, "GET", walletParams, "Balance");
  let position = (currentWalletBalance / currentBitcoinPrice) * 1;
  let positionSize = position.toFixed(4);
  console.log(`Position size is ${positionSize}.`);

  // Create Order endpoint
  endpoint = "/contract/v3/private/copytrading/order/create"
  let orderLinkId = crypto.randomBytes(16).toString("hex");

  // Market Buy order:
  var data = '{"symbol":"BTCUSDT","orderType":"Market","side":"Buy","orderLinkId":"' +  orderLinkId + '","qty":"' +  positionSize + '","price":"' +  currentBitcoinPrice + '","timeInForce":"GoodTillCancel","position_idx":"1"}';
  await http_request(endpoint,"POST",data,"Create");

  savedParentOrderId = orderLinkId;
};
// setTimeout(postLongOrderEntry, 3000);

async function postShortOrderEntry() {

  // Fetch Wallet Balance:
  var walletEndpoint = "/contract/v3/private/copytrading/wallet/balance";
  const walletParams = '';
  await walletBalance(walletEndpoint, "GET", walletParams, "Balance");
  let position = (currentWalletBalance / currentBitcoinPrice) * 1;
  let positionSize = position.toFixed(4);
  console.log(`Position size is ${positionSize}.`);

  // Create Order endpoint
  endpoint = "/contract/v3/private/copytrading/order/create"
  let orderLinkId = crypto.randomBytes(16).toString("hex");

  // Market Sell order:
  var data = '{"symbol":"BTCUSDT","orderType":"Market","side":"Sell","orderLinkId":"' +  orderLinkId + '","qty":"' +  positionSize + '","price":"' +  currentBitcoinPrice + '","timeInForce":"GoodTillCancel","position_idx":"1"}';
  await http_request(endpoint,"POST",data,"Create");

  savedParentOrderId = orderLinkId;
};
// postShortOrderEntry();


  // CLOSE POSITION -- CLOSE POSITION -- CLOSE POSITION

async function closePosition() {

  // copy & paste ID here when stopping & manually running the code:
  // savedParentOrderId = 'fef4f09525c8aa12ddcb7c8b3b6d9818';

  // close order endpoint
  endpoint = "/contract/v3/private/copytrading/order/close"
  var data = '{"symbol":"BTCUSDT","parentOrderLinkId":"' +  savedParentOrderId + '"}'
  await http_request(endpoint,"POST",data,"Create");
};
// closePosition();