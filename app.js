    // This is for recieving the webhook alert from tradingview

    // installed NPM packages:
// express: web application framework 
// body-parser: parse incoming JSON payloads
// sudo -g ngrok: sets up link to remote access apps
// axios: promised based HTTPS requests 

require('dotenv').config();


    // GET PRICE FEED -- GET PRICE FEED -- GET PRICE FEED -- GET PRICE FEED

const WebSocket = require('ws');
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

let currentBitcoinPrice = '';
let timestamp = Date.now().toString();
console.log(`Date now() timestamp: ${timestamp}`);
ws.on('message', (data) => {

  currentBitcoinPrice = JSON.parse(data);

  if (currentBitcoinPrice.topic && currentBitcoinPrice.topic.startsWith('kline.1.BTCUSDT')) {
    
    const klineData = currentBitcoinPrice.data[0];
    console.log(`Bitcoin Price: ${klineData.close}`);

    timestamp = klineData.timestamp;
    console.log(`Current timestamp value: ${timestamp}`);

  } else {
  console.log('Received data:', currentBitcoinPrice);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log(`WebSocket connection closed: ${code} - ${reason}`);
});

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

// open two terminals
// On one, run 'node app.js'
// on the other run 'ngrok http 3000' & copy the https link adding the /webhook at the end to tradingview
// the comment on Tradingview should be formatted like so: { "comment": "{{strategy.order.comment}}" }

// link from ngrok (example):
//  https://9b92-2001-569-5904-9d00-75ba-1ffa-754f-4d7b.ngrok.io/webhook


    // POST ORDER TO BYBIT -- POST ORDER TO BYBIT -- POST ORDER TO BYBIT

const crypto = require('crypto');
const axios = require('axios');

url = 'https://api.bybit.com';

var apiKey = process.env.BYBIT_API_KEY;
var secret = process.env.BYBIT_API_SECRET;
var recvWindow = 5000;

function getSignature(parameters, secret) {
  console.log(`Timestamp when getting the signature: ${timestamp}`);
  return crypto.createHmac('sha256', secret).update(timestamp + apiKey + recvWindow + parameters).digest('hex');
};

async function http_request(endpoint,method,data,Info) {

  console.log(`Timestamp when submitting the http_request: ${timestamp}`);

  var sign=getSignature(data,secret);
  if(method=="POST") {
    fullendpoint=url+endpoint;
  } else{
    fullendpoint=url+endpoint+"?"+data;
    data="";
  }

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
    data : data
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

  // CREATE ORDER --  CREATE ORDER -- CREATE ORDER

let savedParentOrderId = '';

async function postLongOrderEntry() {

  // Create Order endpoint
  endpoint = "/contract/v3/private/copytrading/order/create"
  const orderLinkId = crypto.randomBytes(16).toString("hex");

  // Limit Sell/Buy order:
  // var data = '{"symbol":"BTCUSDT","orderType":"Limit","side":"Buy","orderLinkId":"' +  orderLinkId + '","qty":"0.001","price":"' +  currentBitcoinPrice + '","timeInForce":"GoodTillCancel","position_idx":"1"}';

  // Market Buy order:
  var data = '{"symbol":"BTCUSDT","orderType":"Market","side":"Buy","orderLinkId":"' +  orderLinkId + '","qty":"0.001","price":"' +  currentBitcoinPrice + '","timeInForce":"GoodTillCancel","position_idx":"1"}';
  await http_request(endpoint,"POST",data,"Create");

  savedParentOrderId = orderLinkId;
  console.log(`The created order ID: ${savedParentOrderId}`);
  console.log(`Timestamp of the long order: ${timestamp}`);

};
// postLongOrderEntry();

async function postShortOrderEntry() {

  // Create Order endpoint
  endpoint = "/contract/v3/private/copytrading/order/create"
  const orderLinkId = crypto.randomBytes(16).toString("hex");

  // Limit Sell/Buy order:
  // var data = '{"symbol":"BTCUSDT","orderType":"Limit","side":"Sell","orderLinkId":"' +  orderLinkId + '","qty":"0.001","price":"' +  currentBitcoinPrice + '","timeInForce":"GoodTillCancel","position_idx":"1"}';

  // Market Sell order:
  var data = '{"symbol":"BTCUSDT","orderType":"Market","side":"Sell","orderLinkId":"' +  orderLinkId + '","qty":"0.001","price":"' +  currentBitcoinPrice + '","timeInForce":"GoodTillCancel","position_idx":"1"}';
  await http_request(endpoint,"POST",data,"Create");

  savedParentOrderId = orderLinkId;
  console.log(`The created order ID: ${savedParentOrderId}`);
  console.log(`Timestamp of the short order: ${timestamp}`);

};
// postShortOrderEntry();


  // CLOSE POSITION -- CLOSE POSITION -- CLOSE POSITION

async function closePosition() {

  // copy & paste ID here when stopping & manually running the code:
  // savedParentOrderId = 'fef4f09525c8aa12ddcb7c8b3b6d9818';

  // close order endpoint
  endpoint = "/contract/v3/private/copytrading/order/close"

  // var data = '{"symbol":"BTCUSDT", "parentOrderId":"' +  savedParentOrderId + '"}';
  var data = '{"symbol":"BTCUSDT","parentOrderLinkId":"' +  savedParentOrderId + '"}'
  await http_request(endpoint,"POST",data,"Create");

  console.log(`Timestamp of the order closing: ${timestamp}`);

};
// closePosition();