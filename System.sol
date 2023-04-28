// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract EnergyMarket {
    using SafeMath for uint256;
    
    struct Offer {
        address payable seller;
        uint256 quantity;
        uint256 pricePerUnit;
        uint256 timestamp;
        uint256 offerId;
        bool active;
    }

    struct Bid {
        address buyer;
        uint256 quantity;
        uint256 pricePerUnit;
        bool active;
    }

    mapping(uint256 => Offer) public offers;
    mapping (uint256 => Bid[]) public bids;
    mapping(address => uint256) public energyBalances;
    uint256 public offerLength = 0;
    uint256 public bidCount = 0;
    uint256 public currentRound = 0;
    uint256 public biddingStartTime = 0;
    uint256 public biddingEndTime = 0;
    uint256 public biddingDuration = 0;
    uint256 public totalRounds = 0;
    uint256 public initialBiddingPrice = 0;
    uint256 public currentEquilibriumPrice;
    uint256 public currentSupply;
    uint256 public currentDemand;

   
    function createOffer(uint256 _quantity,uint256 _pricePerUnit) public {
        require(_quantity > 0, "Quantity must be greater than zero");
        require(_quantity < energyBalances[msg.sender], "Quantity must be less than your energy balance");

        uint256 offerId = offerLength;
        offers[offerId] = Offer({
            seller:payable(msg.sender),
            quantity: _quantity,
            pricePerUnit: _pricePerUnit,
            timestamp: block.timestamp,
            offerId: offerId,
            active: true
        });
        offerLength += 1;
    }
    function updateEnergyBalance(uint energyAmount) public {
        energyBalances[msg.sender] = energyBalances[msg.sender] + energyAmount;
    }
     function getEthBalance(address _account) public view returns (uint) {
        return _account.balance;
    }

    function getEnergyBalance(address _account) public view returns (uint) {
        return energyBalances[_account];
    }


    function getOfferLength() public view returns (uint256) {
        return offerLength;
    }

    function getBidCount() public view returns (uint256) {
        return bidCount;
    }

    function getBidsArrayLength(uint256 _offerId) public view returns (uint256) {
        return bids[_offerId].length;
    }

    function initiateAuction(uint256 _biddingDuration) public {
        // require(currentRound == 0, "Auction is already initiated");

        // Define the parameters for the auction
        // totalRounds = _totalRounds;
        biddingDuration = _biddingDuration;
        // initialBiddingPrice = _initialBiddingPrice;

        // Start the first round
        startRound();
    }

    function startRound() private {
        // require(currentRound < totalRounds, "All rounds have already been completed");

        // Set the starting time for the current round
        biddingStartTime = block.timestamp;

        // Set the bidding end time for the current round
        biddingEndTime = biddingStartTime.add(biddingDuration);

        // Set the initial bidding price for the current round

        setBiddingPrice(currentRound);
      
    }

    function setBiddingPrice(uint256 round) private {
        initialBiddingPrice =offers[round].pricePerUnit;
    }

    function getHighestBidPrice(uint256 round) public view returns (uint256) {
        uint256 highestBidPrice = initialBiddingPrice;
        for (uint256 i = 0; i < bids[round].length; i++) {
            if (bids[round][i].pricePerUnit > highestBidPrice) {
                highestBidPrice = bids[round][i].pricePerUnit;
            }
        }
        return highestBidPrice;
    }

    function getWinningBidder(uint256 round, uint256 highestBidPrice) public view returns (address) {
        for (uint256 i = 0; i < bids[round].length; i++) {
            if (bids[round][i].pricePerUnit == highestBidPrice) {
                return bids[round][i].buyer;
            }
        }
        // No buyer found with the highest bid price
        revert("No buyer found with the highest bid price");
    }
    function externalEndRound(uint256 round) public {
        require(round == currentRound, "Invalid round number");
        require(block.timestamp >= biddingEndTime, "Bidding period is not over yet");
        endRound();
    }


    function submitBid(uint256 _offerId, uint256 _quantity, uint256 _pricePerUnit) public {
        // require(currentRound > 0, "Auction has not been initiated yet");
        require(block.timestamp >= biddingStartTime && block.timestamp <= biddingEndTime, "Bidding is currently closed");
        require(offers[_offerId].active, "Offer is not active");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(_pricePerUnit >= initialBiddingPrice, "Bid price must be greater than or equal to the initial bidding price");

        Bid memory newBid = Bid({
            buyer: msg.sender,
            quantity: _quantity,
            pricePerUnit: _pricePerUnit,
            active: true
        });

        bids[_offerId].push(newBid);
        bidCount += 1;
    }
    function endRound() public{
        require(block.timestamp > biddingEndTime, "Bidding for the current round has not ended yet");
        require(currentRound < totalRounds, "All rounds have already been completed");

        // Determine the highest bid and the buyer who submitted it
        uint256 highestBidPrice = getHighestBidPrice(currentRound);
        address payable winningBidder = payable(getWinningBidder(currentRound, highestBidPrice));

        // Transfer energy and payment
        Bid storage winningBid= bids[currentRound][0];
        Offer storage offer = offers[currentRound];
        for (uint256 i = 0; i < bids[currentRound].length; i++) {
            if (bids[currentRound][i].buyer == winningBidder) {
                winningBid = bids[currentRound][i];
            }
        }
     
        uint256 totalCost = winningBid.quantity.mul(highestBidPrice);

        // require(energyBalances[winningBidder] >= winningBid.quantity, "The buyer does not have enough energy balance to purchase this quantity");
        require(energyBalances[offer.seller] >= winningBid.quantity, "The seller does not have enough energy balance to sell this quantity");
        energyBalances[winningBidder] = energyBalances[winningBidder].sub(winningBid.quantity);
        energyBalances[offer.seller] = energyBalances[offer.seller].add(winningBid.quantity);

        // Deactivate the current offer and bid
        offer.active = false;
        winningBid.active = false;
       
        require(winningBidder.balance >= totalCost, "Insufficient payment");
        // winningBidder.transfer(totalCost);
        (bool success, ) = offer.seller.call{value: totalCost}("");
        require(success, "Payment transfer failed");
        

        // (bool success, ) = offer.seller.call{value: totalCost}("");
        // require(success, "Payment transfer failed");

        // Start the next round
        currentRound += 1;
        // startRound();
    }
}


