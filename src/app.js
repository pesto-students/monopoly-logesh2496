let gameBlocks;
fetch('./data/gameBlocks.json').then(blocks => {
    blocks.json().then(data => { gameBlocks = data });
});
let chances;
fetch('./data/chanceCards.json').then(cards => {
    cards.json().then(data => { chances = data });
});
let communityCards;
fetch('./data/communityCards.json').then(cards => {
    cards.json().then(data => { communityCards = data });
});

//Selectors
const getById = (id) => document.getElementById(id);
const getPlayersInfo = (settingsElement) => {
    return {
        name: settingsElement.querySelector('input').value,
        color: settingsElement.querySelector('select').value
    }
}
const monopolyGame = getById('monopoly');
const instanceAttribute = 'game_instance';
const pieceId = 'position_';
const homePage = getById('home_page');
const gamePage = getById('game_page');
const startGameBtn = getById('start_game');
const getInstance = () => {
    return monopolyGame[instanceAttribute];
}
const rollDiceBtn = getById('roll_dice');
const endTurnBtn = getById('end_turn');

//Event Listeners

//Functions
function startGame() {
    const playerOneSettings = getPlayersInfo(getById('player_one_settings'));
    const playerTwoSettings = getPlayersInfo(getById('player_two_settings'));
    const playerThreeSettings = getPlayersInfo(getById('player_three_settings'));
    const playerFourSettings = getPlayersInfo(getById('player_four_settings'));
    const players = [playerOneSettings, playerTwoSettings, playerThreeSettings, playerFourSettings];
    let isValidationFailed = false;
    players.forEach((player, i) => {
        if (!player.name.length) {
            alert(`Player ${i + 1} name must be provided!!!`);
            isValidationFailed = true;
        }
    });
    if (isValidationFailed) {
        return;
    }
    const noOfPlayers = parseInt(getById('no_of_players').value);
    for (let i = 1; i <= noOfPlayers; i++) {
        const id = `dyn_name_${i}`;
        getById(id).innerHTML = players[i - 1].name;
    }
    getById('player_turn').innerHTML = playerOneSettings.name;
    hideUnwantedElements(true);
    monopolyGame[instanceAttribute] = new GameSettings(players, noOfPlayers);
}
function hideUnwantedElements(isGamePage) {
    if (isGamePage) {
        homePage.style.display = 'none';
        gamePage.style.display = 'unset';
    }
}
function rollDice() {
    const monoPoly = getInstance();
    const diceOne = Math.floor(Math.floor(Math.random() * 6) + 1);
    const diceTwo = Math.floor(Math.floor(Math.random() * 6) + 1);
    getById('dice_one').children[diceOne - 1].style.display = 'unset';
    getById('dice_two').children[diceTwo - 1].style.display = 'unset';
    const totalIncrement = diceOne + diceTwo;
    monoPoly.currentDice = totalIncrement;
    const player = monoPoly.playersInfo[monoPoly.playerTurn];
    player.setPosition(totalIncrement);
    rollDiceBtn.setAttribute('disabled', true);
    endTurnBtn.removeAttribute('disabled');
}
function endTurn() {
    Array.from(getById('dice_one').children).map(dice => {
        dice.style.display = 'none';
    });
    Array.from(getById('dice_two').children).map(dice => {
        dice.style.display = 'none';
    });
    rollDiceBtn.removeAttribute('disabled');
    endTurnBtn.setAttribute('disabled', true);
    getInstance().setNextPlayer();
}
function onSelectNoOfPlayers() {
    const select = getById('no_of_players');
    const noOfPlayers = parseInt(select.value);
    if (noOfPlayers === 2) {
        const elems = [getById('player_three_settings'), getById('player_four_settings')];
        elems.map(elem => {
            elem.style.display = 'none';
        });
    } else if (noOfPlayers === 3) {
        getById('player_three_settings').style.display = 'block';
        getById('player_four_settings').style.display = 'none';
    } else {
        getById('player_three_settings').style.display = 'block';
        getById('player_four_settings').style.display = 'block';
    }
}
function performPlayerAction(player, lastDiceValues) {
    const monoPoly = getInstance();
    const currentPosition = player.getPosition();
    const card = gameBlocks[currentPosition];
    const isValidPlace = card.price !== '';
    const isAlreadyOwned = monoPoly.owned.some(obj => obj.position === currentPosition);
    if (isAlreadyOwned) {
        const isOwnedByOpponent = monoPoly.owned.some(obj => obj.position === currentPosition && obj.player === monoPoly.playerTurn);
        if (isOwnedByOpponent) {
            alert(`Take good rest in your ${card.name}`);
        } else {
            const ownerIndex = monoPoly.owned.filter(obj => obj.position === currentPosition)[0].player;
            monoPoly.transferRent(card, monoPoly.playerTurn, ownerIndex);
        }
    } else {
        if (isValidPlace) {
            const isOk = confirm(`Would you like to buy ${card.name} for $${card.price}`);
            if (isOk) {
                monoPoly.owned.push({ position: currentPosition, player: monoPoly.playerTurn });
                player.buy(card);
            } else {
                startAuction(card, player);
            }
        } else {
            switch (card.name) {
                case 'Community Chest':
                    handleCommunityCards(lastDiceValues - 1, player);
                    break;
                case 'City Tax':
                    player.cash -= 200;
                    alert('Tax amount $200 has been deducted!');
                    break;
                case 'Chance':
                    handleChances(lastDiceValues - 1, player);
                    break;
                case 'Just Visiting':
                    break;
                case 'Jail':
                    break;
                case 'Free Parking':
                    break;
                case 'Go to Jail':
                    alert('Go directly to Jail. Do not pass GO. Do not collect $200.');
                    player.setPosition(false, 10);
                    break;
                case 'LUXURY TAX':
                    player.cash -= 200;
                    alert('Luxury tax amount $100 has been deducted!');
                    break;
                default:
                    alert('Something went wrong, please report it to a dev!');
            }
        }
    }
    monoPoly.playersInfo.map(player => player.updateCashCell());
}
function handleCommunityCards(diceValue, player) {
    const ccStr = communityCards[diceValue];
    alert(ccStr);
    switch (diceValue) {
        case 1:
            player.cash += 10;
            break;
        case 2:
            player.cash += 50;
            break;
        case 3:
        case 5:
        case 6:
            player.cash += 100;
            break;
        case 4:
            player.cash += 20;
            break;
        case 7:
            player.cash += 25;
            break;
        case 8:
            player.cash -= 100;
            break;
        case 9:
            player.cash += 200;
            break;
        case 10:
        case 11:
            player.cash -= 50;
            break;
        case 12:
            player.cash += 20;
            break;
        case 13:
            player.setPosition(false, 0);
            break;
        case 14:
            //TODO
            alert('Do not have support for hotels/houses');
            break;
        case 15:
            player.setPosition(false, 10);
            break;
    }
}
function handleChances(diceValue, player) {
    const ccStr = chances[diceValue];
    alert(ccStr);
    const monoPoly = getInstance();
    switch (diceValue) {
        case 1:
            //TODO
            alert('Do not have support for hotels/houses');
            break;
        case 2:
            player.cash -= 15;
            break;
        case 3:
            const noOfPlayers = monoPoly.noOfPlayers - 1;
            for (let i = 0; i < noOfPlayers; i++) {
                player.cash -= 50;
                if (monoPoly.playersInfo[i].id !== player.id) {
                    monoPoly.playersInfo[i].cash += 50;
                }
            }
            break;
        case 4:
            const currentPosition = player.getPosition();
            player.setPosition(false, currentPosition - 3);
            break;
        case 5:
            if (player.getPosition() > 12 && player.getPosition() < 28) {
                player.setPosition(false, 28);
            } else {
                player.setPosition(false, 12);
            }
            break;
        case 6:
            player.cash += 50;
            break;
        case 7:
            if (player.getPosition() > 15 && player.getPosition() < 25) {
                player.setPosition(false, 25);
            } else if (player.getPosition() > 5) {
                player.setPosition(false, 15);
            } else {
                player.setPosition(false, 5);
            }
            break;
        case 8:
            player.cash -= 15;
            break;
        case 9:
            player.setPosition(false, 5);
            player.cash += 200;
            break;
        case 10:
            player.setPosition(false, 39);
            break;
        case 11:
            player.setPosition(false, 24);
            break;
        case 12:
            player.cash += 150;
            break;
        case 13:
            if (player.getPosition() > 15 && player.getPosition() < 25) {
                player.setPosition(false, 25);
            } else if (player.getPosition() > 5) {
                player.setPosition(false, 15);
            } else {
                player.setPosition(false, 5);
            }
            break;
        case 14:
            player.setPosition(false, 11);
            break;
        case 15:
            player.setPosition(false, 10);
            break;
    }
}
// function onSellPropertySelected(e) {
//     const selectedProperty = getById('property_auction').value;
//     const monoPoly = getInstance();
//     const seller = monoPoly.playersInfo[monoPoly.playerTurn];
//     const card = seller.properties.filter(block => block.name === selectedProperty)[0];
//     seller.sell(card, card.price);
//     //TODO
//     hideAuctionArea();
// }
function showAuctionArea() {
    endTurnBtn.setAttribute('disabled', true);
    const monoPoly = getInstance();
    const payer = monoPoly.playersInfo[monoPoly.playerTurn];
    const auctionArea = getById('auction_area');
    auctionArea.style.display = 'unset';
    const select = getById('property_auction');
    payer.properties.map(property => {
        const option = document.createElement('option');
        option.innerHTML = property.name;
        select.appendChild(option);
    });
}
function hideAuctionArea() {
    const auctionArea = getById('auction_area');
    auctionArea.style.display = 'none';
    endTurnBtn.removeAttribute('disabled');
}

function startAuction(card, player) {
    const monoPoly = getInstance();
    endTurnBtn.setAttribute('disabled', true);
    const noOfPlayers = monoPoly.noOfPlayers;
    monoPoly.auctionObj = {
        name: player.name,
        id: player.id,
        position: player.getPosition(),
        inContention: noOfPlayers,
        card,
        bidders: monoPoly.playersInfo,
        winningBid: {
            player: player,
            amount: 10
        }
    };
    getById('auction_area').style.display = 'unset';
    const option = document.createElement('option');
    option.innerHTML = card.name;
    const amountElem = getById('auction_amt');
    amountElem.innerHTML = 10;
    getById('property_auction').appendChild(option);
    const biddingPlayer = monoPoly.getNextPlayer();
    monoPoly.auctionObj.currentBidder = biddingPlayer;
    getById('auction_player').innerHTML = biddingPlayer.name;

}
function increamentAuctionAmt() {
    const monoPoly = getInstance();
    const amountElem = getById('auction_amt');
    const currentBidAmount = parseInt(amountElem.innerHTML) + 10;
    const currentBiddingPlayer = monoPoly.auctionObj.currentBidder;
    if (currentBiddingPlayer.cash < currentBidAmount) {
        alert('You dont have sufficient cash to continue in this bidding.');
        bidOff();
        return;
    }
    monoPoly.auctionObj.winningBid = { player: currentBiddingPlayer, amount: currentBidAmount };
    amountElem.innerHTML = currentBidAmount;
    setNextPlayerInPage(monoPoly);
}
function setNextPlayerInPage(monoPoly, isBidOff) {
    const nextPlayer = monoPoly.getNextBiddingPlayer();
    if (isBidOff) {
        monoPoly.auctionObj.bidders = monoPoly.auctionObj.bidders.filter(player => player.id !== monoPoly.auctionObj.currentBidder.id);
    }
    monoPoly.auctionObj.currentBidder = nextPlayer;
    getById('auction_player').innerHTML = nextPlayer.name;
}
function bidOff() {
    const monoPoly = getInstance();
    monoPoly.auctionObj.inContention -= 1;
    if (monoPoly.auctionObj.inContention === 1) {
        alert(`${monoPoly.auctionObj.winningBid.player.name} has won the bidding for $${monoPoly.auctionObj.winningBid.amount}. Congrats`);
        const { position, winningBid, card } = monoPoly.auctionObj;
        monoPoly.owned.push({ position, player: winningBid.player.id });
        winningBid.player.buy(card, winningBid.amount, position);
        hideAuctionArea();
        endTurnBtn.removeAttribute('disabled');
        return;
    }
    setNextPlayerInPage(monoPoly, true);
}
function getMortgageSelectedCard() {
    const select = getById('property_mortgage');
    const cardName = select.value;
    return gameBlocks.filter(block => block.name === cardName)[0];
}
function onMortgageSelect() {
    const card = getMortgageSelectedCard();
    getById('mortgage_amt').innerHTML = '$' + card.price / 2;
}
function onGetMortgageValue() {
    const monoPoly = getInstance();
    const player = monoPoly.playersInfo[monoPoly.playerTurn];
    const card = getMortgageSelectedCard();
    mortgagePrice = card.price / 2;
    alert(`Mortgage: ${card.name} property for ${mortgagePrice}!`);
    monoPoly.mortgages.push({ name: card.name, mortgagePrice, id: player.id, payable: (mortgagePrice + ((mortgagePrice * 10) / 100)) });
    player.properties = player.properties.filter(property => property.name !== card.name);
    player.cash += mortgagePrice;
    player.updateCashCell();
    monoPoly.updateMortgage();
}
function payMortgageAndGetProperty() {
    const monoPoly = getInstance();
    const player = monoPoly.playersInfo[monoPoly.playerTurn];
    const select = getById('bank_props');
    const cardName = select.value;
    const { name, payable } = monoPoly.mortgages.filter(block => block.name === cardName)[0];
    if (player.cash < payable) {
        alert('You dont have sufficient money to get back this property!');
        return;
    }
    alert(`Getting back: ${name} property for ${payable}!`);
    monoPoly.mortgages = monoPoly.mortgages.filter(mortgage => mortgage.name !== name);
    player.properties.push(gameBlocks.filter(block => block.name === name)[0]);
    player.cash -= payable;
    player.updateCashCell();
    monoPoly.updateMortgage();
}
function onBankPropertySelect() {
    const monoPoly = getInstance();
    const select = getById('bank_props');
    const cardName = select.value;
    const { payable } = monoPoly.mortgages.filter(block => block.name === cardName)[0];
    getById('bank_amt').innerHTML = '$' + payable;
}
//Classes
class GameSettings {
    constructor(playersInfo, noOfPlayers) {
        this.playersInfo = playersInfo.slice(0, noOfPlayers).map(({ name, color }, i) => {
            const playerProps = {
                name,
                color,
                cash: 1500,
                id: i

            };
            return new Player(playerProps);
        });
        this.noOfPlayers = noOfPlayers;
        this.playerTurn = 0;
        this.owned = [];
        this.auctionObj = {};
        this.mortgages = [];
    }
    setNextPlayer() {
        if (this.playerTurn === this.noOfPlayers - 1) {
            this.playerTurn = 0;
        } else {
            this.playerTurn++;
        }
        getById('player_turn').innerHTML = this.playersInfo[this.playerTurn].name;
        this.updateMortgage();
    }
    getNextPlayer() {
        let index;
        if (this.playerTurn === this.noOfPlayers - 1) {
            index = 0;
        } else {
            index = this.playerTurn + 1;
        }
        return this.auctionObj.bidders[index];
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
            showAuctionArea();
            alert('please sell a property to pay the debt!!!');
        }
        payer.updateCashCell();
    }
    updateMortgage() {
        const { properties, id } = this.playersInfo[this.playerTurn];
        if (properties.length) {
            const mortgageEle = getById('mortgage_area');
            mortgageEle.style.display = 'inline-block';
            const select = getById('property_mortgage');
            select.innerHTML = '';
            properties.map(property => {
                const option = document.createElement('option');
                option.innerHTML = property.name;
                select.appendChild(option);
            });
            const cardName = select.value;
            const card = gameBlocks.filter(block => block.name === cardName)[0];
            getById('mortgage_amt').innerHTML = '$' + card.price / 2;
        } else {
            const mortgageEle = getById('mortgage_area');
            mortgageEle.style.display = 'none';
        }
        if (this.mortgages.filter(mortgage => mortgage.id === id).length) {
            const mortgageArea = getById('bank_area');
            mortgageArea.style.display = 'inline-block';
            const select = getById('bank_props');
            select.innerHTML = '';
            this.mortgages.map(property => {
                const option = document.createElement('option');
                option.innerHTML = property.name;
                select.appendChild(option);
            });
            getById('bank_amt').innerHTML = '$' + this.mortgages[0].payable;
        } else {
            const mortgageArea = getById('bank_area');
            mortgageArea.style.display = 'none';
        }
    }
}
class Player {
    #_position = 0;
    #_prevPosition = 0;
    constructor({ name, color, cash, id }) {
        this.name = name;
        this.color = color;
        this.cash = cash;
        this.id = id;
        this.properties = [];
        this.rentpayHistory = {};
        this.freeFromJailPass = 0;
        this.collectForGo = false;
    }
    getPosition() {
        return this.#_position;
    }
    setPosition(diceValue, toValue) {
        this.#_prevPosition = this.#_position;
        if (toValue) {
            this.#_position = toValue;
        } else {
            const newPosition = this.#_position + diceValue;
            if (newPosition > 39) {
                this.#_position = newPosition - 39;
            } else {
                this.#_position = newPosition;
            }
        }
        const isGoingToJail = toValue && toValue === 10;
        if (isGoingToJail) {
            alert('Collecting $50 fine for jail!');
            this.cash -= 50;
        }
        if (this.collectForGo && this.#_position > 0 && this.#_position <= 12 && !isGoingToJail) {
            this.collectForGo = false;
            this.cash += 200;
            this.updateCashCell();
            alert('$200 has been credited for crossing GO!');
        }
        if (this.#_position > 27 && this.#_position <= 39) {
            this.collectForGo = true;
        }
        this.setElementToPosition();
        setTimeout(() => performPlayerAction(this, diceValue), 0);
    }
    setElementToPosition() {
        const position = getById(pieceId + this.#_position);
        position.children[this.id].style.visibility = 'visible';
        this.hidePrevElement();
    }
    hidePrevElement() {
        const position = getById(pieceId + this.#_prevPosition);
        position.children[this.id].style.visibility = 'hidden';
    }
    buy(card, amount, position) {
        const price = amount || card.price;
        if (this.cash < price) {
            alert(`You don't have sufficient money to buy this property.`);
            return;
        }
        this.cash -= price;
        this.properties.push(card);
        const table = getById(`player_${this.id}_table`);
        table.rows[0].cells[0].querySelector('#cash_on_hand').innerHTML = `$${this.cash}`;
        if (this.properties.length === 1) {
            table.rows[1].cells[0].innerHTML = card.name;
        } else {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.innerHTML = card.name;
            tr.appendChild(td);
            table.tBodies[0].appendChild(tr);
        }
        getById(`position_${position || this.#_position}`).parentElement.style.border = `3px solid ${this.color}`;
        this.updateCashCell();
    }
    sell(card, soldPrice) {
        this.cash += soldPrice;
        this.properties = this.properties.filter(property => property.name !== card.name);
        this.updateCashCell();
    }
    addRentPayHistory(name) {
        if (this.rentpayHistory[name]) {
            this.rentpayHistory[name] = this.rentpayHistory[name] === 5 ? 5 : this.rentpayHistory[name] + 1;
        } else {
            this.rentpayHistory[name] = 1;
        }
    }
    updateCashCell() {
        const table = getById(`player_${this.id}_table`);
        table.rows[0].cells[0].querySelector('#cash_on_hand').innerHTML = `$${this.cash}`;
    }
}