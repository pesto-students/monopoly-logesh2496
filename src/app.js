import GameSettings from './gameSettings.js';

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

//Event Listeners
document.getElementById('start_game').addEventListener('click', startGame);
document.getElementById('no_of_players').addEventListener('change', onSelectNoOfPlayers);

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
    for (let i = 0; i < noOfPlayers; i++) {
        const id = `dyn_name_${i}`;
        getById(id).innerHTML = players[i].name;
        getById(`player_${i}_table`).style.display = 'unset';
        document.querySelector('#position_0').querySelector(`#p${i+1}`).style.visibility = 'visible';
    }
    getById('player_turn').innerHTML = playerOneSettings.name;
    getById('player_turn').style.color = playerOneSettings.color;
    hideUnwantedElements(true);
    monopolyGame[instanceAttribute] = new GameSettings(players, noOfPlayers);
}
function hideUnwantedElements(isGamePage) {
    if (isGamePage) {
        homePage.style.display = 'none';
        gamePage.style.display = 'flex';
    }
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