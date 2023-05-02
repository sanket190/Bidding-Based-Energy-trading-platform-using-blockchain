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



const energyMarketContractAddress = '0xDa08F378EA5f1eC711cA9D679F1e9b8a707d1295'; // Replace with the actual contract address
const contractAbi = require('./contractabi.json');
const { off } = require('process');
const energyMarketContract = new web3.eth.Contract(contractAbi, energyMarketContractAddress);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var accountAddress;
var accountPrivateKey;
var Name;
var email;
var phone;
// var offerId;
// var Password;
const users = {};
// const users = [];

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});



io.on('connection', (socket) => {
  console.log("user is connected");
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
        accountAddress = account;
        accountPrivateKey = key;

          return true;
        } catch (error) {
          console.error(error);
          socket.emit('error', error)
          return false;
        }
  }



 

    // Register event handler
  socket.on('register', async (data) => {
      // Store user information in users object
      const name = data.Name;
      const Email = data.Email;
      const AccountAddress = String(data.accountAddress);
      const PrivateKey = String(data.Privatekey);
      const Phone = data.phone;
     

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
        accountAddress= AccountAddress,
        accountPrivateKey= PrivateKey,
        Name = name;
        email=Email;
        phone = Phone;
       
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
        accountAddress=account,
        accountPrivateKey=key,
        
        socket.emit('loginSuccessful',true);
      } else {
        // Emit a 'login failed' event to the client
        socket.emit('error', { message: 'You have not registered yet' });
      }
    const account = String(data.account);
    const key = String(data.key);
    });




  socket.on('getInfo', async () => {
    try {
      
      // console.log(accountAddress,accountPrivateKey);
      const accountBalance = await web3.eth.getBalance(accountAddress);
      const x = web3.utils.fromWei(accountBalance, 'ether'); // Convert wei to ether and log the balance
      socket.emit('Info', { name:users[accountAddress].name, email: users[accountAddress].email, balance: x, phone: users[accountAddress].phone, address: accountAddress });
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'Internal server error' });
    }
  });


  socket.on('get-offers', async () => {
    try {
      const offerCount = await energyMarketContract.methods.getOfferLength().call();
      const current_offers = [];
      // console.log(offerCount);

      for (let i = 0; i < offerCount; i++) {
        const offer = await energyMarketContract.methods.offers(i).call();
        current_offers.push({
          seller: offer.seller,
          quantity: offer.quantity,
          pricePerUnit: offer.pricePerUnit,
          duration: offer.duration,
          timestamp: offer.timestamp,
          offerId: offer.offerId,
          durationUnit: offer.durationUnit,
          durationEnd:offer.durationEnd,
          active: offer.active
        });
      }


      socket.emit('offers-list', current_offers);
    } catch (error) {
      console.error('Error getting offer details:', error);
      socket.emit('error', 'Internal server error');
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
  async function Initiate_auction(duration_gap,offerId) {
    try {
      const gasPrice = await web3.eth.getGasPrice();
      const gasLimit = 300000;

      const nonce = await web3.eth.getTransactionCount(accountAddress);
      const txParams = {
        nonce: Web3.utils.toHex(nonce),
        gasPrice: Web3.utils.toHex(gasPrice),
        gasLimit: Web3.utils.toHex(gasLimit),
        to: energyMarketContractAddress,
        data: energyMarketContract.methods.initiateAuction(offerId,duration_gap).encodeABI()
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

  socket.on('checkLoggedIn', (callback) => {
    const isLoggedIn = login; // replace with your implementation
  
    // Call the callback function with the logged-in status
    callback(isLoggedIn);
  });
 
  socket.on('offer-energy', async (data) => {
    try {
        const quantity = data.Quantity; 
        const pricePerUnit = data.PricePerUnit; 
        const duration = data.Duration; 
        const durationUnit = String(data.DurationUnit);
        const gasPrice = await web3.eth.getGasPrice();
        const gasLimit = 300000;
        const offerId = await energyMarketContract.methods.getOfferLength().call();

        const nonce = await web3.eth.getTransactionCount(accountAddress);
        const txParams = {
            nonce: Web3.utils.toHex(nonce),
            gasPrice: Web3.utils.toHex(gasPrice),
            gasLimit: Web3.utils.toHex(gasLimit),
            to: energyMarketContractAddress,
            data: energyMarketContract.methods.createOffer(quantity, pricePerUnit, duration, durationUnit).encodeABI()
        };
        const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

       
        console.log(offerId,duration,durationUnit);
       
        socket.emit('sellenergy', true);
       
        var duration_gap = 1000* duration * convertToSeconds(durationUnit);
        Initiate_auction(duration_gap, offerId);
        console.log(duration_gap);
        
        setTimeout(() => {
          endRound(offerId);      
        }, duration_gap);
        // console.log(duration_gap);

    } catch (error) {
        console.error('Transaction failed:', error);
        socket.emit('error', 'Problem occure while creating offer');
    }
  });

  function convertToSeconds(unit) {
    switch (unit) {
      case "day":
        return 86400; // 24 hours * 60 minutes * 60 seconds
      case "hour":
        return 3600; // 60 minutes * 60 seconds
      case "minute":
        return 60;
      case "second":
        return 1;
      default:
        throw new Error(`Invalid time unit: ${unit}`);
    }
  }

// Send the transaction
async function sendTransaction(senderAddress,recipientAddress,totalCost) {
  const ethAmount = String(totalCost);
  const weiAmount = web3.utils.toWei(ethAmount, 'ether');
  const nonce = await web3.eth.getTransactionCount(accountAddress);
  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = 300000;
  const transactionObject = {
    nonce: nonce,
    from: senderAddress,
    to: recipientAddress,
    value: weiAmount,
    gas: gasLimit,
    gasPrice: gasPrice,
  };
  const signedTransaction = await web3.eth.accounts.signTransaction(transactionObject, accountPrivateKey);
  const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
  console.log('Transaction receipt:', transactionReceipt);
}
  async function endRound(offerId){
    try{
    const OfferId = offerId;
    console.log("in endRound");
    const roundResult  = await energyMarketContract.methods.endRound(OfferId).call()
    console.log( roundResult.winningBidder, roundResult.producerAddress, roundResult.totalCost);
    
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 300000;
   
    const nonce = await web3.eth.getTransactionCount(accountAddress);
    const txParams = {
        nonce: Web3.utils.toHex(nonce),
        gasPrice: Web3.utils.toHex(gasPrice),
        gasLimit: Web3.utils.toHex(gasLimit),
        to: energyMarketContractAddress,
        data: energyMarketContract.methods.endRound(offerId).encodeABI()
    };
    const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    await sendTransaction(roundResult.winningBidder,roundResult.producerAddress,roundResult.totalCost);
    
    }catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      
    }
  }

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
      // const active = data.active;
      
  
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
            active: bids.active,
            status:bids.status
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
    socket.emit('showbalance',{ balance: x, address: accountAddress });
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
        data: energyMarketContract.methods.updateEnergyBalance(energyAmount).encodeABI()
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
  socket.on('withdraw_balance', async(data)=>{
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
        data: energyMarketContract.methods.withdrawEnergyBalance(energyAmount).encodeABI()
      };
      
      const signedTx = await web3.eth.accounts.signTransaction(txParams, accountPrivateKey);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      socket.emit('withdraw',true);
    }
    catch (error) {
      console.error('Transaction failed:', error);
      socket.emit('error', 'Internal server error');
    }
  
  });
  
  socket.on('Energy_balance', async () => {
    try {
      accountAddress=accountAddress
      accountPrivateKey=accountPrivateKey;
      const energyAmount = await energyMarketContract.methods.getEnergyBalance(accountAddress).call();
      socket.emit('showenergy',{ balance: energyAmount});
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



http.listen(3000, () => {
  console.log('listening on *:3000');
});

