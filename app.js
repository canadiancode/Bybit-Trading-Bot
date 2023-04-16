    // This is for recieving the webhook alert from tradingview

    // installed NPM packages
// express: web application framework 
// body-parser: parse incoming JSON payloads
// sudo -g ngrok: sets up link to remote access apps
// axios: promised based HTTPS requests 


require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  console.log('TradingView alert received:', req.body);

  // Add custom logic to handle the alert here
  // For example, you can send a notification, execute a trade, etc.

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`TradingView webhook listener is running on port ${port}`);
});

// open two terminals
// On one, run 'node app.js'
// on the other run 'ngrok http 3000' & copy the https link adding the /webhook at the end to tradingview

// link from ngrok:
//  https://9b92-2001-569-5904-9d00-75ba-1ffa-754f-4d7b.ngrok.io/webhook


    // POST ORDER TO BYBIT -- POST ORDER TO BYBIT -- POST ORDER TO BYBIT

const crypto = require('crypto');
const axios = require('axios');

url = 'https://api.bybit.com';

var apiKey = process.env.BYBIT_API_KEY;
var secret = process.env.BYBIT_API_SECRET;
var recvWindow = 5000;
var timestamp = Date.now().toString();

function getSignature(parameters, secret) {
    return crypto.createHmac('sha256', secret).update(timestamp + apiKey + recvWindow + parameters).digest('hex');
}

async function http_request(endpoint,method,data,Info) {
    var sign=getSignature(data,secret);
    if(method=="POST")
    {
        fullendpoint=url+endpoint;
    }
    else{
        fullendpoint=url+endpoint+"?"+data;
        data="";
    }
    //endpoint=url+endpoint
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
}

// Create Order

var savedParentOrderId = '';

async function postOrderEntry() {

    // Create Order
    endpoint = "/contract/v3/private/copytrading/order/create"
    const orderLinkId = crypto.randomBytes(16).toString("hex");
    // var data = '{"symbol":"BTCUSDT","orderType":"Limit","side":"Buy","orderLinkId":"' +  orderLinkId + '","qty":"0.001","price":"10000","timeInForce":"GoodTillCancel","position_idx":"1"}';
    var data = '{"symbol":"BTCUSDT","orderType":"Market","side":"Sell","orderLinkId":"' +  orderLinkId + '","qty":"0.001","timeInForce":"GoodTillCancel","position_idx":"1"}';
    await http_request(endpoint,"POST",data,"Create");

    savedParentOrderId = orderLinkId;

    // // Get unfilled Order List
    // endpoint="/unified/v3/private/order/unfilled-orders"
    // var data = 'symbol=BTCUSDT&category=linear&orderStatus=New&orderLinkId=' + orderLinkId;
    // await http_request(endpoint,"GET",data,"Unfilled Order List");

    // // Get Order List
    // endpoint="/unified/v3/private/order/list"
    // var data = 'symbol=BTCUSDT&category=linear&orderStatus=New&orderLinkId=' + orderLinkId ;
    // await http_request(endpoint,"GET",data,"Order List");

    // // Cancel order
    // endpoint="/unified/v3/private/order/cancel"
    // var data = '{"symbol": "BTCUSDT","category":"linear","orderLinkId":"' +  orderLinkId +'"}';
    // await http_request(endpoint,"POST",data,"Cancel");

};
// postOrderEntry();


// Close position
async function closePosition() {

    // Create Order
    endpoint = "/contract/v3/private/copytrading/order/close"
    const orderLinkId = crypto.randomBytes(16).toString("hex");
    // var data = '{"symbol":"BTCUSDT", "parentOrderId":"' +  savedParentOrderId + '"}';
    var data = '{"symbol":"BTCUSDT"}';
    await http_request(endpoint,"POST",data,"Create");

    savedParentOrderId = '';

};
closePosition();
