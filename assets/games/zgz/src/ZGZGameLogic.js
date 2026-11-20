const gameProto = require('./ApiZgz');
//数值掩码
const MASK_COLOR = 0xF0; //花色掩码
const MASK_VALUE = 0x0F; //数值掩码

class GameLogic {

    init(gameRule) {
        this.gameRule = gameRule;
        this.cards = null;
        this.isLiangSan = false;
    }

    //获取所有卡牌
    getAllCards() {

        let cards = [
            0x4E, 0x4F, //王牌
            0X01, 0X02, 0X03, 0X04, 0x05, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, //方块 
            0X11, 0X12, 0X13, 0X14, 0x15, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, //梅花 
            0X21, 0X22, 0X23, 0X24, 0x25, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, //红桃 
            0X31, 0X32, 0X33, 0X34, 0x35, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, //黑桃 
        ];
        return cards.slice();
    }


    //设置方块三是否亮了
    setLiangSan(isLiang = true) {
        this.isLiangSan = isLiang;
    }

    //获取卡牌
    getExceptCards(allTestCards) {

        let allCards = this.getAllCards();
        let testCards = [];
        for (let key in allTestCards) {
            testCards = testCards.concat(allTestCards[key]);
        }
        let newCards = allCards.filter(item => !testCards.includes(item));
        return newCards.slice();
    }

    //获取花色
    getCardColor(cardData) {
        return cardData & MASK_COLOR;
    };


    //获取所有卡牌并洗牌
    getWashedCards(allTestCards) {

        let curCards = this.getExceptCards(allTestCards);

        for (let k = 0; k < 300; k++) {
            for (let i = 0; i < curCards.length; ++i) {
                let random = Math.floor(Math.random() * curCards.length);
                let tmp = curCards[i];
                curCards[i] = curCards[random];
                curCards[random] = tmp;
            }
        }
        return curCards.slice();
    }

    //判断牌是否在当前的牌库中
    isInCardList(allTestCards, cardData) {

        let curCards = this.getExceptCards(allTestCards);
        let indexList = [];
        for (let i = 0; i < cardData.length; i++) {
            let curIndex = curCards.findIndex(item => item == cardData[i]);
            if (curIndex >= 0) {
                indexList.push(curIndex);
            }
        }
        let isSuccess = false;
        if (indexList.length == cardData.length) {
            isSuccess = true;
        }
        return isSuccess;
    }

    /*-----------------------------基础方法-------------------------------*/

    //获取卡牌值
    getCardValue(cardData) {
        return cardData & MASK_VALUE;
    };

    //逻辑数值
    getCardLogicValue(cardData) {
        //扑克属性
        let cardValue = this.getCardValue(cardData);
        if (cardValue <= 0 || cardValue > (MASK_VALUE & 0x4f)) {
            return 0;
        }
        return (cardValue <= 4) ? (cardValue + 13) : cardValue;
    };

    //获取出牌推荐
    searchOutCard(userCards, curData = null) {

        let outCardList = [];
        if (!userCards || userCards.length <= 0) {
            return outCardList;
        }


        if (curData) {
            curData.sort((a, b) => { return this.getCardSingleValue(a) - this.getCardSingleValue(b) });
        }

        //排序
        userCards.sort((a, b) => { return this.getCardLogicValue(a) - this.getCardLogicValue(b) });
        //出牌的类型
        let curCardType = this.getCardType(curData);
        //天炸最大
        if (curCardType && curCardType == gameProto.cardType.TIAN_BOMB) {
            return outCardList;
        }

        let { cardCount, countList } = this.getCardsAndCount(userCards.slice());
        countList.sort((a, b) => { return a.card - b.card });

        //单牌
        if (!curCardType || curCardType == gameProto.cardType.SINGLE) {
            //单个组合 不出队子及以上的单牌
            let curCardValue = curData ? this.getCardSingleValue(curData[0]) : 0;
            let cardList = userCards.filter(item => this.getCardSingleValue(item) > curCardValue);
            for (let i = 0; i < cardList.length; i++) {

                let curCard = cardList[i];
                let allCard = userCards.filter(item => this.getCardSingleValue(item) == this.getCardSingleValue(curCard));
                if (allCard.length > 0) {
                    let curValue = this.getCardSingleValue(curCard);
                    let cards = { cardList: [curCard], type: gameProto.cardType.SINGLE, value: curValue };
                    outCardList.push(cards);
                }
            }
            outCardList.sort((a, b) => { return a.value - b.value });
        }

        //对子
        if (!curCardType || curCardType == gameProto.cardType.DOUBLE) {
            //队子组合
            let curCardValue = curData ? this.getCardSingleValue(curData[0]) : 0;
            for (let key in cardCount) {
                key = parseInt(key);
                if (cardCount[key] == 2) {

                    let cardList = userCards.filter(item => ![0x4E, 0x4F].includes(item) && this.getCardLogicValue(item) == key);
                    cardList.sort((a, b) => { return this.getCardSingleValue(a) - this.getCardSingleValue(b) });
                    let curType = this.getCardType(cardList);
                    let curValue = this.getCardSingleValue(cardList[0]);
                    if (curType == gameProto.cardType.DOUBLE && curValue > curCardValue) {
                        let cards = { cardList: cardList.slice(), type: gameProto.cardType.DOUBLE, value: curValue };
                        outCardList.push(cards);
                    }
                }
                outCardList.sort((a, b) => { return a.value - b.value });
            }
        }


        //3炸
        if (!curCardType || curCardType <= gameProto.cardType.BOMB_CARD3) {
            //队子组合
            let curCardValue = curData ? this.getCardSingleValue(curData[0]) : 0;
            for (let key in cardCount) {
                key = parseInt(key);
                if (cardCount[key] == 3) {
                    let cardList = userCards.filter(item => ![0x4E, 0x4F].includes(item) && this.getCardLogicValue(item) == key);
                    cardList.sort((a, b) => { return this.getCardSingleValue(a) - this.getCardSingleValue(b) });
                    let curType = this.getCardType(cardList);
                    let curValue = this.getCardSingleValue(cardList[0]);
                    if (curType == gameProto.cardType.BOMB_CARD3 && (!curCardType || curCardType < gameProto.cardType.BOMB_CARD3 || curValue > curCardValue)) {
                        let cards = { cardList: cardList.slice(), type: gameProto.cardType.BOMB_CARD3, value: curValue };
                        outCardList.push(cards);
                    }
                }
            }
        }

        //4炸
        if (!curCardType || curCardType <= gameProto.cardType.BOMB_CARD4) {
            //队子组合
            let curCardValue = curData ? this.getCardSingleValue(curData[0]) : 0;
            for (let key in cardCount) {
                key = parseInt(key);
                if (cardCount[key] == 4) {
                    let cardList = userCards.filter(item => ![0x4E, 0x4F].includes(item) && this.getCardLogicValue(item) == key);
                    cardList.sort((a, b) => { return this.getCardSingleValue(a) - this.getCardSingleValue(b) });
                    let curType = this.getCardType(cardList);
                    let curValue = this.getCardSingleValue(cardList[0]);
                    if (curType == gameProto.cardType.BOMB_CARD4 && (!curCardType || curCardType < gameProto.cardType.BOMB_CARD4 || curValue > curCardValue)) {
                        let cards = { cardList: cardList.slice(), type: gameProto.cardType.BOMB_CARD4, value: curValue };
                        outCardList.push(cards);
                    }
                }
                outCardList.sort((a, b) => { return a.value - b.value });
            }
        }


        //双王或者对3
        if (!curCardType || curCardType < gameProto.cardType.TIAN_BOMB) {
            //王的组合
            let wanCode = 19;
            let cardList = userCards.filter(item => this.getCardSingleValue(item) >= wanCode);
            if (cardList.length == 2) {
                let cards = { cardList: cardList.slice(), type: gameProto.cardType.TIAN_BOMB, value: wanCode };
                outCardList.push(cards);
            }
            //对3的组合
            let threeCode = 18;
            cardList = userCards.filter(item => this.getCardSingleValue(item) == threeCode);
            if (cardList.length == 2) {
                let cards = { cardList: cardList.slice(), type: gameProto.cardType.TIAN_BOMB, value: threeCode };
                outCardList.push(cards);
            }
        }

        outCardList.sort((a, b) => { return a.value - b.value });
        outCardList.sort((a, b) => { return a.type - b.type });
        return outCardList;

    }

    //获取玩家比较值的大小
    getCardSingleValue(card) {

        if (card == 0x4F) {
            //大鬼
            return 20;
        } else if (card == 0x4E) {
            //小鬼
            return 19;
        } else if (card == 35) {
            //红桃3
            return 18;
        } else if (this.isLiangSan && card == 3) {
            //亮了的方块3
            return 18;
        } else {
            return this.getCardLogicValue(card);
        }
    }


    //比较卡牌是否可以出
    compareCard(curData, lastData) {


        curData.sort((a, b) => { return this.getCardSingleValue(a) - this.getCardSingleValue(b) });
        if (lastData) {
            lastData.sort((a, b) => { return this.getCardSingleValue(a) - this.getCardSingleValue(b) });
        }

        let result = { isSuccess: true, errMsg: null };

        let curType = this.getCardType(curData);
        let lastType = this.getCardType(lastData);

        //当前数据没有牌型
        if (curType == gameProto.cardType.ERROR) {
            //牌型不对 
            result.isSuccess = false;
            result.errMsg = '牌型不符合规则';
            return result;
        }

        //上一轮没有出牌
        if (curType && lastType == gameProto.cardType.ERROR) {
            return result;
        }

        //单排
        if (lastType == gameProto.cardType.SINGLE) {
            //炸弹
            if (curType == gameProto.cardType.TIAN_BOMB || curType == gameProto.cardType.BOMB_CARD3 || curType == gameProto.cardType.BOMB_CARD4) {
                return result;
            } else if (curType == gameProto.cardType.SINGLE) {
                //单张比较
                let curCard = this.getCardSingleValue(curData[0]);
                let lastCard = this.getCardSingleValue(lastData[0]);
                if (parseInt(lastCard) < parseInt(curCard)) {
                    return result;
                } else {
                    //大小不正确
                    result.isSuccess = false;
                    result.errMsg = '出牌必须大于上家';
                    return result;
                }

            } else {
                //牌型不对
                result.isSuccess = false;
                result.errMsg = '只能出单张';
                return result;
            }
        }
        //对子
        else if (lastType == gameProto.cardType.DOUBLE) {
            //炸弹
            if (curType == gameProto.cardType.TIAN_BOMB || curType == gameProto.cardType.BOMB_CARD3 || curType == gameProto.cardType.BOMB_CARD4) {
                return result;
            } else if (curType == gameProto.cardType.DOUBLE) {
                //单张比较
                let curCard = this.getCardSingleValue(curData[0]);
                let lastCard = this.getCardSingleValue(lastData[0]);
                if (parseInt(lastCard) < parseInt(curCard)) {
                    return result;
                } else {
                    //大小正确
                    result.isSuccess = false;
                    result.errMsg = '出牌必须大于上家';
                    return result;
                }

            } else {
                //牌型不对
                result.isSuccess = false;
                result.errMsg = '只能出对子';
                return result;
            }
        }
        //三炸
        else if (lastType == gameProto.cardType.BOMB_CARD3) {

            //炸弹
            if (curType == gameProto.cardType.TIAN_BOMB || curType == gameProto.cardType.BOMB_CARD4) {
                return result;
            } else if (curData.length != lastData.length) {
                result.isSuccess = false;
                result.errMsg = '牌型不符合规则';
                return result;
            } else if (curType == gameProto.cardType.BOMB_CARD3) {
                //单张比较
                let curCard = this.getCardSingleValue(curData[0]);
                let lastCard = this.getCardSingleValue(lastData[0]);
                if (parseInt(lastCard) < parseInt(curCard)) {
                    return result;
                } else {
                    //大小正确
                    result.isSuccess = false;
                    result.errMsg = '出牌必须大于上家';
                    return result;
                }

            } else {
                //牌型不对
                result.isSuccess = false;
                result.errMsg = '只能出炸弹';
                return result;
            }
        }
        //四炸
        else if (lastType == gameProto.cardType.BOMB_CARD4) {
            //炸弹
            if (curType == gameProto.cardType.TIAN_BOMB) {
                return result;
            } else if (curData.length != lastData.length) {
                result.isSuccess = false;
                result.errMsg = '牌型不符合规则';
                return result;
            }
            else if (curType == gameProto.cardType.BOMB_CARD4) {
                //单张比较
                let curCard = this.getCardSingleValue(curData[0]);
                let lastCard = this.getCardSingleValue(lastData[0]);
                if (parseInt(lastCard) < parseInt(curCard)) {
                    return result;
                } else {
                    //大小正确
                    result.isSuccess = false;
                    result.errMsg = '出牌必须大于上家';
                    return result;
                }

            } else {
                //牌型不对
                result.isSuccess = false;
                result.errMsg = '只能出炸弹';
                return result;
            }
        }
        else if (lastType == gameProto.cardType.TIAN_BOMB) {
            //天炸最大
            result.isSuccess = false;
            result.errMsg = '出牌必须大于上家';
            return result;
        }

    }

    //获取卡牌的类型
    getCardType(cardDataArr) {

        if (!cardDataArr || cardDataArr.length == 0) {
            return gameProto.cardType.ERROR;
        }
        cardDataArr = cardDataArr.slice();

        if (cardDataArr.length == 1) {
            //单牌
            return gameProto.cardType.SINGLE
        } else if (cardDataArr.length == 2) {

            let hong3code = [3, 35];
            let wangCode = [0x4E, 0x4F];
            if (wangCode.includes(cardDataArr[0]) && wangCode.includes(cardDataArr[1])) {
                //王的炸弹
                return gameProto.cardType.TIAN_BOMB;
            }
            else if (this.isLiangSan && hong3code.includes(cardDataArr[0]) && hong3code.includes(cardDataArr[1])) {
                //对三的炸弹
                return gameProto.cardType.TIAN_BOMB;
            } else if (this.getCardLogicValue(cardDataArr[0]) === this.getCardLogicValue(cardDataArr[1])) {
                //对子 
                return gameProto.cardType.DOUBLE;
            }
            return gameProto.cardType.ERROR;

        } else if (cardDataArr.length == 3) {

            //判断是否一样
            let isSame = cardDataArr.every(item => this.getCardLogicValue(item) == this.getCardLogicValue(cardDataArr[0]));
            if (isSame) {
                return gameProto.cardType.BOMB_CARD3;
            }
            return gameProto.cardType.ERROR;

        } else if (cardDataArr.length == 4) {

            //判断是否一样
            let isSame = cardDataArr.every(item => this.getCardLogicValue(item) == this.getCardLogicValue(cardDataArr[0]));
            if (isSame) {
                return gameProto.cardType.BOMB_CARD4;
            }
            return gameProto.cardType.ERROR;
        }
        return gameProto.cardType.ERROR;

    }



    //获取卡牌的值和数量
    getCardsAndCount(cardData) {


        cardData = cardData.filter(item => ![0x4E, 0x4F].includes(item))
        let cardCount = {};
        for (let i = 0; i < cardData.length; i++) {
            let cardValue = this.getCardLogicValue(cardData[i]);
            if (!cardCount[cardValue]) {
                cardCount[cardValue] = 0;
            }
            cardCount[cardValue] += 1;
        }
        let countList = [];
        for (let key in cardCount) {
            let data = {
                card: key,
                count: cardCount[key]
            };
            countList.push(data);
        }
        return {
            cardCount,
            countList
        };

    }



    /*------------------------------------自动出牌分析-----------------------------------------------------*/
    //获取自动出牌
    getAutoCard(userCards, curData = null) {


        userCards = userCards.slice();
        //首轮必须红桃5
        if (userCards.includes(37)) {
            let curCardList = userCards.filter(item => this.getCardLogicValue(item) == 5);
            return curCardList;
        }

        let curCardList = this.searchOutCard(userCards, curData);
        return curCardList[0] && curCardList[0].cardList;

    }
}




module.exports = new GameLogic();