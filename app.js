// Heroku webhook URL to add into Tradingview: https://pcc-crab-market-bot.herokuapp.com/webhook

    // installed NPM packages:
// dotenv: pull info from .env file
// express: web application framework 
// ws: web socket 
// node-fetch: fetch API for node
// body-parser: parse incoming JSON payloads
// axios: promised based HTTPS requests 
// url: helps with parsing the proxy URL for setting up QuotaGuard Static IP
// crypto: cryptography for API POST requets
// https: make promised based https requests 

// sudo -g ngrok: sets up link to remote access apps for testing 

require('dotenv').config();

////////////////////////////////////////////////////////
// BYBIT CODE -- BYBIT CODE -- BYBIT CODE -- BYBIT CODE
////////////////////////////////////////////////////////


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
    console.log('Going Long!');
    postLongOrderEntry();
    postBitgetLongOrderEntry();
  } else if (comment === 'Short') {
    console.log('Going Short!');
    postShortOrderEntry();
    postBitgetShortOrderEntry();
  } else {
    console.log('Exiting Position!');
    closePosition();
    postBitgetExitOrder();
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

// OPEN TRADE -- OPEN TRADE -- OPEN TRADE
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

let openPositions = 0;
// CHECK OPEN TRADES -- CHECK OPEN TRADES --  CHECK OPEN TRADES 
async function checkOpenPositions(endpoint, method, data, Info) {

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

    console.log(`Response for open trades: ${response.data.result.list[0]}`);
    if (Boolean(response.data.result.list[0])) {

      endpoint = "/contract/v3/private/copytrading/position/close";
    
      // close All Positions:
      const buyData = '{"symbol":"BTCUSDT","positionIdx":"1"}';
      closeAllPositions(endpoint,"POST",buyData,"Create");

      const sellData = '{"symbol":"BTCUSDT","positionIdx":"2"}';
      closeAllPositions(endpoint,"POST",sellData,"Create");
    };
  })
  .catch(function (error) {
    console.log(error);
  });
};

// FULLY CLOSE ALL POSITIONS -- FULLY CLOSE ALL POSITIONS 
async function closeAllPositions(endpoint,method,data,Info) {

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

    // Fetch open positions:
    var openPositions = "/contract/v3/private/copytrading/position/list";
    const walletParams = '';
    checkOpenPositions(openPositions, "GET", walletParams, "Position");

  })
  .catch(function (error) {
    console.log(error);
  });

};

  // CREATE ORDER --  CREATE ORDER -- CREATE ORDER

let savedParentOrderId = '';
const leverage = 1;

async function postLongOrderEntry() {

  // Fetch Wallet Balance:
  var walletEndpoint = "/contract/v3/private/copytrading/wallet/balance";
  const walletParams = '';
  await walletBalance(walletEndpoint, "GET", walletParams, "Balance");
  let position = (currentWalletBalance / currentBitcoinPrice) * leverage;
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
  let position = (currentWalletBalance / currentBitcoinPrice) * leverage;
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

  // Fetch open positions:
  var openPositions = "/contract/v3/private/copytrading/position/list";
  const walletParams = '';
  await checkOpenPositions(openPositions, "GET", walletParams, "Position");
};
// closePosition();


////////////////////////////////////////////////////////////
// BITGET CODE -- BITGET CODE -- BITGET CODE -- BITGET CODE
///////////////////////////////////////////////////////////

  // PRICE DATA FEED -- PRICE DATA FEED -- PRICE DATA FEED

const GitgetWebSocket = require('websocket').client;
const wsClient = new GitgetWebSocket();

let currentBitgetBitcoinPrice = 0;

const subscribeToBitgetWebSocket = () => {
  const subscriptionMessage = {
    "op": "subscribe",
    "args":[
        {
            "instType": "mc",
            "channel": "ticker",
            "instId": "BTCUSDT"
        }
    ]
  };
  return JSON.stringify(subscriptionMessage);
};

wsClient.on('connectFailed', (error) => {
  console.log('Connect Error: ' + error.toString());
});

wsClient.on('connect', (connection) => {

  console.log('WebSocket Client Connected');

  connection.on('error', (error) => {
    console.log("Connection Error: " + error.toString());
  });

  connection.on('close', () => {
    console.log('WebSocket Connection Closed');
  });

  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      const parsedMessage = JSON.parse(message.utf8Data);

      let currentTime = (new Date()).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ");

      if (parsedMessage.data && Array.isArray(parsedMessage.data) && parsedMessage.data.length > 0) {
        currentBitgetBitcoinPrice = parsedMessage.data[0].last;
        console.log(`Bitcoin price at ${currentTime}: ` + currentBitgetBitcoinPrice);
      }
    }
  });

  if (connection.connected) {
    connection.send(subscribeToBitgetWebSocket());
  }
});
const bitgetWebSocketURL = 'wss://ws.bitget.com/mix/v1/stream';
wsClient.connect(bitgetWebSocketURL, null);


  // BITGET ACCOUNT INFO -- BITGET ACCOUNT INFO -- BITGET ACCOUNT INFO

const BitgetApiKey = process.env.BITGET_API_KEY;
const BitgetSecret = process.env.BITGET_API_SECRET;
const passphrase = process.env.API_PASSPHRASE;

const https = require('https');

let availableBitgetBalance = '0';
const getAccountBalance = () => {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const path = '/api/mix/v1/account/account';
    const queryParams = 'marginCoin=USDT&symbol=BTCUSDT_UMCBL';
    const baseURL = 'https://api.bitget.com';
  
    const signData = timestamp + method + path + '?' + queryParams;
    const signature = crypto
      .createHmac('sha256', BitgetSecret)
      .update(signData)
      .digest()
      .toString('base64');
  
    const headers = {
      'Content-Type': 'application/json',
      'ACCESS-KEY': BitgetApiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': passphrase,
    };
  
    const options = {
      hostname: 'api.bitget.com',
      path: path + '?' + queryParams,
      method: method,
      headers: headers,
    };
  
    https.request(options, (res) => {

        let data = '';
    
        res.on('data', (chunk) => {
          data += chunk;
        });
    
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            availableBitgetBalance = parsedData.data.available;
            console.log('Available Balance in USDT:', availableBitgetBalance);
          } catch (error) {
            console.error('Error parsing response:', error.message);
          }
        });
    
    }).on('error', (error) => {
        console.error('Error fetching account balance:', error.message);
    }).end();
};
// getAccountBalance(); 

let openBitgetPositions = [];
// get open positions
async function checkBitgetOpenPositions() {

  openBitgetPositions = [];

  const timestamp = Date.now().toString();
  const method = 'GET';
  const path = '/api/mix/v1/position/allPosition';
  const baseURL = 'https://api.bitget.com';

  const queryParams = 'productType=umcbl&marginCoin=USDT';
  const signData = timestamp + method + path + '?' + queryParams;
  const signature = crypto
    .createHmac('sha256', BitgetSecret)
    .update(signData)
    .digest()
    .toString('base64');

  const headers = {
    'Content-Type': 'application/json',
    'ACCESS-KEY': BitgetApiKey,
    'ACCESS-SIGN': signature,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-PASSPHRASE': passphrase,
  };

  const options = {
    hostname: 'api.bitget.com',
    path: path + '?' + queryParams,
    method: method,
    headers: headers,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          response.data.forEach(data => {
            openBitgetPositions.push(data.total);
          });
          console.log(`Open positions: ${openBitgetPositions}`);

          resolve(response);
        } catch (error) {
          reject(new Error('Error parsing response: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error('Error getting open positions: ' + error.message));
    });

    req.end();
  });
};
// checkBitgetOpenPositions();

// Fetch order number
let trackingNumber = '';
function getTrackingNumber() {
  const timestamp = Date.now().toString();
  const method = 'GET';
  const path = '/api/mix/v1/trace/currentTrack';
  const queryParams = 'symbol=BTCUSDT_UMCBL&productType=umcbl';
  const baseURL = 'https://api.bitget.com';

  const signData = timestamp + method + path + '?' + queryParams;
  const signature = crypto
    .createHmac('sha256', BitgetSecret)
    .update(signData)
    .digest()
    .toString('base64');

  const headers = {
    'Content-Type': 'application/json',
    'ACCESS-KEY': BitgetApiKey,
    'ACCESS-SIGN': signature,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-PASSPHRASE': passphrase,
  };

  const options = {
    hostname: 'api.bitget.com',
    path: path + '?' + queryParams,
    method: method,
    headers: headers,
  };

  https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.code === '00000' && response.data) {
          console.log(response.data);
          trackingNumber = response.data[0].trackingNo;
          console.log(`Tracking number: ${trackingNumber}`)
        } else {
          console.error('Error fetching current positions:', response);
        }
      } catch (error) {
        console.error('Error parsing response:', error.message);
      }
    });
  })
  .on('error', (error) => {
    console.error('Error fetching current positions:', error.message);
  })
  .end();
};
// getTrackingNumber();


  // ORDER FUNCTIONS -- ORDER FUNCTIONS -- ORDER FUNCTIONS

// open order
function createOrder(direction, positionSize, clientOid) {
  const timestamp = Date.now().toString();
  const method = 'POST';
  const path = '/api/mix/v1/order/placeOrder';
  const baseURL = 'https://api.bitget.com';

  const requestBody = JSON.stringify({
    symbol: 'BTCUSDT_UMCBL',
    marginCoin: 'USDT',
    size: positionSize, // 0.01
    price: currentBitgetBitcoinPrice,
    side: direction, // open_long
    orderType: 'market', // limit
    timeInForceValue: 'normal',
    clientOid: clientOid,
  });

  const signData = timestamp + method + path + requestBody;
  const signature = crypto
    .createHmac('sha256', BitgetSecret)
    .update(signData)
    .digest()
    .toString('base64');

  const headers = {
    'Content-Type': 'application/json',
    'ACCESS-KEY': BitgetApiKey,
    'ACCESS-SIGN': signature,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-PASSPHRASE': passphrase,
  };

  const options = {
    hostname: 'api.bitget.com',
    path: path,
    method: method,
    headers: headers,
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        console.log(JSON.parse(data));
      } catch (error) {
        console.error('Error parsing response:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error creating order:', error.message);
  });

  req.write(requestBody);
  req.end();
};

// close order
async function closeBitgetPosition(trackingNo) {
  const timestamp = Date.now().toString();
  const method = 'POST';
  const path = '/api/mix/v1/trace/closeTrackOrder';
  const baseURL = 'https://api.bitget.com';

  const requestBody = {
    symbol: 'BTCUSDT_UMCBL',
    trackingNo: trackingNo,
  };

  const signData = timestamp + method + path + JSON.stringify(requestBody);
  const signature = crypto
    .createHmac('sha256', BitgetSecret)
    .update(signData)
    .digest()
    .toString('base64');

  const headers = {
    'Content-Type': 'application/json',
    'ACCESS-KEY': BitgetApiKey,
    'ACCESS-SIGN': signature,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-PASSPHRASE': passphrase,
  };

  const options = {
    hostname: 'api.bitget.com',
    path: path,
    method: method,
    headers: headers,
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        console.log(JSON.parse(data));
      } catch (error) {
        console.error('Error parsing response:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error closing trader position:', error.message);
  });

  req.write(JSON.stringify(requestBody));
  req.end();
};


  // LONG, SHORT, EXIT FUNCTIONS -- LONG, SHORT, EXIT FUNCTIONS

let clientOid = '';
let BitgetLeverage = 1;
let BitgetPositionSize = 0;

async function postBitgetLongOrderEntry() {
  tradeDirection = 'long';

  await getAccountBalance();

  BitgetPositionSize = availableBitgetBalance * BitgetLeverage;
  console.log(`Actual position size would be ${BitgetPositionSize}`);

  const generateClientOid = () => {
    const prefix = 'myapp';
    const timestamp = Date.now();
    const randomPart = Math.floor(Math.random() * 1e6);
    return `${prefix}-${timestamp}-${randomPart}`;
  };

  clientOid = generateClientOid();

  await createOrder('open_long', BitgetPositionSize, clientOid) // direction, BitgetPositionSize, clientOid
};
// setTimeout(postBitgetLongOrderEntry, 5000);

async function postBitgetShortOrderEntry() {
  tradeDirection = 'short';

  await getAccountBalance();

  BitgetPositionSize = availableBitgetBalance * BitgetLeverage;
  console.log(`Actual position size would be ${BitgetPositionSize}`);

  const generateClientOid = () => {
    const prefix = 'myapp';
    const timestamp = Date.now();
    const randomPart = Math.floor(Math.random() * 1e6);
    return `${prefix}-${timestamp}-${randomPart}`;
  };

  clientOid = generateClientOid();

  await createOrder('open_short', BitgetPositionSize, clientOid)  // direction, BitgetPositionSize, clientOid
};
// setTimeout(postBitgetShortOrderEntry, 5000);


async function postBitgetExitOrder() {

  await getTrackingNumber();
    
  await closeBitgetPosition(trackingNumber);

  await checkBitgetOpenPositions();

  if (openBitgetPositions[0] === '0' && openBitgetPositions[1] === '0') {
    console.log('All positions closed.');
  } else {
    postBitgetExitOrder();
  }
};
// setTimeout(postBitgetExitOrder, 10000);
