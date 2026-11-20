let logic = module.exports;
const gameProto = require('./ApiZlm');

//默认卡牌
let cards = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, //方块 A - K
    17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, //梅花 A 3- K
    33, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, //红桃 A 3- K
    51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, //黑桃 3 - K
];

//数值掩码
let MASK_COLOR = 0xF0; //花色掩码
let MASK_VALUE = 0x0F; //数值掩码

/*-----------------------------获取牌方法-------------------------------*/

//获取所有卡牌
logic.getAllCards = function () {

    return cards;
}

logic.sortCardList = function (cardDataArr) {
    //数目过虑
    if (!cardDataArr || cardDataArr.length <= 1) return cardDataArr;
    let cardCount = cardDataArr.length;
    //转换数值
    let sortValueArr = [];
    for (let i = 0; i < cardDataArr.length; i++) {
        sortValueArr[i] = this.getCardLogicValue(cardDataArr[i]);
    }
    //排序操作
    for (let i = 0; i < cardCount; ++i) {
        let sortValue = sortValueArr[i];
        let cardData = cardDataArr[i];
        for (let j = i + 1; j < cardCount; ++j) {
            if ((sortValueArr[j] > sortValue) || ((sortValue === sortValueArr[j]) && (cardDataArr[j] > cardData))) {
                // 交换位置]
                sortValueArr[i] = sortValueArr[j];
                sortValueArr[j] = sortValue;
                sortValue = sortValueArr[i];
                cardDataArr[i] = cardDataArr[j];
                cardDataArr[j] = cardData;
                cardData = cardDataArr[i];
            }
        }
    }
    return cardDataArr;
};

//获取卡牌
logic.getExceptCards = function (allTestCards) {

    let allCards = cards.slice();
    let testCards = [];
    for (let key in allTestCards) {
        testCards = testCards.concat(allTestCards[key]);
    }
    let newCards = allCards.filter(item => !testCards.includes(item));
    return newCards.slice();
}

//获取花色
logic.getCardColor = function (cardData) {
    return cardData & MASK_COLOR;
};


//获取所有卡牌并洗牌
logic.getWashedCards = function (allTestCards) {

    let curCards = this.getExceptCards(allTestCards);
    for (let i = 0; i < curCards.length; ++i) {
        let random = Math.floor(Math.random() * curCards.length);
        let tmp = curCards[i];
        curCards[i] = curCards[random];
        curCards[random] = tmp;
    }
    return curCards.slice();
}

//判断牌是否在当前的牌库中
logic.isInCardList = function (allTestCards, cardData) {

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
logic.getCardValue = function (cardData) {
    return cardData & MASK_VALUE;
};

//逻辑数值
logic.getCardLogicValue = function (cardData) {
    //扑克属性
    let cardValue = this.getCardValue(cardData);
    if (cardValue <= 0 || cardValue > (MASK_VALUE & 0x4f)) {
        return 0;
    }
    return (cardValue <= 2) ? (cardValue + 13) : cardValue;
};

//获取出牌推荐
logic.searchOutCard = function (gameRule, userCards, curData = null) {


    let outCardList = [];
    if (!userCards || userCards.length <= 0) {
        return outCardList;
    }

    //排序
    userCards.sort((a, b) => {
        return this.getCardLogicValue(a) - this.getCardLogicValue(b)
    });

    //出牌的类型
    let curCardType = this.getCardType(curData, gameRule);
    //天炸最大
    if (curCardType && curCardType == gameProto.cardType.TIAN_BOMB) {
        return outCardList;
    }

    //牌的值及数量统计
    let {
        cardCount,
        countList
    } = this.getCardsAndCount(userCards.slice());
    countList.sort((a, b) => {
        return a.card - b.card
    });

    //单牌
    if (!curCardType || curCardType == gameProto.cardType.SINGLE) {
        //单个组合 不出队子及以上的单牌
        let curCardValue = curData ? this.getCardLogicValue(curData[0]) : 0;
        for (let key in cardCount) {
            key = parseInt(key);
            if (key > parseInt(curCardValue)) {
                let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice(0, 1);
                let cards = {
                    cardList: cardList.slice(),
                    type: gameProto.cardType.SINGLE
                };
                outCardList.push(cards);
            }
        }
    }

    //对子
    if (!curCardType || curCardType == gameProto.cardType.DOUBLE) {

        //队子组合
        let curCardValue = curData ? this.getCardLogicValue(curData[0]) : 0;
        for (let key in cardCount) {
            key = parseInt(key);
            if (key > parseInt(curCardValue) && cardCount[key] >= 2) {
                let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice(0, 2);
                let cards = {
                    cardList: cardList.slice(),
                    type: gameProto.cardType.DOUBLE
                };
                outCardList.push(cards);
            }
        }
    }

    //单联
    if (!curCardType || curCardType == gameProto.cardType.SINGLE_LINE) {

        let count = curData ? curData.length : 0;
        let curCardValue = this.getMinValue(curData);

        for (let i = 0; i < countList.length; i++) {
            let cardValue = parseInt(countList[i].card);
            if (cardValue <= curCardValue) continue;
            let curCard = userCards.find(item => this.getCardLogicValue(item) == cardValue);
            let cardList = [curCard];
            //判断是否有连续的
            for (let k = i + 1; k < countList.length; k++) {
                let nextCardValue = parseInt(countList[k].card);
                //不能带2 根据规则是否带A
                let maxCardValue = gameRule.lianWithA ? 14 : 13;
                if ((nextCardValue == cardValue + 1) && nextCardValue <= maxCardValue) {
                    //找到一个连续的
                    let nextCard = userCards.find(item => this.getCardLogicValue(item) == nextCardValue);
                    cardList.push(nextCard);
                    cardValue += 1;
                    if ((!curCardType && cardList.length >= 5) || (count == cardList.length)) {
                        let cards = {
                            cardList: cardList.slice(),
                            type: gameProto.cardType.SINGLE_LINE
                        };
                        outCardList.push(cards);
                    }
                } else {
                    break;
                }
            }
        }
    }

    //对联
    if (!curCardType || (curCardType && curCardType == gameProto.cardType.DOUBLE_LINE)) {

        //判断对连
        let count = curData ? curData.length : 0;
        let curCountList = countList.filter(item => item.count >= 2);
        let curCardValue = this.getMinValue(curData, 2);
        curCountList.sort((a, b) => {
            return a.card - b.card
        });
        for (let i = 0; i < curCountList.length; i++) {
            let cardValue = parseInt(curCountList[i].card);
            if (cardValue <= curCardValue) continue;
            let cardList = userCards.filter(item => this.getCardLogicValue(item) == cardValue).slice(0, 2);
            //判断是否有连续的
            for (let k = i + 1; k < curCountList.length; k++) {
                let nextCardValue = parseInt(curCountList[k].card);
                //不能带2 根据规则是否带A
                let maxCardValue = gameRule.lianWithA ? 14 : 13;
                if ((nextCardValue == cardValue + 1) && (nextCardValue <= maxCardValue)) {
                    //找到一个连续的
                    let nextCard = userCards.filter(item => this.getCardLogicValue(item) == nextCardValue).slice(0, 2);
                    cardList = cardList.concat(nextCard);
                    cardValue += 1;
                    if ((!curCardType && cardList.length >= 4) || (count == cardList.length)) {
                        let cards = {
                            cardList: cardList.slice(),
                            type: gameProto.cardType.DOUBLE_LINE
                        };
                        outCardList.push(cards);
                    }
                } else {
                    break;
                }
            }
        }
    }

    //三不带
    if (gameRule.isSanBuDai && (!curCardType || (curCardType && curCardType == gameProto.cardType.THREE_LINE))) {

        let curCardValue = this.getMinValue(curData, 3);
        let threeLineList = this.getThreeLineType(userCards, curCardValue);
        let count = curData ? curData.length : 0;
        threeLineList = threeLineList.filter(item => (count == 0 || count && item.cardList.length == count));
        for (let i = 0; i < threeLineList.length; i++) {
            let cards = {
                cardList: threeLineList[i].cardList.slice(),
                type: gameProto.cardType.THREE_LINE
            };
            outCardList.push(cards);
        }
    }

    //三带一
    if (!curCardType || (curCardType && curCardType == gameProto.cardType.THREE_LINE_TAKE_ONE)) {

        let curCardValue = this.getMinValue(curData, 3);
        let threeLineList = this.getThreeLineType(userCards, curCardValue);
        let count = curData ? (curData.length / 4) : 0;
        //判断几连
        threeLineList = threeLineList.filter(item => (count == 0 || item.cardList.length == count * 3));
        for (let i = 0; i < threeLineList.length; i++) {
            let cardList = threeLineList[i].cardList.slice();
            //只有一个三代一时 组合单牌
            let maxCardValue = gameRule.withA ? 14 : 13;
            let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && !cardList.includes(item));
            //组合数据
            let maxLength = parseInt(cardList.length / 3);
            otherList = logic.reGroupCard(otherList.slice(), maxLength);
            for (let i = 0; i < otherList.length; i++) {
                if (otherList[i].length == maxLength) {

                    let newCardList = cardList.slice();
                    newCardList = newCardList.concat(otherList[i]);
                    let cards = {
                        cardList: newCardList.slice(),
                        type: gameProto.cardType.THREE_LINE_TAKE_ONE
                    };
                    outCardList.push(cards);
                }
            }
        }
    }

    //三带二
    if (!curCardType || (curCardType && curCardType == gameProto.cardType.THREE_LINE_TAKE_TWO)) {

        let curCardValue = this.getMinValue(curData, 3);
        let threeLineList = this.getThreeLineType(userCards, curCardValue);
        let count = curData ? (curData.length / 5) : 0;
        //判断几连
        threeLineList = threeLineList.filter(item => (count == 0 || count && item.cardList.length == count * 3));
        for (let i = 0; i < threeLineList.length; i++) {

            let cardList = threeLineList[i].cardList.slice();
            let minValue = threeLineList[i].minValue;
            if (minValue <= curCardValue) continue;
            let maxCardValue = gameRule.withA ? 14 : 13;
            //飞机的情况 不包含2和飞机的其他牌组合
            let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && !cardList.includes(item));
            let otherResult = this.getCardsAndCount(otherList);
            let doubleList = [];
            for (let key in otherResult.cardCount) {
                if (otherResult.cardCount[key] >= 2 && !cardList.some(item => this.getCardLogicValue(item) == key)) {
                    doubleList.push(key);
                }
            }
            //组合数据
            let maxLength = parseInt(cardList.length / 3);
            otherList = logic.reGroupCard(doubleList, maxLength);
            for (let i = 0; i < otherList.length; i++) {

                let newCardList = cardList.slice();
                if (otherList[i].length == maxLength) {
                    for (let k = 0; k < otherList[i].length; k++) {
                        let curList = userCards.filter(item => this.getCardLogicValue(item) == parseInt(otherList[i][k])).slice(0, 2);
                        newCardList = newCardList.concat(curList);
                    }
                }
                let cards = {
                    cardList: newCardList.slice(),
                    type: gameProto.cardType.THREE_LINE_TAKE_TWO
                };
                outCardList.push(cards);
            }
        }
    }

    //四带二
    if (gameRule.siDaiEr && (!curCardType || (curCardType && curCardType == gameProto.cardType.FOUR_LINE_TAKE_X))) {

        let curCardValue = 0;
        let curCardResult = curData ? this.getCardsAndCount(curData) : null;
        if (curCardResult) {
            for (let key in curCardResult.cardCount) {
                if (curCardResult.cardCount[key] == 4) {
                    curCardValue = parseInt(key);
                }
            }
        }
        let fourLineResult = countList.filter(item => item.count == 4 && item.card > curCardValue);
        //组合4带2的牌型数据
        for (let i = 0; i < fourLineResult.length; i++) {

            let fourCardValue = fourLineResult[i].card;
            //飞机的情况 不包含2和飞机的其他牌组合
            let maxCardValue = gameRule.withA ? 14 : 13;
            let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != fourCardValue);
            //组合数据
            otherList = logic.reGroupCard(otherList, 2);
            let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice(0, 4);
            for (let k = 0; k < otherList.length; k++) {
                if (otherList[k].length == 2) {
                    let newCardList = cardList.slice();
                    newCardList = newCardList.concat(otherList[k].slice());
                    let cards = {
                        cardList: newCardList.slice(),
                        type: gameProto.cardType.FOUR_LINE_TAKE_X
                    };
                    outCardList.push(cards);
                }
            }
        }
    }


    //炸弹判断
    for (let key in cardCount) {

        if (key == 14 && cardCount[key] == 3) {
            //天炸
            let cardList = userCards.filter(item => this.getCardLogicValue(item) == key);
            let cards = {
                cardList,
                type: gameProto.cardType.TIAN_BOMB
            };
            outCardList.push(cards);
        } else if (cardCount[key] == 4) {
            //有4个的炸弹
            if (!curCardType || (curCardType && curCardType < gameProto.cardType.BOMB_CARD)) {
                let cardList = userCards.filter(item => this.getCardLogicValue(item) == key);
                let cards = {
                    cardList: cardList.slice(),
                    type: gameProto.cardType.BOMB_CARD
                };
                outCardList.push(cards);
            } else if (curCardType == gameProto.cardType.BOMB_CARD) {
                let curCardValue = this.getCardLogicValue(curData[0]);
                if (key > curCardValue) {
                    let cardList = userCards.filter(item => this.getCardLogicValue(item) == key);
                    let cards = {
                        cardList: cardList.slice(),
                        type: gameProto.cardType.BOMB_CARD
                    };
                    outCardList.push(cards);
                }
            }
        }
    }

    return outCardList;
}


logic.getSortCard = function (curData, gameRule) {

    let curType = this.getCardType(curData, gameRule);

    //三带一和三带二
    if (curType == gameProto.cardType.THREE_LINE_TAKE_ONE || curType == gameProto.cardType.THREE_LINE_TAKE_TWO || curType == gameProto.cardType.FOUR_LINE_TAKE_X) {

        let curList = [];
        let {
            countList
        } = this.getCardsAndCount(curData.slice());
        countList.sort((a, b) => {
            return b.card - a.card
        });
        countList.sort((a, b) => {
            return b.count - a.count
        });
        for (let i = 0; i < countList.length; i++) {
            let curDataList = curData.filter(item => this.getCardLogicValue(item) == countList[i].card);
            curList = curList.concat(curDataList);
        }
        curData = curList.slice();
    }
    return curData;

}


//比较卡牌是否可以出
logic.compareCard = function (curData, lastData, gameRule) {

    let result = {
        isSuccess: true,
        errMsg: null
    };

    let curType = this.getCardType(curData, gameRule);
    let lastType = this.getCardType(lastData, gameRule);

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
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_BOMB) {
            return result;
        } else if (curType == gameProto.cardType.SINGLE) {
            //单张比较
            let curCard = this.getCardLogicValue(curData[0]);
            let lastCard = this.getCardLogicValue(lastData[0]);
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
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_BOMB) {
            return result;
        } else if (curType == gameProto.cardType.DOUBLE) {
            //单张比较
            let curCard = this.getCardLogicValue(curData[0]);
            let lastCard = this.getCardLogicValue(lastData[0]);
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
    //三不带
    else if (lastType == gameProto.cardType.THREE_LINE) {
        //炸弹
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_BOMB) {
            return result;
        } else if (curType == gameProto.cardType.THREE_LINE) {
            //单张比较
            let curCard = this.getCardLogicValue(curData[0]);
            let lastCard = this.getCardLogicValue(lastData[0]);
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
            result.errMsg = '只能出三不带';
            return result;
        }
    }
    //三带一
    else if (lastType == gameProto.cardType.THREE_LINE_TAKE_ONE) {
        //炸弹
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_BOMB) {
            return result;
        } else if (curType == gameProto.cardType.THREE_LINE_TAKE_ONE) {
            //三带一比较3张
            let curCardResult = this.getCardsAndCount(curData.slice());
            let lastCardResult = this.getCardsAndCount(lastData.slice());
            let curCard = curCardResult.countList.find(item => item.count == 3).card;
            let lastCard = lastCardResult.countList.find(item => item.count == 3).card;
            if (parseInt(lastCard) < parseInt(curCard)) {
                //牌型排序


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
            result.errMsg = '只能出三带一';
            return result;
        }
    }
    //三带二
    else if (lastType == gameProto.cardType.THREE_LINE_TAKE_TWO) {
        //炸弹
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_BOMB) {
            return result;
        } else if (curType == gameProto.cardType.THREE_LINE_TAKE_TWO) {
            //三带二比较3张
            let curCardResult = this.getCardsAndCount(curData.slice());
            let lastCardResult = this.getCardsAndCount(lastData.slice());
            let curCard = curCardResult.countList.find(item => item.count == 3).card;
            let lastCard = lastCardResult.countList.find(item => item.count == 3).card;
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
            result.errMsg = '只能出三带二';
            return result;
        }
    }
    //四带二
    else if (lastType == gameProto.cardType.FOUR_LINE_TAKE_X) {
        //炸弹
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_BOMB) {
            return result;
        } else if (curType == gameProto.cardType.FOUR_LINE_TAKE_X) {
            //四带二比较四张
            let curCardResult = this.getCardsAndCount(curData.slice());
            let lastCardResult = this.getCardsAndCount(lastData.slice());
            let curCard = curCardResult.countList.find(item => item.count == 4).card;
            let lastCard = lastCardResult.countList.find(item => item.count == 4).card;
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
            result.errMsg = '只能出四带二';
            return result;
        }
    }
    //单连
    else if (lastType == gameProto.cardType.SINGLE_LINE) {
        //炸弹
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_BOMB) {
            return result;
        } else if (curType == gameProto.cardType.SINGLE_LINE && curData.length == lastData.length) {
            //单连比较单张
            let curCard = 0;
            let lastCard = 0;

            //当前牌的最大值
            for (let i = 0; i < curData.length; i++) {
                if (this.getCardLogicValue(curData[i]) > curCard) {
                    curCard = this.getCardLogicValue(curData[i])
                }
            }
            //上次出牌的最大值
            for (let i = 0; i < lastData.length; i++) {
                if (this.getCardLogicValue(lastData[i]) > lastCard) {
                    lastCard = this.getCardLogicValue(lastData[i])
                }
            }

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
            result.errMsg = '只能出单连牌';
            return result;
        }
    }
    //对连
    else if (lastType == gameProto.cardType.DOUBLE_LINE) {
        //炸弹
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_BOMB) {
            return result;
        } else if (curType == gameProto.cardType.DOUBLE_LINE && curData.length == lastData.length) {
            //对连比较大小
            let curCard = 0;
            let lastCard = 0;

            //当前牌的最大值
            for (let i = 0; i < curData.length; i++) {
                if (this.getCardLogicValue(curData[i]) > curCard) {
                    curCard = this.getCardLogicValue(curData[i])
                }
            }
            //上次出牌的最大值
            for (let i = 0; i < lastData.length; i++) {
                if (this.getCardLogicValue(lastData[i]) > lastCard) {
                    lastCard = this.getCardLogicValue(lastData[i])
                }
            }

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
            result.errMsg = '只能出对连牌';
            return result;
        }
    }
    //炸弹
    else if (lastType == gameProto.cardType.BOMB_CARD) {
        //炸弹
        if (curType == gameProto.cardType.TIAN_BOMB) {
            return result;
        } else if (curType == gameProto.cardType.BOMB_CARD) {
            //单张比较
            let curCard = this.getCardLogicValue(curData[0]);
            let lastCard = this.getCardLogicValue(lastData[0]);
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
    } else if (lastType == gameProto.cardType.TIAN_BOMB) {
        //天炸最大
        result.isSuccess = false;
        result.errMsg = '出牌必须大于上家';
        return result;
    }

}

//获取卡牌的类型
logic.getCardType = function (cardDataArr, gameRule) {

    if (!cardDataArr || cardDataArr.length == 0) {
        return gameProto.cardType.ERROR;
    }
    cardDataArr = cardDataArr.slice();

    //单排
    if (cardDataArr.length == 1) {
        return gameProto.cardType.SINGLE
    }
    //对子
    else if (cardDataArr.length == 2) {
        if (this.getCardLogicValue(cardDataArr[0]) === this.getCardLogicValue(cardDataArr[1])) {
            return gameProto.cardType.DOUBLE;
        }
        return gameProto.cardType.ERROR;
    } else {

        let {
            cardCount,
            countList
        } = this.getCardsAndCount(cardDataArr);

        //是否天炸
        if (cardDataArr.length == 3 && this.isTianZha(countList)) {
            return gameProto.cardType.TIAN_BOMB;
        }

        //判断是否炸弹
        if (cardDataArr.length == 4 && this.isBoom(countList)) {
            return gameProto.cardType.BOMB_CARD;
        }

        //是否单连子
        if (cardDataArr.length >= 5 && this.isDanLian(cardDataArr, countList, gameRule)) {
            return gameProto.cardType.SINGLE_LINE;
        }

        //是否四代二
        if (gameRule.siDaiEr && cardDataArr.length == 6 && this.isSiDaiEr(countList, gameRule)) {
            return gameProto.cardType.FOUR_LINE_TAKE_X;
        }
        //是否三不带
        if (gameRule.isSanBuDai && cardDataArr.length % 3 == 0 && this.isSanBuDai(countList)) {
            return gameProto.cardType.THREE_LINE;
        }

        //三带一
        if (cardDataArr.length % 4 == 0 && this.isSanDaiYi(countList, gameRule)) {
            return gameProto.cardType.THREE_LINE_TAKE_ONE;
        }

        //三代二
        if (cardDataArr.length % 5 == 0 && this.isSanDaiEr(countList, gameRule)) {
            return gameProto.cardType.THREE_LINE_TAKE_TWO;
        }
        //对连
        if (cardDataArr.length >= 4 && cardDataArr.length % 2 == 0 && this.isDuiLian(countList, gameRule)) {
            return gameProto.cardType.DOUBLE_LINE;
        }
        //默认无牌型
        return gameProto.cardType.ERROR;
    }

}

//是否三带一
logic.isSanDaiYi = function (countList, gameRule) {

    let isCardType = false;

    //带牌不能带2
    if (countList.some(item => item.card == 15)) {
        return false;
    }

    //如果不能带A时带了A
    if (!gameRule.lianWithA && countList.some(item => item.card == 14)) {
        return false;
    }

    let sanCount = 0;
    let danCount = 0;
    let cardValue = [];
    let totalCount = 0;
    for (let i = 0; i < countList.length; i++) {
        let curData = countList[i];
        totalCount += curData.count;
        if (curData.count == 3 && parseInt(countList.card) != 14) {
            sanCount += 1;
            cardValue.push(curData.card);
        } else {
            danCount += curData.count;
        }
    }
    let isLianXu = this.isContinuous(cardValue);
    if (isLianXu && (sanCount == totalCount / 4) && totalCount == sanCount * 3 + danCount) {
        isCardType = true;
    }

    return isCardType;
}

//是否三带二
logic.isSanDaiEr = function (countList, gameRule) {

    let isCardType = false;
    //带牌不能带2
    if (countList.some(item => item.card == 15)) {
        return false;
    }

    //如果不能带A时带了A
    if (!gameRule.lianWithA && countList.some(item => item.card == 14)) {
        return false;
    }

    let sanCount = 0;
    let duiCount = 0;
    let cardValue = [];
    let totalCount = 0;
    for (let i = 0; i < countList.length; i++) {
        let curData = countList[i];
        totalCount += curData.count;
        if (curData.count == 3 && parseInt(countList.card) != 14) {
            sanCount += 1;
            cardValue.push(curData.card);
        } else if (curData.count == 2) {
            duiCount += 1;
        }
    }
    let isLianXu = this.isContinuous(cardValue);
    if (isLianXu && (sanCount == totalCount / 5) && totalCount == sanCount * 3 + duiCount * 2) {
        isCardType = true;
    }
    return isCardType;
}

//是否四带二
logic.isSiDaiEr = function (countList, gameRule) {

    let isCardType = false;

    //带牌不能带2
    if (countList.some(item => item.card == 15)) {
        return false;
    }

    //如果不能带A时带了A
    if (!gameRule.lianWithA && countList.some(item => item.card == 14)) {
        return false;
    }

    //4个相同的牌就是炸弹
    if (countList.some(item => item.count == 4)) {
        isCardType = true;
    }
    return isCardType;

}

//是否对连
logic.isDuiLian = function (countList, gameRule) {

    let isCardType = false;

    //带牌不能带2
    if (countList.some(item => item.card == 15)) {
        return false;
    }

    //如果不能带A时带了A
    if (!gameRule.lianWithA && countList.some(item => item.card == 14)) {
        return false;
    }

    let totalCount = 0;
    let duiCount = 0;
    let cardValue = [];
    for (let i = 0; i < countList.length; i++) {
        let curData = countList[i];
        totalCount += curData.count;
        cardValue.push(curData.card);
        if (curData.count == 2) {
            duiCount += 1;
        }
    }
    let isLianXu = this.isContinuous(cardValue);
    if (isLianXu && totalCount == duiCount * 2) {
        isCardType = true;
    }
    return isCardType;

}

//连子5个起连
logic.isDanLian = function (cardData, countList, gameRule) {

    let curCardList = [];
    for (let i = 0; i < cardData.length; i++) {
        curCardList.push(this.getCardLogicValue(cardData[i]));
    }

    //如果有不是单牌的
    if (countList.find(item => item.count > 1)) {

        return false;
    }



    //连牌不能带2
    if (curCardList.includes(15)) {
        return false;
    }

    //连子是否带A
    if (!gameRule.lianWithA && curCardList.includes(14)) {
        return false;
    }

    //返回是否顺子
    return this.isContinuous(curCardList);

}

//是否炸弹
logic.isBoom = function (countList) {

    let isCardType = false;
    //4个相同的牌就是炸弹
    if (countList.length == 1 && countList[0].count == 4) {
        isCardType = true;
    }
    return isCardType;

}

//是否是天炸
logic.isTianZha = function (countList) {

    let isCardType = false;
    //3个A
    if (countList.length == 1 && countList[0].count == 3 && countList[0].card == 14) {
        isCardType = true;
    }
    return isCardType;

}

//是否三不带
logic.isSanBuDai = function (countList) {

    let isCardType = true;
    for (let i = 0; i < countList.length; i++) {
        if (countList[i].count != 3 || parseInt(countList.card) == 14) {
            isCardType = false;
            break;
        }
    }
    return isCardType;
}

//获取卡牌的值和数量
logic.getCardsAndCount = function (cardData) {

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

//判断是否连续
logic.isContinuous = function (cardData) {
    let maxCard = Math.max(...cardData);
    let minCard = Math.min(...cardData);
    if (maxCard - minCard == cardData.length - 1) {
        return true;
    } else {
        return false;
    }
}

//获取3带的牌型
logic.getThreeLineType = function (userCards, lastCardValue) {

    let {
        cardCount,
        countList
    } = this.getCardsAndCount(userCards.slice());
    //3个的连子
    let threeLineResult = countList.filter(item => parseInt(item.card) != 14 && item.count == 3 && parseInt(item.card) > parseInt(lastCardValue));
    // 三不带卡牌
    let threeLineList = [];
    for (let i = 0; i < threeLineResult.length; i++) {

        let cardValue = parseInt(threeLineResult[i].card);
        let cardList = userCards.filter(item => this.getCardLogicValue(item) == cardValue).slice(0, 3);
        //单连
        let cards = {
            cardList,
            type: gameProto.cardType.THREE_LINE,
            minValue: cardValue
        };
        threeLineList.push(cards);
        let nextCardValue = cardValue + 1;
        let isCanNext = true;
        while (isCanNext) {

            let nextLineResult = countList.filter(item => item.count == 3 && item.card == nextCardValue);
            if (nextLineResult.length > 0) {
                let nextCardsList = userCards.filter(item => this.getCardLogicValue(item) == nextCardValue).slice(0, 3);
                //双连
                cardList = cardList.concat(nextCardsList);
                let cards = {
                    cardList,
                    type: gameProto.cardType.THREE_LINE,
                    minValue: cardValue
                };
                threeLineList.push(cards);
                nextCardValue += 1;

            } else {
                isCanNext = false;
            }
        }
    }

    return threeLineList;

}

//数据组合
logic.reGroupCard = function (cardList, maxCount) {

    cardList = cardList.slice();
    let list = [];
    for (let i = 0; i < cardList.length; i++) {


        let curCard = cardList[i];
        let curList = [curCard];
        let isCanNext = true;
        let nextIndex = i + 1;
        while (isCanNext && curList.length != maxCount) {

            if (nextIndex < cardList.length) {
                curList.push(cardList[nextIndex]);
                nextIndex += 1;
            } else {
                isCanNext = false;
            }
            if (curList.length == maxCount) {
                isCanNext = false;
            }
        }
        if (curList.length == maxCount && !this.arrInArr(list.slice(), curList.slice())) {
            list.push(curList);
        }
    }
    return list;
}

//数组是否包含
logic.arrInArr = function (arr, arr1) {

    let isHave = false;
    arr = arr.map(item => {
        return this.getCardLogicValue(item)
    });
    arr1 = arr1.map(item => {
        return this.getCardLogicValue(item)
    });
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].toString() == arr1.toString()) {
            isHave = true;
            break;
        }
    }
    return isHave;
}

//获取最小值
logic.getMinValue = function (curData, maxCount = null) {

    let curCardValue = 0;
    let curCardResult = curData ? this.getCardsAndCount(curData) : null;
    if (curCardResult) {
        for (let key in curCardResult.cardCount) {
            if ((maxCount && curCardResult.cardCount[key] == maxCount) || !maxCount) {
                if ((curCardValue == 0 || parseInt(key) < curCardValue)) {
                    curCardValue = parseInt(key);
                }
            }
        }
    }
    return curCardValue;
}