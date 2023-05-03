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
        uint256 duration;
        string durationUnit;
        bool active;
    }

    struct Bid {
        address payable buyer;
        uint256 quantity;
        uint256 pricePerUnit;
        bool active;
        string status;
    }

    struct RoundResult {
        address winningBidder;
        address producerAddress;
        uint256 totalCost;
    }

    mapping(uint256 => Offer) public offers;
    mapping (uint256 => Bid[]) public bids;
    mapping(uint256 => uint256) public endDuration;
    mapping(address => uint256) public energyBalances;
    uint256 public offerLength = 0;
    uint256 public bidCount = 0;
    uint256 public biddingStartTime = 0;
    uint256 public biddingEndTime = 0;
    uint256 public biddingDuration = 0;
  
    uint256 public initialBiddingPrice = 0;
    uint256 public currentEquilibriumPrice;
    uint256 public currentSupply;
    uint256 public currentDemand;
    uint constant SECONDS_IN_HOUR = 3600;
    uint constant SECONDS_IN_MINUTE = 60;

   
    function createOffer(uint256 _quantity, uint256 _pricePerUnit,uint256 _duration, string memory _durationUnit) public returns (uint256) {
        require(_quantity > 0, "Quantity must be greater than zero");
        require(_quantity < energyBalances[msg.sender], "Quantity must be less than your energy balance");

        uint256 offerId = offerLength;
        offers[offerId] = Offer({
            seller: payable(msg.sender),
            quantity: _quantity,
            durationUnit: _durationUnit, // store duration unit as a string
            pricePerUnit: _pricePerUnit,
            timestamp: block.timestamp,
            duration:_duration,
            offerId: offerId,
            active: true
        });
        offerLength += 1;
        return offerId;
    }

    function updateEnergyBalance(uint energyAmount) public {
        energyBalances[msg.sender] = energyBalances[msg.sender] + energyAmount;
    }
   function withdrawEnergyBalance(uint energyAmount) public {
        require(energyBalances[msg.sender] >= energyAmount, "Insufficient energy balance");
        energyBalances[msg.sender] -= energyAmount;
    
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
    
  


    function initiateAuction(uint256 offerId, uint256 durationInSeconds) public {
        
        biddingDuration = durationInSeconds;

        endDuration[offerId] = durationInSeconds;
     

        // Set the starting time for the current round
        biddingStartTime = block.timestamp;

        // Set the bidding end time for the current round
        endDuration[offerId] = biddingStartTime.add(biddingDuration);

        setBiddingPrice(offerId);
        
    }
    
    

    function setBiddingPrice(uint256 offerId) private {
        initialBiddingPrice =offers[offerId].pricePerUnit;
    }

    function getHighestBidPrice(uint256 offerId) public view returns (uint256) {
        uint256 highestBidPrice = initialBiddingPrice;
        for (uint256 i = 0; i < bids[offerId].length; i++) {
            if (bids[offerId][i].pricePerUnit > highestBidPrice) {
                highestBidPrice = bids[offerId][i].pricePerUnit;
            }
        }
        return highestBidPrice;
    }



    function getWinningBidder(uint256 offerId, uint256 highestBidPrice) public returns (address) {
        for (uint256 i = 0; i < bids[offerId].length; i++) {
            if (bids[offerId][i].pricePerUnit == highestBidPrice) {
                return bids[offerId][i].buyer;
            }
        }
        for (uint256 i = 0; i < bids[offerId].length; i++) {
                bids[offerId][i].active=false;
                // bids[offerId][i].status="LostBid";           
        }
        // No buyer found with the highest bid price
        Offer storage offer = offers[offerId];
        offer.active = false;
        revert("No buyer found with the highest bid price");
    }
  


    function submitBid(uint256 _offerId, uint256 _quantity, uint256 _pricePerUnit) public {
        // require(currentRound > 0, "Auction has not been initiated yet");
        require( block.timestamp <= endDuration[_offerId], "Bidding is currently closed");
        require(offers[_offerId].active, "Offer is not active");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(_pricePerUnit >= initialBiddingPrice, "Bid price must be greater than or equal to the initial bidding price");

        Bid memory newBid = Bid({
            buyer: payable(msg.sender),
            quantity: _quantity,
            pricePerUnit: _pricePerUnit,
            active: true,
            status: "pending"
        });

        bids[_offerId].push(newBid);
        bidCount += 1;
    }

    function endRound(uint256 offerId) public returns (RoundResult memory){
        // require(block.timestamp > endDuration[offerId], "Bidding for the round has not ended yet");
        // require(currentRound < totalRounds, "All rounds have already been completed");

        
        uint256 highestBidPrice = getHighestBidPrice(offerId);
        address payable winningBidder = payable(getWinningBidder(offerId, highestBidPrice));
        

        // Transfer energy and payment
        Bid storage winningBid= bids[offerId][0];
        Offer storage offer = offers[offerId];
        offer.active = false;
        for (uint256 i = 0; i < bids[offerId].length; i++) {
            if (bids[offerId][i].buyer == winningBidder) {
                winningBid = bids[offerId][i];
            }
        }
     
        uint256 totalCost = winningBid.quantity.mul(highestBidPrice);

        // // require(energyBalances[winningBidder] >= winningBid.quantity, "The buyer does not have enough energy balance to purchase this quantity");
        // require(energyBalances[offer.seller] >= winningBid.quantity, "The seller does not have enough energy balance to sell this quantity");
        energyBalances[winningBidder] = energyBalances[winningBidder].add(winningBid.quantity);
        energyBalances[offer.seller] = energyBalances[offer.seller].sub(winningBid.quantity);

        // Deactivate the current offer and bid
       
       
        require(winningBidder.balance >= totalCost, "Insufficient payment");
       

        offer.active = false;
        winningBid.active = false;
        winningBid.status = "WinningBid";
        for (uint256 i = 0; i < bids[offerId].length; i++) {
            if (bids[offerId][i].buyer != winningBidder) {
                bids[offerId][i].active=false;
                bids[offerId][i].status="LostBid";
            }
        }
      
        RoundResult memory result = RoundResult(winningBidder, offer.seller, totalCost);
        return result;
    }
    
}


