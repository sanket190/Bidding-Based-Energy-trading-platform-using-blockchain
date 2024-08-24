# Bidding-Based Energy Trading Platform Using Blockchain
# Project Overview
This project is a decentralized energy trading platform that allows users to buy and sell energy through a bidding system. The platform leverages blockchain technology to ensure secure and transparent transactions. It includes smart contracts for handling offers and bids, as well as web-based interfaces for interaction.

# Prerequisites
Before you can run the project, ensure you have the following installed:

Node.js (v14.x or later)
npm (v6.x or later)
Ganache or any local Ethereum blockchain (for testing purposes)
Web3.js library
Solidity compiler (solc)
Project Structure
The project files are organized as follows:

System.sol: Solidity smart contract that manages energy offers and bids.
Client.js: Basic web server to handle client-side requests.
Producer.js: Backend server for energy producers to create offers and manage bids.
Consumer.js: Backend server for energy consumers to place bids and view offers.

Installation and Setup

# Clone the Repository:
git clone https://github.com/yourusername/energy-trading-platform.git
cd energy-trading-platform

# Install Dependencies: Navigate to the project directory and run:
 npm install

# Compile the Smart Contract: Use the Solidity compiler to compile System.sol. This will generate the ABI and bytecode needed to deploy the contract.
 solc --optimize --bin --abi System.sol -o build/

# Deploy the Smart Contract: Deploy the compiled smart contract to your local Ethereum blockchain (e.g., Ganache). You can do this using a script or through the Remix IDE. Note the contract address after deployment.

# Configure the Servers:

In Producer.js and Consumer.js, replace the placeholder contract address with the actual deployed contract address.
Update the Ethereum account addresses and private keys in both files with your own.

# Run the Servers: Start the servers by running:
node Producer.js
node Consumer.js

# Access the Platform: Open your web browser and navigate to http://localhost:3001 to interact with the platform. The server running on port 3000 is used for API requests related to the energy trading operations.

# Usage
Producers can create new energy offers by specifying the quantity, price per unit, and duration.
Consumers can view available offers and place bids on them.
The platform automatically selects the best bid for each offer, ensuring a fair and efficient trading process.
