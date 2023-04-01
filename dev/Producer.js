const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Web3 = require('web3');

const web3 = new Web3('http://localhost:8545');


const energyMarketContractAddress = '0xE95095a520eD0D2921d64f3e7f8e48AC01679F7C'; // Replace with the actual contract address
const contractAbi = require('./contractabi.json');
const energyMarketContract = new web3.eth.Contract(contractAbi, energyMarketContractAddress);


const accountAddress = '0xE0FE876F430db24b755622291CF8A76B30D76276';
const accountPrivateKey = '0x0597b2c5645b0b507ff742fb05ddda3e3c8ddf6b476da912e0b9b7fd4b9fcb01';



// Set the default account to use for transactions
web3.eth.accounts.wallet.add(accountPrivateKey);
web3.eth.defaultAccount = accountAddress;

app.use(bodyParser.json());

// Get the number of offers that have been created

app.get('/',function(req,res){
  res.sendFile('/home/sanket/Subjects/Btech_project/new_energy_market/login.html')
});


app.get('/offers-list', async (req, res) => {
    try {
        // res.sendFile('/home/sanket/Subjects/Btech_project/new_energy_market/Marketplace.html');
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
            var tableBody = '';
              tableBody += '<tr>';
              tableBody += '<td>' + offer.offerId + '</td>';
              tableBody += '<td>' + offer.seller + '</td>';
              tableBody += '<td>' + offer.quantity + '</td>';
              tableBody += '<td>' + offer.pricePerUnit + '</td>';
              tableBody += '<td>' + offer.duration + '</td>';
              tableBody += '<td>' + new Date(offer.timestamp * 1000).toLocaleString() + '</td>';
              tableBody += '<td>' + offer.active + '</td>';
              tableBody += '</tr>';
           
        }
        // $('#offers-table-body').html(tableBody);
        document.getElementById('offers-table-body').insertAdjacentHTML('beforeend', tableBody);
        // Return the list of offers as a JSON response
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
  

app.listen(3000, () => console.log('API server started on port 3000'));