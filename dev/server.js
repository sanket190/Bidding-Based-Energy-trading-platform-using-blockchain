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
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});



const energyMarketContractAddress = '0x8039324D896EF6Bab870b3a8acd01d0e5b20bA94'; // Replace with the actual contract address
const contractAbi = require('./contractabi.json');
const energyMarketContract = new web3.eth.Contract(contractAbi, energyMarketContractAddress);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var accountAddress;
var privateKey;
var Name;
var email;
var phone;
// var Password;
const users = {};

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});




io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.accountAddress;
  socket.privateKey;
  socket.Name;
  socket.email;
  const login=false;

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

       
        web3.eth.accounts.wallet.add(key);
        web3.eth.defaultAccount = account;

          return true;
        } catch (error) {
          console.error(error);
          socket.emit('error', error)
          return false;
        }
  }


  socket.on('verify', (data) => {
    const result = verify(data.account, data.key);
    if (result) {
      socket.emit('verificationResponse', result);
    } else {
      socket.emit('verificationResponse', result);
    }
  });

  socket.on('checkOfferStatus', async (data) => {
    try {
      const offerId = data.offerId;
      const offer = await energyMarketContract.methods.offers(offerId).call();
      const active = offer.active;
      socket.emit('offerStatus', { active: active });
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'Internal server error' });
    }
  });

 

    // Register event handler
  socket.on('register', async (data) => {
      // Store user information in users object
      const name = data.Name;
      const Email = data.Email;
      const AccountAddress = String(data.accountAddress);
      const PrivateKey = String(data.Privatekey);
      const Phone = data.phone;
      // console.log(name,Email,AccountAddress,PrivateKey);
      
      

      const result = verify(AccountAddress, PrivateKey);
      
     if (AccountAddress in users){
      socket.emit("error-reg",{message:'Account is already registered'});
     }
     else{
        users[AccountAddress] = {
          "name": name,
          "email":Email,
          "phone":Phone,
          "privateKey": PrivateKey
        }
        accountAddress=AccountAddress;
        privateKey=PrivateKey;
        Name = name;
        email=Email;
        phone = Phone;
        // console.log(socket.accountAddress);
        socket.emit('registrationSuccessful',true);
    }
     
  });

    // Login event handler
  socket.on('login',async (data) => {
      // Check if user exists in users object
      // console.log(users);
      account=String(data.account);
      key= String(data.key);
      // console.log(users[account].privateKey);

      if (account in users && users[account].privateKey == key) {
        // Emit a 'login successful' event to the client
        accountAddress=account;
        privateKey=key;
        
        socket.emit('loginSuccessful',true);
      } else {
        // Emit a 'login failed' event to the client
        socket.emit('error', { message: 'You have not registered yet' });
      }
  });

  socket.on('checkLoggedIn', (callback) => {
    const isLoggedIn = login; // replace with your implementation
  
    // Call the callback function with the logged-in status
    callback(isLoggedIn);
  });
 


  socket.on('getInfo', async () => {
    try {
      // console.log(accouess);
      const accountBalance = await web3.eth.getBalance(accountAddress);
      const x = web3.utils.fromWei(accountBalance, 'ether'); // Convert wei to ether and log the balance
      socket.emit('Info', { name:Name, email: email, balance: x, phone: phone, address: accountAddress });
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'Internal server error' });
    }
  });


  socket.on('get-offers', async () => {
    try {
      const offerCount = await energyMarketContract.methods.getOfferLength().call();
      const current_offers = [];

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

      socket.emit('offers-list', current_offers);
    } catch (error) {
      console.error('Error getting offer details:', error);
      socket.emit('error', 'Internal server error');
    }
  });

 
  socket.on('offer-energy', async (data) => {
    try {
      const quantity = data.Quantity;  // the quantity of energy to sell
      const pricePerUnit = data.PricePerUnit;  // the price per unit of energy in wei
      const duration = data.Duration;  // the duration of the offer in seconds
  
  
      const gasPrice = await web3.eth.getGasPrice();
      const gasLimit = 300000;
  
      const nonce = await web3.eth.getTransactionCount(accountAddress);
      const txParams = {
        nonce: Web3.utils.toHex(nonce),
        gasPrice: Web3.utils.toHex(gasPrice),
        gasLimit: Web3.utils.toHex(gasLimit),
        to: energyMarketContractAddress,
        data: energyMarketContract.methods.createOffer(quantity, pricePerUnit,duration).encodeABI()
      };
  
      // sign and send the transaction
      const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      socket.emit('sellenergy',true);
      receipt = Initiate_auction(duration);
  
    } catch (error) {
      console.error('Transaction failed:', error);
      socket.emit('error', 'Error creating offer');
      
    }
  });
  
  
  // Select best bid for an offer
  socket.on('select-bid', async (data) => {
    try {
      const offerId = data.offerId;
  
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
      socket.emit('error', 'Error selecting bid.');
      // res.status(500).send('Error selecting bid.');
    }
  });
  
  socket.on('place-bid', async (data) => {
    try {
      const offerId = data.offerId;
      const quantity = data.quantity;
      const pricePerUnit = data.pricePerUnit;
      const active = data.active;
      
  
      const gasPrice = await web3.eth.getGasPrice();
      const gasLimit = 300000;
  
      const nonce = await web3.eth.getTransactionCount(accountAddress);
      const txParams = {
        nonce: Web3.utils.toHex(nonce),
        gasPrice: Web3.utils.toHex(gasPrice),
        gasLimit: Web3.utils.toHex(gasLimit),
        to: energyMarketContractAddress,
        data: energyMarketContract.methods.submitBid(offerId, quantity, pricePerUnit).encodeABI()
      };
      
      const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  
      // res.send(`Bid placed successfully: ${receipt.transactionHash}`);
      socket.emit('bidplaced',true)
    } catch (error) {
      console.error('Transaction failed:', error);
      socket.emit('error','Error placing bid.');
    }
  });
  
  
  socket.on('getActiveBids', async () => {
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
    
      socket.emit('Bids',current_Bids);
    } catch (error) {
      console.error('Error getting Bids details:', error);
      socket.emit('error', 'Internal server error');
    }
  });

  socket.on('getwallet', async () => {
  try {
    const accountBalance = await web3.eth.getBalance(accountAddress);
    const x = web3.utils.fromWei(accountBalance, 'ether'); // Convert wei to ether and log the balance
    socket.on('showbalance',{ balance: x, address: accountAddress });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});
  
  socket.on('update_balance', async(data)=>{
    try{
      const energyAmount = data.energyAmount;
    
      const gasPrice = await web3.eth.getGasPrice();
      const gasLimit = 300000;
  
      const nonce = await web3.eth.getTransactionCount(accountAddress);
      const txParams = {
        nonce: Web3.utils.toHex(nonce),
        gasPrice: Web3.utils.toHex(gasPrice),
        gasLimit: Web3.utils.toHex(gasLimit),
        to: energyMarketContractAddress,
        data: energyMarketContract.methods.submitBid(energyAmount).encodeABI()
      };
      
      const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      socket.emit('update',true);
    }
    catch (error) {
      console.error('Transaction failed:', error);
      socket.emit('error', 'Internal server error');
    }
  
  });
  
  socket.on('Energy_balance', async () => {
    try {
      const energyAmount = await energyMarketContract.methods.getEnergyBalance(accountAddress).call();
      socket.on('showenergy',{ balance: energyAmount});
    } catch (error) {
      console.error(error);
      socket.emit('error', 'Internal server error');
    }
  });

  socket.on('fetchEnergyBalance', () => {
    fetchEnergyBalance()
      .then((data) => {
        socket.emit('energyBalance', data);
      })
      .catch((error) => {
        console.error(error);
      });
  });
  async function fetchEnergyBalance() {
    try {
      const availableEnergyBalance = await energyMarketContract.methods.getEnergyBalance(accountAddress).call();
      return { availableEnergyBalance };
    } catch (error) {
      console.error('Error fetching energy balance:', error);
      return { availableEnergyBalance: 0 };
    }
  }
  

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


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




async function Initiate_auction(duration,async) {
  try {
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 300000;

    const nonce = await web3.eth.getTransactionCount(accountAddress);
    const txParams = {
      nonce: Web3.utils.toHex(nonce),
      gasPrice: Web3.utils.toHex(gasPrice),
      gasLimit: Web3.utils.toHex(gasLimit),
      to: energyMarketContractAddress,
      data: energyMarketContract.methods.initiateAuction(duration).encodeABI()
    };

    // sign and send the transaction
    const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return receipt
  }
  catch (error) {
  console.error(error);
    return false;
  }
}

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
      data: energyMarketContract.methods.createOffer(quantity, pricePerUnit,duration).encodeABI()
    };

    // sign and send the transaction
    const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    res.send(`Offer created successfully.: ${receipt.transactionHash}`);
    receipt = Initiate_auction(duration);

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
      data: energyMarketContract.methods.submitBid(offerId, quantity, pricePerUnit).encodeABI()
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

app.post('/update_balance', async(res,req)=>{
  try{
    const energyAmount = req.body.energyAmount;
  
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 300000;

    const nonce = await web3.eth.getTransactionCount(accountAddress);
    const txParams = {
      nonce: Web3.utils.toHex(nonce),
      gasPrice: Web3.utils.toHex(gasPrice),
      gasLimit: Web3.utils.toHex(gasLimit),
      to: energyMarketContractAddress,
      data: energyMarketContract.methods.submitBid(energyAmount).encodeABI()
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);


  }
  catch (error) {
    console.error('Transaction failed:', error);
    res.status(500).send('Error placing bid.');
  }

});

app.get('/Energy_balance', async (req, res) => {
  try {
    const energyAmount = await energyMarketContract.methods.getEnergyBalance(accountAddress).call();
    res.json({ balance: energyAmount});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

// app.get('/Eth_balance', async(req,res) => {
//   try{

//     const ethAmount = await energyMarketContract.methods.getEthBalance(accountAddress).call();
//     res.json({balance: ethAmount});
//   } catch(error){
//     console.error(error);
//     res.status(500).send('Internal server error');
//   }

// });


http.listen(3000, () => {
  console.log('listening on *:3000');
});

