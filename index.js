    // NODE.JS PACKAGES INSTALLED USING NPM

// dotenv : allows us to hide API credentials
// node-fetch: use the fetch API in node.js
// ws: web socket library

// ta-lib: technical analysis library
// talib: technical analysis library
// technicalindicators: TA indicators


require('dotenv').config();

    // FETCH PUBLIC DATA FROM BYBIT -- FETCH PUBLIC DATA FROM BYBIT -- FETCH PUBLIC DATA FROM BYBIT

// function to fetch public data from ByBit
async function fetchPublicBybitData(url) {
    try {
        const fetch = (await import('node-fetch')).default;

        const response = await fetch(url);
    
        if (!response.ok) {
            console.log(response.status);
        };
    
        const data = await response.json();

        return data;

    } catch(error) {
        console.log(`Error: ${error}`)
    }
};
// select URL and run function

// fetchPublicBybitData('https://api-testnet.bybit.com/contract/v3/public/copytrading/symbol/list')
// .then(data => {
//     console.log(data.result);
// })
// .catch(error => {
//     console.log(`Error: ${error}`);
// });


    // CREATE ON BYBIT ORDER FUNCTION -- CREATE ON BYBIT ORDER FUNCTION -- CREATE ON BYBIT ORDER FUNCTION

const apiKey = process.env.SITE_GENERATED_API_KEY;
const apiSign = process.env.SITE_GENERATED_API_SECRET;
const timestamp = Date.now();
const recvWindow = '5000'; // used to define a time window for the request to be processed by the server to protection against request replay attacks

const url = 'https://api.bybit.com/contract/v3/private/copytrading/order/create';

const headers = {
    'X-BAPI-SIGN-TYPE': '2',
    'X-BAPI-SIGN': apiSign,
    'X-BAPI-API-KEY': apiKey,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-RECV-WINDOW': recvWindow,
    'Content-Type': 'application/json; charset=utf-8',
};

const data = {
    side: 'Buy',
    symbol: 'BTCUSDT',
    orderType: 'Limit',
    qty: '0.001',
    price: '2000',
    takeProfit: '0',
    stopLoss: '0',
    tpTriggerBy: 'LastPrice',
    slTriggerBy: 'LastPrice',
};

async function createOrder() {

    const fetch = (await import('node-fetch')).default;

    try {
        fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        })
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((error) => console.error('Error:', error));

    } catch(error) {
        console.log(`Error: ${error}`)
    };
};
// createOrder();


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

ws.on('message', (data) => {
    const parsedData = JSON.parse(data);

    if (parsedData.topic && parsedData.topic.startsWith('kline.1.BTCUSDT')) {
    const klineData = parsedData.data[0];
    console.log(`BTCUSD Price: ${klineData.close}`);
    } else {
    console.log('Received data:', parsedData);
    }
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

ws.on('close', (code, reason) => {
    console.log(`WebSocket connection closed: ${code} - ${reason}`);
});

    // INDICATORS -- INDICATORS -- INDICATORS -- INDICATORS


