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


const energyMarketContractAddress = '0xcAD28076748F9Fe823B76306DeD34c38176C1805'; // Replace with the actual contract address
const contractAbi = require('./contractabi.json');
const energyMarketContract = new web3.eth.Contract(contractAbi, energyMarketContractAddress);

const accountAddress = '0xB0b10d453676DD0637588745d5607c188Db5a6b6'; // Address sending the funds
const accountPrivateKey = '0x939179e323a4e1c91c0b0ad7ba40178e4d64e0fa8560143fa3d49570ba0196ef';

const recipientAddress = '0xd9301147Ba6a75a523c99ec3F1F58fbD62469edF'; // Address receiving the funds
const ethAmount = '1';
const weiAmount = web3.utils.toWei(ethAmount, 'ether');

const gasLimit = 300000;

// Send the transaction
async function sendTransaction() {
  const nonce = await web3.eth.getTransactionCount(accountAddress);
  const gasPrice = await web3.eth.getGasPrice();
  const transactionObject = {
    nonce: nonce,
    from: accountAddress,
    to: recipientAddress,
    value: weiAmount,
    gas: gasLimit,
    // gasPrice: gasPrice,
  };
  const signedTransaction = await web3.eth.accounts.signTransaction(transactionObject, accountPrivateKey);
  const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
  console.log('Transaction receipt:', transactionReceipt);
}

app.get('/', async (req, res) => {
  try {
    await sendTransaction();
    const accountBalance = await web3.eth.getBalance(accountAddress);
    const recipientBalance = await web3.eth.getBalance(recipientAddress);
    console.log(`Account balance: ${web3.utils.fromWei(accountBalance)} ETH`);
    console.log(`Recipient balance: ${web3.utils.fromWei(recipientBalance)} ETH`);
    res.send('Transaction successful!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Transaction failed.');
  }
});

app.listen(3002, () => {
  console.log('Listening on *:3001');
});