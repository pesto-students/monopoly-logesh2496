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
    monoPoly.setNextPlayer();
    rollDiceBtn.setAttribute('disabled', true);
    endTurnBtn.removeAttribute('disabled');
    setTimeout(() => performPlayerAction(monoPoly, player), 0);
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
}
function performPlayerAction(monoPoly, player) {
    const currentPosition = player.getPosition();
    const card = gameBlocks[currentPosition];
    const isValidPlace = card.price !== '';
    const isAlreadyOwned = monoPoly.owned.some(obj => obj.position === currentPosition);
    if (isAlreadyOwned) {

    } else {
        if (isValidPlace) {
            const isOk = confirm(`Would you like to buy ${card.name} for $${card.price}`);
            if (isOk) {
                monoPoly.owned.push({ position: currentPosition, player: monoPoly.playerTurn });
                player.buy(card);
            }
            endTurn();
        } else {
            //chances
            //community chest
            //Go
            //Jail
            //Just Visiting
            //Go to Jail
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
    }
    sell(card, soldPrice) {
        this.cash += soldPrice;
        this.properties = this.properties.filter(property => property.name !== card.name);
    }
}