const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Web3 = require('web3');
const path = require('path');
const web3 = new Web3('http://localhost:8545');
// app.use(express.static(path.join(__dirname, 'public')));



const energyMarketContractAddress = '0xDdb8b1b56dE63673FEc8aA80bfB21F7f3660230C'; // Replace with the actual contract address
const contractAbi = require('./contractabi.json');
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
   
    const isValidPrivateKey =   web3.utils.isHexStrict(key) && key.length === 66 && key.slice(0, 2) === '0x';

    if (!isValidPrivateKey) {
      throw new Error('Invalid private key');
    }
 
    // check if the account exists on the blockchain
    const accountBalance = web3.eth.getBalance(addressChecksum);
    if (accountBalance === '0') {
      throw new Error('Account does not exist on the blockchain');
    }

    // verify that the private key corresponds to the account address
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



app.post('/verify', bodyParser.json(), (req, res) => {
  const account = req.body.account;
  const key = req.body.key;

  const result = verify(account, key);

  if (result) {
    res.status(200).send('Account verified');
  } else {
    res.status(400).send('Account verification failed');
  }
});

// app.get('/', function (req, res) {
//   res.sendFile('/home/sanket/Subjects/Btech_project/new_energy_market/login.html')
// });

app.post('/checkOfferStatus', async (req, res) => {
  try {
    const offerId = req.body.offerId;
    const offer = await energyMarketContract.methods.offers(offerId).call();
    const active = offer.active;
    res.json({ active: active });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});



app.get('/getwallet', async (req, res) => {
  try {
    const accountBalance = await web3.eth.getBalance(accountAddress);
    const x = web3.utils.fromWei(accountBalance, 'ether'); // Convert wei to ether and log the balance
    res.json({ balance: x, address: accountAddress });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});
  



app.get('/offers-list', async (req, res) => {
  try {
    // res.sendFile('/home/sanket/Subjects/Btech_project/new_energy_market/Marketplace.html');
    const offerCount = await energyMarketContract.methods.getOfferLength().call();
    const current_offers = [];
    // console.log(offerCount)
    // tableBody = document.getElementById("offers-table-body");
    // Loop through all the offers and push their details to the array
    for (let i = 0; i < offerCount; i++) {
      const offer = await energyMarketContract.methods.offers(i).call();
      current_offers.push({
        seller: offer.seller,
        quantity: offer.quantity,
        pricePerUnit: offer.pricePerUnit,
        duration: offer.duration,
        timestamp: offer.timestamp,
        offerId: offer.offerId,
        active: offer.active
      });
   
    }
  
    res.json(current_offers);
  } catch (error) {
    console.error('Error getting offer details:', error);
    res.status(500).send('Internal server error');
  }
});



// Call the createOffer function using the contract instance
app.post('/offer-energy', async (req, res) => {
  try {
    const quantity = req.body.Quantity;  // the quantity of energy to sell
    const pricePerUnit = req.body.PricePerUnit;  // the price per unit of energy in wei
    const duration = req.body.Duration;  // the duration of the offer in seconds


    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 300000;

    const nonce = await web3.eth.getTransactionCount(accountAddress);
    const txParams = {
      nonce: Web3.utils.toHex(nonce),
      gasPrice: Web3.utils.toHex(gasPrice),
      gasLimit: Web3.utils.toHex(gasLimit),
      to: energyMarketContractAddress,
      data: energyMarketContract.methods.createOffer(quantity, pricePerUnit, duration).encodeABI()
    };

    // sign and send the transaction
    const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    res.send(`Offer created successfully.: ${receipt.transactionHash}`);

  } catch (error) {
    console.error('Transaction failed:', error);
    res.status(500).send('Error creating offer.');
  }
});


// Select best bid for an offer
app.post('/select-bid', async (req, res) => {
  try {
    const offerId = req.body.offerId;

    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 300000;

    const nonce = await web3.eth.getTransactionCount(accountAddress);
    const txParams = {
      nonce: Web3.utils.toHex(nonce),
      gasPrice: Web3.utils.toHex(gasPrice),
      gasLimit: Web3.utils.toHex(gasLimit),
      to: energyMarketContractAddress,
      data: energyMarketContract.methods.selectBid(offerId).encodeABI()
    };

    const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    res.send(`Bid selected successfully: ${receipt.transactionHash}`);


  } catch (error) {
    console.error('Transaction failed:', error);
    res.status(500).send('Error selecting bid.');
  }
});

app.post('/place-bid', async (req, res) => {
  try {
    const offerId = req.body.offerId;
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


app.get('/getActiveBids', async (req, res) => {
  try {
    // res.sendFile('/home/sanket/Subjects/Btech_project/new_energy_market/Marketplace.html');
    const BidCount = await energyMarketContract.methods.getBidCount().call();
   
    const current_Bids = [];

    for (let i = 0; i < BidCount; i++) {
      const BidArrayLen = await energyMarketContract.methods.getBidsArrayLength(i).call();
      for(let j = 0; j< BidArrayLen; j++){
        const bids = await energyMarketContract.methods.bids(i,j).call();
        current_Bids.push({
          offerId:i,
          seller: bids.buyer,
          quantity: bids.quantity,
          pricePerUnit: bids.pricePerUnit,
          active: bids.active
        });
      }
    }
  
    res.json(current_Bids);
  } catch (error) {
    console.error('Error getting Bids details:', error);
    res.status(500).send('Internal server error');
  }
});





app.listen(3000, () => console.log('API server started on port 3000'));



