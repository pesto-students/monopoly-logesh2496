let gameBlocks;
fetch('../data/gameBlocks.json').then(blocks => {
    blocks.json().then(data => { gameBlocks = data });
});
let chances;
fetch('../data/chanceCards.json').then(cards => {
    cards.json().then(data => { chances = data });
});
let communityCards;
fetch('../data/communityCards.json').then(cards => {
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
    hideUnwantedElements(true);
    monopolyGame[instanceAttribute] = new GameSettings([playerOneSettings, playerTwoSettings]);
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
    const player = monoPoly.playersInfo[monoPoly.playerTurn];
    player.setPosition(totalIncrement);
    rollDiceBtn.setAttribute('disabled', true);
    endTurnBtn.removeAttribute('disabled');
    setTimeout(() => performPlayerAction(monoPoly, player, totalIncrement), 0);
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
function performPlayerAction(monoPoly, player, lastDiceValues) {
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
            }
            endTurn();
        } else {
            switch (card.name) {
                case 'Community Chest':
                    alert(communityCards[lastDiceValues - 1]);
                    break;
                case 'City Tax':
                    player.cash -= 200;
                    alert('Tax amount $200 has been deducted!');
                    break;
                case 'Chance':
                    alert(chances[lastDiceValues - 1])
                    break;
                case 'Just Visiting':
                    break;
                case 'Jail':
                    break;
                case 'Free Parking':
                    break;
                case 'Go to Jail':
                    break;
                default:
                    alert('Something went wrong, please report it to a dev!');
            }
        }
    }

}
//Classes
class GameSettings {
    constructor(playersInfo) {
        this.playersInfo = playersInfo.map(({ name, color }, i) => {
            const playerProps = {
                name,
                color,
                cash: 1500,
                id: i

            };
            return new Player(playerProps);
        });
        this.noOfPlayers = playersInfo.length;
        this.playerTurn = 0;
        this.owned = [];
    }
    setNextPlayer() {
        if (this.playerTurn === this.noOfPlayers - 1) {
            this.playerTurn = 0;
        } else {
            this.playerTurn++;
        }
    }
    transferRent(property, from, to) {
        const payer = this.playersInfo[from];
        const rentIndex = payer.rentpayHistory[property.name] || 1;
        const rentAmount = property[`rent${rentIndex}`];
        alert(`Rent for visiting the place ${property.name} amount: $${rentAmount} will be detucted`);
        payer.addRentPayHistory(property.name);
        if (property[`rent${rentIndex}`] <= payer.cash) {
            payer.cash -= rentAmount;
        } else {
            alert('please sell a property to pay the debt!!!');
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
    }
    getPosition() {
        return this.#_position;
    }
    setPosition(diceValue) {
        this.#_prevPosition = this.#_position;
        const newPosition = this.#_position + diceValue;
        if (newPosition > 39) {
            this.#_position = newPosition - 39;
        } else {
            this.#_position = newPosition;
        }
        this.setElementToPosition();
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
    buy(card) {
        this.cash -= card.price;
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
        getById(`position_${this.#_position}`).parentElement.style.border = `3px solid ${this.color}`;
    }
    sell(card, soldPrice) {
        this.cash += soldPrice;
        this.properties = this.properties.filter(property => property.name !== card.name);
    }
    addRentPayHistory(name) {
        if (this.rentpayHistory[name]) {
            this.rentpayHistory = this.rentpayHistory === 5 ? 5 : this.rentpayHistory + 1;
        } else {
            this.rentpayHistory[name] = 2;
        }
    }
}