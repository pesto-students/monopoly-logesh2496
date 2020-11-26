const pieceId = 'position_';

export default class Player {
    #_position = 0;
    #_prevPosition = 0;
    constructor(parent, { name, color, cash, id }) {
        this.parent = parent;
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
        setTimeout(() => this.performPlayerAction(this, diceValue), 0);
    }
    performPlayerAction(player, lastDiceValues = this.parent.currentDiceValue) {
        const currentPosition = this.getPosition();
        const card = this.parent.gameBlocks[currentPosition];
        const isValidPlace = card.price !== '';
        const isAlreadyOwned = this.parent.owned.some(obj => obj.position === currentPosition);
        if (isAlreadyOwned) {
            const isOwnedByOpponent = this.parent.owned.some(obj => obj.position === currentPosition && obj.player === this.parent.playerTurn);
            if (isOwnedByOpponent) {
                alert(`Take good rest in your ${card.name}`);
            } else {
                const ownerIndex = this.parent.owned.filter(obj => obj.position === currentPosition)[0].player;
                this.parent.transferRent(card, this.parent.playerTurn, ownerIndex);
            }
        } else {
            if (isValidPlace) {
                const isOk = confirm(`Would you like to buy ${card.name} for $${card.price}`);
                if (isOk) {
                    this.parent.owned.push({ position: currentPosition, player: this.parent.playerTurn });
                    player.buy(card);
                } else {
                    this.parent.startAuction(card, player);
                }
            } else {
                switch (card.name) {
                    case 'Community Chest':
                        this.handleCommunityCards(lastDiceValues - 1, player);
                        break;
                    case 'City Tax':
                        player.cash -= 200;
                        alert('Tax amount $200 has been deducted!');
                        break;
                    case 'Chance':
                        this.handleChances(lastDiceValues - 1, player);
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
        this.parent.playersInfo.map(player => player.updateCashCell());
    }
    setElementToPosition() {
        const position = document.getElementById(pieceId + this.#_position);
        position.children[this.id].style.visibility = 'visible';
        this.hidePrevElement();
    }
    hidePrevElement() {
        const position = document.getElementById(pieceId + this.#_prevPosition);
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
        const table = document.getElementById(`player_${this.id}_table`);
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
        document.getElementById(`position_${position || this.#_position}`).parentElement.style.border = `3px solid ${this.color}`;
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
        const table = document.getElementById(`player_${this.id}_table`);
        table.rows[0].cells[0].querySelector('#cash_on_hand').innerHTML = `$${this.cash}`;
    }
    handleCommunityCards(diceValue) {
        const ccStr = this.parent.communityCards[diceValue];
        alert(ccStr);
        switch (diceValue) {
            case 1:
                this.cash += 10;
                break;
            case 2:
                this.cash += 50;
                break;
            case 3:
            case 5:
            case 6:
                this.cash += 100;
                break;
            case 4:
                this.cash += 20;
                break;
            case 7:
                this.cash += 25;
                break;
            case 8:
                this.cash -= 100;
                break;
            case 9:
                this.cash += 200;
                break;
            case 10:
            case 11:
                this.cash -= 50;
                break;
            case 12:
                this.cash += 20;
                break;
            case 13:
                this.setPosition(false, 0);
                break;
            case 14:
                //TODO
                alert('Do not have support for hotels/houses');
                break;
            case 15:
                this.setPosition(false, 10);
                break;
        }
    }
    handleChances(diceValue) {
        const ccStr = this.parent.chances[diceValue];
        alert(ccStr);
        const monoPoly = this.parent;
        switch (diceValue) {
            case 1:
                //TODO
                alert('Do not have support for hotels/houses');
                break;
            case 2:
                this.cash -= 15;
                break;
            case 3:
                const noOfPlayers = monoPoly.noOfPlayers - 1;
                for (let i = 0; i < noOfPlayers; i++) {
                    this.cash -= 50;
                    if (monoPoly.playersInfo[i].id !== this.id) {
                        monoPoly.playersInfo[i].cash += 50;
                    }
                }
                break;
            case 4:
                const currentPosition = this.getPosition();
                this.setPosition(false, currentPosition - 3);
                break;
            case 5:
                if (this.getPosition() > 12 && this.getPosition() < 28) {
                    this.setPosition(false, 28);
                } else {
                    this.setPosition(false, 12);
                }
                break;
            case 6:
                this.cash += 50;
                break;
            case 7:
                if (this.getPosition() > 15 && this.getPosition() < 25) {
                    this.setPosition(false, 25);
                } else if (this.getPosition() > 5) {
                    this.setPosition(false, 15);
                } else {
                    this.setPosition(false, 5);
                }
                break;
            case 8:
                this.cash -= 15;
                break;
            case 9:
                this.setPosition(false, 5);
                this.cash += 200;
                break;
            case 10:
                this.setPosition(false, 39);
                break;
            case 11:
                this.setPosition(false, 24);
                break;
            case 12:
                this.cash += 150;
                break;
            case 13:
                if (this.getPosition() > 15 && this.getPosition() < 25) {
                    this.setPosition(false, 25);
                } else if (this.getPosition() > 5) {
                    this.setPosition(false, 15);
                } else {
                    this.setPosition(false, 5);
                }
                break;
            case 14:
                this.setPosition(false, 11);
                break;
            case 15:
                this.setPosition(false, 10);
                break;
        }
    }
}