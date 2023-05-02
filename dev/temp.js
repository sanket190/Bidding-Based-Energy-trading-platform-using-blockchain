
// app.post('/verify', bodyParser.json(), (req, res) => {
//   const account = req.body.account;
//   const key = req.body.key;

//   // const result = verify(account, key);
//   result=true;

//   if (result) {
//     res.status(200).send('Account verified');
//   } else {
//     res.status(400).send('Account verification failed');
//   }
// });


// app.get('/', function (req, res) {
//   res.sendFile('/home/sanket/Subjects/Btech_project/new_energy_market/login.html')
// });

// app.post('/checkOfferStatus', async (req, res) => {
//   try {
//     const offerId = req.body.offerId;
//     const offer = await energyMarketContract.methods.offers(offerId).call();
//     const active = offer.active;
//     res.json({ active: active });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal server error');
//   }
// });



// app.get('/getwallet', async (req, res) => {
//   try {
//     const accountBalance = await web3.eth.getBalance(accountAddress);
//     const x = web3.utils.fromWei(accountBalance, 'ether'); // Convert wei to ether and log the balance
//     res.json({ balance: x, address: accountAddress });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal server error');
//   }
// });
  



// app.get('/offers-list', async (req, res) => {
//   try {
//     // res.sendFile('/home/sanket/Subjects/Btech_project/new_energy_market/Marketplace.html');
//     const offerCount = await energyMarketContract.methods.getOfferLength().call();
//     const current_offers = [];
//     // console.log(offerCount)
//     // tableBody = document.getElementById("offers-table-body");
//     // Loop through all the offers and push their details to the array
//     for (let i = 0; i < offerCount; i++) {
//       const offer = await energyMarketContract.methods.offers(i).call();
//       current_offers.push({
//         seller: offer.seller,
//         quantity: offer.quantity,
//         pricePerUnit: offer.pricePerUnit,
//         duration: offer.duration,
//         timestamp: offer.timestamp,
//         offerId: offer.offerId,
//         active: offer.active
//       });
   
//     }
  
//     res.json(current_offers);
//   } catch (error) {
//     console.error('Error getting offer details:', error);
//     res.status(500).send('Internal server error');
//   }
// });




// async function Initiate_auction(duration,async) {
//   try {
//     const gasPrice = await web3.eth.getGasPrice();
//     const gasLimit = 300000;

//     const nonce = await web3.eth.getTransactionCount(accountAddress);
//     const txParams = {
//       nonce: Web3.utils.toHex(nonce),
//       gasPrice: Web3.utils.toHex(gasPrice),
//       gasLimit: Web3.utils.toHex(gasLimit),
//       to: energyMarketContractAddress,
//       data: energyMarketContract.methods.initiateAuction(duration).encodeABI()
//     };

//     // sign and send the transaction
//     const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
//     const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
//     return receipt
//   }
//   catch (error) {
//   console.error(error);
//     return false;
//   }
// }

// // Call the createOffer function using the contract instance
// app.post('/offer-energy', async (req, res) => {
//   try {
//     const quantity = req.body.Quantity;  // the quantity of energy to sell
//     const pricePerUnit = req.body.PricePerUnit;  // the price per unit of energy in wei
//     const duration = req.body.Duration;  // the duration of the offer in seconds


//     const gasPrice = await web3.eth.getGasPrice();
//     const gasLimit = 300000;

//     const nonce = await web3.eth.getTransactionCount(accountAddress);
//     const txParams = {
//       nonce: Web3.utils.toHex(nonce),
//       gasPrice: Web3.utils.toHex(gasPrice),
//       gasLimit: Web3.utils.toHex(gasLimit),
//       to: energyMarketContractAddress,
//       data: energyMarketContract.methods.createOffer(quantity, pricePerUnit,duration).encodeABI()
//     };

//     // sign and send the transaction
//     const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
//     const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
//     res.send(`Offer created successfully.: ${receipt.transactionHash}`);
//     receipt = Initiate_auction(duration);

//   } catch (error) {
//     console.error('Transaction failed:', error);
//     res.status(500).send('Error creating offer.');
//   }
// });


// // Select best bid for an offer
// app.post('/select-bid', async (req, res) => {
//   try {
//     const offerId = req.body.offerId;

//     const gasPrice = await web3.eth.getGasPrice();
//     const gasLimit = 300000;

//     const nonce = await web3.eth.getTransactionCount(accountAddress);
//     const txParams = {
//       nonce: Web3.utils.toHex(nonce),
//       gasPrice: Web3.utils.toHex(gasPrice),
//       gasLimit: Web3.utils.toHex(gasLimit),
//       to: energyMarketContractAddress,
//       data: energyMarketContract.methods.selectBid(offerId).encodeABI()
//     };

//     const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
//     const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

//     res.send(`Bid selected successfully: ${receipt.transactionHash}`);


//   } catch (error) {
//     console.error('Transaction failed:', error);
//     res.status(500).send('Error selecting bid.');
//   }
// });

// app.post('/place-bid', async (req, res) => {
//   try {
//     const offerId = req.body.offerId;
//     const quantity = req.body.quantity;
//     const pricePerUnit = req.body.pricePerUnit;
//     const active = req.body.active;
    

//     const gasPrice = await web3.eth.getGasPrice();
//     const gasLimit = 300000;

//     const nonce = await web3.eth.getTransactionCount(accountAddress);
//     const txParams = {
//       nonce: Web3.utils.toHex(nonce),
//       gasPrice: Web3.utils.toHex(gasPrice),
//       gasLimit: Web3.utils.toHex(gasLimit),
//       to: energyMarketContractAddress,
//       data: energyMarketContract.methods.submitBid(offerId, quantity, pricePerUnit).encodeABI()
//     };
    
//     const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
//     const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

//     res.send(`Bid placed successfully: ${receipt.transactionHash}`);
//   } catch (error) {
//     console.error('Transaction failed:', error);
//     res.status(500).send('Error placing bid.');
//   }
// });


// app.get('/getActiveBids', async (req, res) => {
//   try {
//     // res.sendFile('/home/sanket/Subjects/Btech_project/new_energy_market/Marketplace.html');
//     const BidCount = await energyMarketContract.methods.getBidCount().call();
   
//     const current_Bids = [];

//     for (let i = 0; i < BidCount; i++) {
//       const BidArrayLen = await energyMarketContract.methods.getBidsArrayLength(i).call();
//       for(let j = 0; j< BidArrayLen; j++){
//         const bids = await energyMarketContract.methods.bids(i,j).call();
//         current_Bids.push({
//           offerId:i,
//           seller: bids.buyer,
//           quantity: bids.quantity,
//           pricePerUnit: bids.pricePerUnit,
//           active: bids.active
//         });
//       }
//     }
  
//     res.json(current_Bids);
//   } catch (error) {
//     console.error('Error getting Bids details:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// app.post('/update_balance', async(res,req)=>{
//   try{
//     const energyAmount = req.body.energyAmount;
  
//     const gasPrice = await web3.eth.getGasPrice();
//     const gasLimit = 300000;

//     const nonce = await web3.eth.getTransactionCount(accountAddress);
//     const txParams = {
//       nonce: Web3.utils.toHex(nonce),
//       gasPrice: Web3.utils.toHex(gasPrice),
//       gasLimit: Web3.utils.toHex(gasLimit),
//       to: energyMarketContractAddress,
//       data: energyMarketContract.methods.submitBid(energyAmount).encodeABI()
//     };
    
//     const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
//     const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);


//   }
//   catch (error) {
//     console.error('Transaction failed:', error);
//     res.status(500).send('Error placing bid.');
//   }

// });

// app.get('/Energy_balance', async (req, res) => {
//   try {
//     const energyAmount = await energyMarketContract.methods.getEnergyBalance(accountAddress).call();
//     res.json({ balance: energyAmount});
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal server error');
//   }
// });

// app.get('/Eth_balance', async(req,res) => {
//   try{

//     const ethAmount = await energyMarketContract.methods.getEthBalance(accountAddress).call();
//     res.json({balance: ethAmount});
//   } catch(error){
//     console.error(error);
//     res.status(500).send('Internal server error');
//   }

// });


  // socket.on('addEth', async (data)=>{
  //   try{
  //     const energyAmount = data.energyAmount;
    
  //     const gasPrice = await web3.eth.getGasPrice();
  //     const gasLimit = 300000;
  
  //     const nonce = await web3.eth.getTransactionCount(accountAddress);
  //     const txParams = {
  //       nonce: Web3.utils.toHex(nonce),
  //       gasPrice: Web3.utils.toHex(gasPrice),
  //       gasLimit: Web3.utils.toHex(gasLimit),
  //       to: energyMarketContractAddress,
  //       data: energyMarketContract.methods.send_eth(producer, ether_per_token, {from:consumer, to:contract_address, value:ether_per_token}).encodeABI()
  //     };
      
  //     const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
  //     const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  //     socket.emit('update',true);
  //   }
  //   catch (error) {
  //     console.error('Transaction failed:', error);
  //     socket.emit('error', 'Internal server error');
  //   }
  //   obj.
  // });