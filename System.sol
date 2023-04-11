// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnergyMarket {
    struct Offer {
        address seller;
        uint256 quantity;
        uint256 pricePerUnit;
        uint256 duration;
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
    uint256 public offerLength=0;
    uint256 public bidCount =0;
   

    function createOffer(uint256 _quantity, uint256 _pricePerUnit, uint256 _duration) public {
        uint256 offerId = offerLength;
        offers[offerId] = Offer({
            seller: msg.sender,
            quantity: _quantity,
            pricePerUnit: _pricePerUnit,
            duration: _duration,
            timestamp: block.timestamp,
            offerId: offerId,
            active: true
        });
        offerLength+=1;
        
    }

    function getOfferLength() public view returns (uint256) {
        return offerLength;
    }

    function getBidCount() public view returns (uint256){
        return bidCount;
    }
    function getBidsArrayLength(uint _offerId) public view returns (uint) {
        return bids[_offerId].length;
    }

    function placeBid(uint256 _offerId, uint256 _quantity, uint256 _pricePerUnit, bool _active) public {
        require(offers[_offerId].active, "Offer is no longer active");

        bids[_offerId].push(Bid({
            buyer: msg.sender,
            quantity: _quantity,
            pricePerUnit: _pricePerUnit,
            active: _active
        }));
        bidCount+=1;
    }

    function selectBid(uint256 _offerId) public payable {
        Offer storage offer = offers[_offerId];
        require(offer.active, "Offer is not active");

        uint256 bestBidPrice = 0;
        uint256 bestBidIndex = 0;
        for (uint256 i = 0; i < bids[_offerId].length; i++) {
            Bid storage bid = bids[_offerId][i];
            if (bid.active && bid.pricePerUnit > bestBidPrice) {
                bestBidPrice = bid.pricePerUnit;
                bestBidIndex = i;
            }
        }

        require(bestBidPrice > 0, "No active bids found");

        Bid storage bestBid = bids[_offerId][bestBidIndex];
        require(bestBid.active, "Bid is not active");
        
       

        // Verify that the buyer has sufficient funds to purchase the energy
        uint256 totalCost = bestBid.quantity * bestBid.pricePerUnit;

       
        require(address(bestBid.buyer).balance >= totalCost, "Insufficient funds");


        // Verify that the seller has enough energy to sell
        require(offer.quantity >= bestBid.quantity, "Insufficient energy");

        // Transfer the energy from the seller to the buyer
        offer.quantity -= bestBid.quantity;
        bestBid.active = false;
        // payable(bestBid.buyer).transfer(totalCost);
    }
}