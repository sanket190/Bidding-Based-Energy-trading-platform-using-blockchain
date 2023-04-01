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



// Set the default account to use for transactions
web3.eth.accounts.wallet.add(accountPrivateKey);
web3.eth.defaultAccount = accountAddress;

app.use(bodyParser.json());


app.get('/offers-list', async (req, res) => {
    try {
        const offerCount = await energyMarketContract.methods.getOfferLength().call();
        const current_offers = [];
        // Loop through all the offers and push their details to the array
        for (let i = 0; i < offerCount; i++) {
            const offer = await energyMarketContract.methods.offers(i).call();
            current_offers.push({
                seller: offer.seller,
                quantity: offer.quantity,
                pricePerUnit: offer.pricePerUnit,
                duration: offer.duration,
                timestamp: offer.timestamp,
                offerId:offer.offerId,
                active: offer.active
            });
        }
        // Return the list of offers as a JSON response
        res.json(current_offers);
    } catch (error) {
        console.error('Error getting offer details:', error);
        res.status(500).send('Internal server error');
    }
});

// Place bid on an offer
app.post('/place-bid', async (req, res) => {
    try {
      const offerId = req.body.OfferId;
      const quantity = req.body.quantity;
      const pricePerUnit = req.body.pricePerUnit;
      const active = req.body.active;
      
  
      const gasPrice = await web3.eth.getGasPrice();
      const gasLimit = 300000;
  
      const nonce = await web3.eth.getTransactionCount(accountAddress);
      const txParams = {
        nonce: Web3.utils.toHex(nonce),
        gasPrice: Web3.utils.toHex(gasPrice),
        gasLimit: Web3.utils.toHex(gasLimit),
        to: energyMarketContractAddress,
        data: energyMarketContract.methods.placeBid(offerId, quantity, pricePerUnit, active).encodeABI()
      };
      
      const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  
      res.send(`Bid placed successfully: ${receipt.transactionHash}`);
    } catch (error) {
      console.error('Transaction failed:', error);
      res.status(500).send('Error placing bid.');
    }
  });
  // create an event listener for InsufficientFunds event



app.listen(3001, () => console.log('API server started on port 3000'));