import Dice_1 from './assets/Die_1.png';
import Dice_2 from './assets/Die_2.png';
import Dice_3 from './assets/Die_3.png';
import Dice_4 from './assets/Die_4.png';
import Dice_5 from './assets/Die_5.png';
import Dice_6 from './assets/Die_6.png';

export const getRandomDiceValue = () => Math.floor(Math.floor(Math.random() * 6) + 1);

export const getImageById = (id) => {
    switch(id){
        case 1:
            return Dice_1;
        case 2:
            return Dice_2;
        case 3:
            return Dice_3;
        case 4:
            return Dice_4;
        case 5:
            return Dice_5;
        case 6:
            return Dice_6;
        default:
            return id;
    }
}