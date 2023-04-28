const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Web3 = require('web3');
const path = require('path');
const http = require('http').createServer(app);
const io = require('socket.io')(http,{
  cors: {
    origin: '*',
  }
});
const web3 = new Web3('http://localhost:8545');

const energyMarketContractAddress = '0x73DE0E1c3391bF4B337eBAD24A95041595031E4A'; // Replace with the actual contract address
const contractAbi = require('../dev/contractabi.json');
const energyMarketContract = new web3.eth.Contract(contractAbi, energyMarketContractAddress);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var accountAddress;
var accountPrivateKey;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

function verify(account, key) {
  try {
    const addressChecksum = web3.utils.toChecksumAddress(account);
    const isValidPrivateKey = web3.utils.isHexStrict(key) && key.length === 66 && key.slice(0, 2) === '0x';

    if (!isValidPrivateKey) {
      throw new Error('Invalid private key');
    }
 
    const accountBalance = web3.eth.getBalance(addressChecksum);
    if (accountBalance === '0') {
      throw new Error('Account does not exist on the blockchain');
    }

    const testAccount = web3.eth.accounts.privateKeyToAccount(key);
    if (testAccount.address !== addressChecksum) {
      throw new Error('Private key does not correspond to the account address');
    }

    accountAddress = account;
    accountPrivateKey = key;
   
    web3.eth.accounts.wallet.add(accountPrivateKey);
    web3.eth.defaultAccount = accountAddress;

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('verify', (data) => {
    const result = verify(data.account, data.key);
    if (result) {
      socket.emit('verificationResponse', 'Account verified');
    } else {
      socket.emit('verificationResponse', 'Account verification failed');
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
