import Player from './player.js';
import { getRandomDiceValue } from './utils.js';

const rollDiceId = 'roll_dice';
const endTurnId = 'end_turn';
const diceOneId = 'dice_one'
const diceTwoId = 'dice_two';
const bidMoreBtnId = 'increment_amount';
const bidOffId = 'bid_off';

const getMortgageBtnId = 'get_mortgage';
const payMortgageBtnId = 'pay_mortgage';
const mortageSelectId = 'property_mortgage';

export default class GameSettings {
    constructor(playersInfo, noOfPlayers) {
        this.addListeners();
        this.loadAssets();
        this.playersInfo = playersInfo.slice(0, noOfPlayers).map(({ name, color }, i) => {
            const playerProps = {
                name,
                color,
                cash: 1500,
                id: i

            };
            return new Player(this, playerProps);
        });
        this.currentPlayer = this.playersInfo[0];
        this.noOfPlayers = noOfPlayers;
        this.playerTurn = 0;
        this.owned = [];
        this.auctionObj = {};
        this.mortgages = [];
    }
    addListeners() {
        document.getElementById(rollDiceId).addEventListener('click', this.rollDice.bind(this));
        document.getElementById(endTurnId).addEventListener('click', this.endTurn.bind(this));

        document.getElementById(bidMoreBtnId).addEventListener('click', this.increamentAuctionAmt.bind(this));
        document.getElementById(bidOffId).addEventListener('click', this.bidOff.bind(this));

        document.getElementById(getMortgageBtnId).addEventListener('click', this.onGetMortgageValue.bind(this));
        document.getElementById(mortageSelectId).addEventListener('click', this.onMortgageSelect.bind(this));
        document.getElementById(payMortgageBtnId).addEventListener('click', this.payMortgageAndGetProperty.bind(this));

        document.getElementById('bank_props').addEventListener('click', this.onBankPropertySelect.bind(this));
    }
    loadAssets() {
        Promise.all([fetch('./data/gameBlocks.json'), fetch('./data/chanceCards.json'), fetch('./data/communityCards.json')]).then((values) => {
            Promise.all(values.map(value => value.json())).then(responses => {
                [this.gameBlocks, this.chances, this.communityCards] = responses;
            });
          });
    }
    rollDice() {
        const diceOne = getRandomDiceValue();
        const diceTwo = getRandomDiceValue();
        const totalDiceValue = diceOne + diceTwo;

        this.showDices(diceOne, diceTwo);
        this.currentDiceValue = totalDiceValue;
        this.currentPlayer.setPosition(totalDiceValue);

        this.disableRollDiceBtn();
        this.enableEndTurnBtn();
    }
    endTurn() {
        Array.from(document.getElementById(diceOneId).children).map(dice => {
            dice.style.display = 'none';
        });
        Array.from(document.getElementById(diceTwoId).children).map(dice => {
            dice.style.display = 'none';
        });
        this.enableRollDiceBtn();
        this.disableEndTurnBtn();
        this.setNextPlayer();
    }
    showDices(diceOne, diceTwo) {
        document.getElementById('dice_one').children[diceOne - 1].style.display = 'unset';
        document.getElementById('dice_two').children[diceTwo - 1].style.display = 'unset';
    }
    hideDices() {
    }
    enableRollDiceBtn() {
        document.getElementById(rollDiceId).removeAttribute('disabled');
    }
    disableRollDiceBtn() {
        document.getElementById(rollDiceId).setAttribute('disabled', true);
    }
    enableEndTurnBtn() {
        document.getElementById(endTurnId).removeAttribute('disabled');
    }
    disableEndTurnBtn() {
        document.getElementById(endTurnId).setAttribute('disabled', true);
    }
    setNextPlayer() {
        if (this.playerTurn === this.noOfPlayers - 1) {
            this.playerTurn = 0;
        } else {
            this.playerTurn++;
        }
        this.currentPlayer = this.playersInfo[this.playerTurn];
        document.getElementById('player_turn').innerHTML = this.playersInfo[this.playerTurn].name;
        this.updateMortgage();
    }
    getNextPlayer() {
        let index;
        if (this.playerTurn === this.noOfPlayers - 1) {
            index = 0;
        } else {
            index = this.playerTurn + 1;
        }
        return (this.auctionObj.bidders || this.playersInfo)[index];
    }
    getNextBiddingPlayer() {
        let index;
        const { inContention, bidders, currentBidder } = this.auctionObj;
        const currentBidderIndex = bidders.findIndex(bidder => bidder.id === currentBidder.id);
        if (currentBidderIndex === (bidders.length - 1)) {
            index = 0;
        } else {
            index = currentBidderIndex + 1;
        }
        return bidders[index];
    }
    transferRent(property, from, to) {
        const payer = this.playersInfo[from];
        const owener = this.playersInfo[to];
        const rentIndex = payer.rentpayHistory[property.name];
        let rentAmount = rentIndex ? property[`rent${rentIndex}`] : property[`baserent`];
        if (property.groupNumber === 2) {
            const diceValue = getInstance().currentDice;
            rentAmount = owener.properties.filter(property => property.groupNumber === 2).length === 2 ? diceValue * 10 : diceValue * 2;
        }
        alert(`Rent for visiting the place ${property.name} amount: $${rentAmount} will be detucted`);
        payer.addRentPayHistory(property.name);
        if (rentAmount <= payer.cash) {
            payer.cash -= rentAmount;
        } else {
            if (!payer.properties.length) {
                alert('You do not have any property to pay the debt. Game ended!');
                return;
            }
            this.showAuctionArea();
            alert('please sell a property to pay the debt!!!');
        }
        payer.updateCashCell();
    }
    updateMortgage() {
        const { properties, id } = this.currentPlayer;
        if (properties.length) {
            const mortgageEle = document.getElementById('mortgage_area');
            mortgageEle.style.display = 'inline-block';
            const select = document.getElementById('property_mortgage');
            select.innerHTML = '';
            properties.map(property => {
                const option = document.createElement('option');
                option.innerHTML = property.name;
                select.appendChild(option);
            });
            const cardName = select.value;
            const card = this.gameBlocks.filter(block => block.name === cardName)[0];
            document.getElementById('mortgage_amt').innerHTML = '$' + card.price / 2;
        } else {
            const mortgageEle = document.getElementById('mortgage_area');
            mortgageEle.style.display = 'none';
        }
        const playerMortgageProps = this.mortgages.filter(mortgage => mortgage.id === id);
        if (playerMortgageProps.length) {
            const mortgageArea = document.getElementById('bank_area');
            mortgageArea.style.display = 'inline-block';
            const select = document.getElementById('bank_props');
            select.innerHTML = '';
            playerMortgageProps.map(property => {
                const option = document.createElement('option');
                option.innerHTML = property.name;
                select.appendChild(option);
            });
            document.getElementById('bank_amt').innerHTML = '$' + this.mortgages[0].payable;
        } else {
            const mortgageArea = document.getElementById('bank_area');
            mortgageArea.style.display = 'none';
        }
    }
    startAuction(card, player) {
        this.disableEndTurnBtn();
        const noOfPlayers = this.noOfPlayers;
        const biddingPlayer = this.getNextPlayer();
        this.auctionObj = {
            name: player.name,
            id: player.id,
            position: player.getPosition(),
            inContention: noOfPlayers,
            card,
            bidders: this.playersInfo,
            winningBid: {
                player: player,
                amount: 10
            },
            currentBidder: biddingPlayer
        };
        this.enableAuctionArea();
        this.setAuctionAmt(10);
        this.addAuctionSelectValues([card]);
        document.getElementById('auction_player').innerHTML = biddingPlayer.name;
    }
    enableAuctionArea() {
        document.getElementById('auction_area').style.display = 'unset';
    }
    setAuctionAmt(value) {
        const amountElem = document.getElementById('auction_amt');
        amountElem.innerHTML = value;
    }
    addAuctionSelectValues(properties) {
        const select = document.getElementById('property_auction');
        properties.map(property => {
            const option = document.createElement('option');
            option.innerHTML = property.name;
            select.appendChild(option);
        });
    }
    showAuctionArea() {
        this.disableEndTurnBtn();
        const payer = this.currentPlayer;
        this.enableAuctionArea();
        this.addAuctionSelectValues(payer.properties);
    }
    increamentAuctionAmt() {
        const amountElem = document.getElementById('auction_amt');
        const currentBidAmount = parseInt(amountElem.innerHTML) + 10;
        const currentBiddingPlayer = this.auctionObj.currentBidder;
        if (currentBiddingPlayer.cash < currentBidAmount) {
            alert('You dont have sufficient cash to continue in this bidding.');
            this.bidOff();
            return;
        }
        this.auctionObj.winningBid = { player: currentBiddingPlayer, amount: currentBidAmount };
        amountElem.innerHTML = currentBidAmount;
        this.setNextPlayerInPage();
    }
    bidOff() {
        this.auctionObj.inContention -= 1;
        if (this.auctionObj.inContention === 1) {
            const { position, winningBid, card } = this.auctionObj;
            alert(`${winningBid.player.name} has won the bidding for $${winningBid.amount}. Congrats`);
            this.owned.push({ position, player: winningBid.player.id });
            winningBid.player.buy(card, winningBid.amount, position);
            this.hideAuctionArea();
            this.enableEndTurnBtn();
            return;
        }
        this.setNextPlayerInPage(true);
    }
    hideAuctionArea() {
        const auctionArea = document.getElementById('auction_area');
        auctionArea.style.display = 'none';
        this.enableEndTurnBtn();
    }
    setNextPlayerInPage(isBidOff) {
        const nextPlayer = this.getNextBiddingPlayer();
        if (isBidOff) {
            const {bidders, currentBidder} = this.auctionObj;
            this.auctionObj.bidders = bidders.bidders.filter(player => player.id !== currentBidder.id);
        }
        this.auctionObj.currentBidder = nextPlayer;
        document.getElementById('auction_player').innerHTML = nextPlayer.name;
    }

    //MORTGAGE

    onGetMortgageValue() {
        const player = this.currentPlayer;
        const card = this.getMortgageSelectedCard();
        const mortgagePrice = card.price / 2;
        alert(`Mortgage: ${card.name} property for ${mortgagePrice}!`);
        this.mortgages.push({ name: card.name, mortgagePrice, id: player.id, payable: (mortgagePrice + ((mortgagePrice * 10) / 100)) });
        player.properties = player.properties.filter(property => property.name !== card.name);
        player.cash += mortgagePrice;
        player.updateCashCell();
        this.updateMortgage();
    }

    getMortgageSelectedCard() {
        const select = document.getElementById('property_mortgage');
        const cardName = select.value;
        return this.gameBlocks.filter(block => block.name === cardName)[0];
    }
    onMortgageSelect() {
        const card = this.getMortgageSelectedCard();
        document.getElementById('mortgage_amt').innerHTML = '$' + card.price / 2;
    }
    payMortgageAndGetProperty() {
        const player = this.currentPlayer;
        const select = document.getElementById('bank_props');
        const cardName = select.value;
        const { name, payable } = this.mortgages.filter(block => block.name === cardName)[0];
        if (player.cash < payable) {
            alert('You dont have sufficient money to get back this property!');
            return;
        }
        alert(`Getting back: ${name} property for ${payable}!`);
        this.mortgages = this.mortgages.filter(mortgage => mortgage.name !== name);
        player.properties.push(this.gameBlocks.filter(block => block.name === name)[0]);
        player.cash -= payable;
        player.updateCashCell();
        this.updateMortgage();
    }
    onBankPropertySelect() {
        const select = document.getElementById('bank_props');
        const cardName = select.value;
        const { payable } = this.mortgages.filter(block => block.name === cardName)[0];
        document.getElementById('bank_amt').innerHTML = '$' + payable;
    }
}