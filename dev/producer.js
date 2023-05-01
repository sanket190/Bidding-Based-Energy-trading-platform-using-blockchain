// const express = require('express');
// const app = express();
// const bodyParser = require('body-parser');
// app.use(bodyParser.json());
// const path = require('path');
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
// });

// app.listen(3001, () => {
//     console.log('listening on *:3001');
//   });
  
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Web3 = require('web3');

const web3 = new Web3('http://localhost:8545');


const energyMarketContractAddress = '0x855AA1eF7ec3A0Ca1d298de130EFc6547Fdc4E54'; // Replace with the actual contract address
const contractAbi = require('./contractabi.json');
const energyMarketContract = new web3.eth.Contract(contractAbi, energyMarketContractAddress);


const accountAddress = '0xC3A68848f55B4643771fDbBf902c0f6DDd48B07b';
const accountPrivateKey = '0x48d4cfeb90b216a009249c8a4671ec6dcbed5cc207ffdc2fd0b201c7a98a35ba';


