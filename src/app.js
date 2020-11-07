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
const homePage = getById('home_page');
const gamePage = getById('game_page');
const startGameBtn = getById('start_game');
const getInstance = () => {
    return monopolyGame[instanceAttribute];
}
//Event Listeners
startGameBtn.addEventListener('click', startGame);

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

//Classes
class GameSettings {
    constructor(playersInfo) {
        this.playersInfo = playersInfo.map(({ name, color }) => {
            const playerProps = {
                name,
                color,
                cash: 1500,

            };
            return new Player(playerProps);
        });
        this.playerTurn = 0;
    }
}
class Player {
    #_position = 0;
    constructor({ name, color, cash }) {
        this.name = name;
        this.color = color;
        this.cash = cash;
    }
    getPosition() {
        return this.#_position;
    }
    setPosition(diceValue) {
        this.#_position += diceValue;
    }
}