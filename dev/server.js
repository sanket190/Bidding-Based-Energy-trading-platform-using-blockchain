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



const energyMarketContractAddress = '0x49cCA757F227f0a47eaB797566a73cC4A951e918'; // Replace with the actual contract address
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

const users = {};
const transactions = {};

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
       

          return true;
        } catch (error) {
          console.error(error);
          socket.emit('error', error.message)
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
      
     if (AccountAddress in users){
      socket.emit("error-reg",{message:'Account is already registered'});
     }
     else{
      const result = verify(AccountAddress, PrivateKey);
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
      try {
        account = String(data.account);
        key = String(data.key);
        // console.log(users[account].privateKey);
        const result = verify(account, key);
      
        if (account in users && users[account].privateKey == key) {
          // Emit a 'login successful' event to the client
          accountAddress = account;
          accountPrivateKey = key;
      
          socket.emit('loginSuccessful', true);
        } else {
          // Emit a 'login failed' event to the client
          socket.emit('error-log', { message: 'You have not registered yet' });
        }
      } catch (err) {
        console.error(err);
        // Emit an error event to the client
        socket.emit('error-log', { message: 'An error occurred during login' });
      }
});




  socket.on('getInfo', async () => {
  
      // console.log(accountAddress,accountPrivateKey);
      try {
          if (!accountAddress || !accountPrivateKey) {
            // Emit "logout" event
            socket.emit("logout");
          }
          else{
            const accountBalance = await web3.eth.getBalance(accountAddress);
            const x = web3.utils.fromWei(accountBalance, 'ether'); // Convert wei to ether and log the balance
            socket.emit('Info', { name:users[accountAddress].name, email: users[accountAddress].email, balance: x, phone: users[accountAddress].phone, address: accountAddress });
      
          }
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
      if (!accountAddress || !accountPrivateKey) {
        // Emit "logout" event
        socket.emit("logout");
      }
      else{
      
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
      if (!accountAddress || !accountPrivateKey) {
        // Emit "logout" event
        socket.emit("logout");
      }
      else{
       
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

       
        
       
        socket.emit('sellenergy', true);
       
        var duration_gap = 1000* duration * convertToSeconds(durationUnit);
        var time = duration * convertToSeconds(durationUnit)
        Initiate_auction(time, offerId);
       
        
        setTimeout(() => {
          endRound(offerId);      
        }, duration_gap);
        // console.log(duration_gap);
      }

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

socket.on('getTransactionHistory', async()=>{
  try{
    // console.log(transactions[String(accountAddress)]);
    // console.log(transactions[accountAddress]);
    if (!accountAddress || !accountPrivateKey) {
      // Emit "logout" event
      socket.emit("logout");
    }
    else{
      if (!transactions.hasOwnProperty(String(accountAddress))) {
        console.log("no transction history is exist");
      } else {
        socket.emit('transactionHistory',transactions[accountAddress]);
      }
    }
  }
  catch(error){
    socket.emit(error);
  }
});
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
  
  currentDate = new Date();
  if (!transactions.hasOwnProperty(senderAddress)) {
    transactions[senderAddress] = [];
    transactions[senderAddress].push({
      date : currentDate.toLocaleDateString(),
      type : "withdraw",
      sender : senderAddress,
      recipient : recipientAddress,
      amount : totalCost
    });
  }
  else{
    transactions[senderAddress].push({
      date : currentDate.toLocaleDateString(),
      type : "withdraw",
      sender : senderAddress,
      recipient : recipientAddress,
      amount : totalCost
    });
  }

  if (!transactions.hasOwnProperty(recipientAddress)) {
    transactions[recipientAddress] = [];
    transactions[recipientAddress].push({
      date : currentDate.toLocaleDateString(),
      type : "deposit",
      sender : recipientAddress,
      recipient : senderAddress,
      amount : totalCost
    });
  }
  else{
    transactions[recipientAddress].push({
      date : currentDate.toLocaleDateString(),
      type : "deposit",
      sender : recipientAddress,
      recipient : senderAddress,
      amount : totalCost
    });
  }


  console.log('Transaction receipt:', transactionReceipt);
  
}
  async function endRound(offerId){
    try{
      if (!accountAddress || !accountPrivateKey) {
        // Emit "logout" event
        socket.emit("logout");
      }
      else{
        const OfferId = offerId;
        console.log("in endRound");
        const roundResult  = await energyMarketContract.methods.endRound(OfferId).call()
        // console.log( roundResult.winningBidder, roundResult.producerAddress, roundResult.totalCost);
        
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
      }
    }catch (error) {
      if (error.message.includes("revert")) {
        const errorMessage = error.message.split("revert ")[1];
        console.log(errorMessage);
        socket.emit('error',errorMessage);
      } else {
        console.log(error.message);
        socket.emit('error',error.message);
      }
    }
  }

  
  
  socket.on('place-bid', async (data) => {
    try {

      if (!accountAddress || !accountPrivateKey) {
        // Emit "logout" event
        socket.emit("logout");
      }
      else{
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
    }
    } catch (error) {
      if (error.message.includes("revert")) {
        const errorMessage = error.message.split("revert ")[1];
        console.log(errorMessage);
        socket.emit('error',errorMessage);
      } else {
        console.log(error.message);
        socket.emit('error',error.message);
      }
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
    if (!accountAddress || !accountPrivateKey) {
      // Emit "logout" event
      socket.emit("logout");
    }
    else{
    const accountBalance = await web3.eth.getBalance(accountAddress);
    const x = web3.utils.fromWei(accountBalance, 'ether'); // Convert wei to ether and log the balance
    socket.emit('showbalance',{ balance: x, address: accountAddress });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});
  
  socket.on('update_balance', async(data)=>{
    try{
      if (!accountAddress || !accountPrivateKey) {
        // Emit "logout" event
        socket.emit("logout");
      }
      else{
      
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
    }
    catch (error) {
      console.error('Transaction failed:', error);
      socket.emit('error', 'Internal server error');
    }
  
  });
  socket.on('withdraw_balance', async(data)=>{
    try{
      if (!accountAddress || !accountPrivateKey) {
        // Emit "logout" event
        socket.emit("logout");
      }
      else{
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
    }
    catch (error) {
      console.error('Transaction failed:', error);
      socket.emit('error', 'Internal server error');
    }
  
  });
  
  socket.on('Energy_balance', async () => {
    try {
      if (!accountAddress || !accountPrivateKey) {
        // Emit "logout" event
        socket.emit("logout");
      }
      else{
        const energyAmount = await energyMarketContract.methods.getEnergyBalance(accountAddress).call();
        socket.emit('showenergy',{ balance: energyAmount});
      }
     
    } catch (error) {
      console.error(error);
      socket.emit('error', 'Internal server error');
    }
  });

  

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});



http.listen(3000, () => {
  console.log('listening on *:3000');
});

