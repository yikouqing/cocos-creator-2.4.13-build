let gameProto = require('./ApiERPdk');

//数值掩码
let MASK_COLOR = 0xF0; //花色掩码
let MASK_VALUE = 0x0F; //数值掩码

class GameLogic {

    init(gameRule) {
        this.gameRule = gameRule;
        this.cards = null;
    }

    //获取所有卡牌
    getAllCards() {

        //普通玩法 16张牌
        if (this.gameRule.cardCount == 16) {
            let cards = [
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, //方块 A - K
                17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, //梅花 A 3- K
                33, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, //红桃 A 3- K
                51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, //黑桃 3 - K
            ];
            return cards.slice();
        } else if (this.gameRule.cardCount == 10) {//玩法 10张牌
            let cards = [
                17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, //梅花 A 3- K
                33, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, //红桃 A 3- K
                51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, //黑桃 3 - K
            ];
            return cards.slice();
        } else {
            let cards = [
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, //方块 A - K
                19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, //梅花 A 3- K
                35, 36, 37, 38, 39, 40, 41, 42, 43, 44, //红桃 A 3- K
                51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, //黑桃 3 - K
            ];
            return cards.slice();
        }
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

    analyseCardDataArr(cardDataArr) {
        let cardCount = cardDataArr.length;
        let analyseResult = {
            fourCardData: [],
            threeCardData: [],
            doubleCardData: [],
            singleCardData: []
        };

        //扑克分析
        for (let i = 0; i < cardCount; i++) {
            //变量定义
            let sameCount = 1;
            let logicValue = this.getCardLogicValue(cardDataArr[i]);
            if (logicValue <= 0) return null;
            //搜索同牌
            for (let j = i + 1; j < cardCount; j++) {
                //获取扑克
                if (this.getCardLogicValue(cardDataArr[j]) !== logicValue) break;
                //设置变量
                sameCount++;
            }

            //设置结果
            switch (sameCount) {
                case 1: //单张
                    {
                        analyseResult.singleCardData.push(cardDataArr[i]);
                        break;
                    }
                case 2: //两张
                    {
                        analyseResult.doubleCardData.push(cardDataArr[i]);
                        analyseResult.doubleCardData.push(cardDataArr[i + 1]);
                        break;
                    }
                case 3: //三张
                    {
                        analyseResult.threeCardData.push(cardDataArr[i]);
                        analyseResult.threeCardData.push(cardDataArr[i + 1]);
                        analyseResult.threeCardData.push(cardDataArr[i + 2]);
                        break;
                    }
                case 4: //四张
                    {
                        analyseResult.fourCardData.push(cardDataArr[i]);
                        analyseResult.fourCardData.push(cardDataArr[i + 1]);
                        analyseResult.fourCardData.push(cardDataArr[i + 2]);
                        analyseResult.fourCardData.push(cardDataArr[i + 3]);
                        break;
                    }
            }

            //设置索引
            i += (sameCount - 1);
        }
        return analyseResult;
    };
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
        return (cardValue <= 2) ? (cardValue + 13) : cardValue;
    };


    isCardBoom(card, count) {
        if (this.gameRule.sanzhangsuanzha && card <= 13 && count == 3) {
            return true;
        } else if ((card <= 13 && count == 4) || (this.gameRule.a3Boom && card == 14 && count == 3)) {
            return true;
        } else {
            return false;
        }
    }


    //获取出牌推荐
    searchOutCard(userCards, curData = null) {

        let gameRule = this.gameRule;
        let outCardList = [];
        if (!userCards || userCards.length <= 0) {
            return outCardList;
        }

        //排序
        userCards.sort((a, b) => {
            return this.getCardLogicValue(a) - this.getCardLogicValue(b)
        });

        //出牌的类型
        let curCardType = this.getCardType(curData);
        //天炸最大
        if (curCardType && curCardType == gameProto.cardType.TIAN_BOMB) {
            return outCardList;
        }
        //炸弹判断 四带二和四带三判断
        {
            let { cardCount, countList } = this.getCardsAndCount(userCards.slice());
            for (let key in cardCount) {

                if (this.gameRule.a3Boom && key == 14 && cardCount[key] == 3) {
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
                } else if (this.gameRule.sanzhangsuanzha && cardCount[key] == 3) {
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

            //四带二
            if (false && gameRule.fourTakeTwo && (!curCardType || (curData.length == 6 && curCardType && curCardType == gameProto.cardType.FOUR_LINE_TAKE_X))) {

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
                    let maxCardValue = 14;
                    let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != fourCardValue);
                    //组合数据


                    otherList = this.reGroupCard(otherList, 2);
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

            //四带三
            if (false && gameRule.fourTakeThree && (!curCardType || (curData.length == 7 && curCardType && curCardType == gameProto.cardType.FOUR_LINE_TAKE_X))) {

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
                //组合4带3的牌型数据
                for (let i = 0; i < fourLineResult.length; i++) {

                    let fourCardValue = fourLineResult[i].card;
                    let maxCardValue = 14;
                    let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != fourCardValue);
                    //组合数据
                    otherList = this.reGroupCard(otherList, 3);
                    let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice(0, 4);
                    for (let k = 0; k < otherList.length; k++) {
                        if (otherList[k].length == 3) {
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
        }


        //如果不允许拆炸弹 去除炸弹数据
        if (!gameRule.chaizhadan) {
            //牌的值及数量统计
            let { cardCount } = this.getCardsAndCount(userCards.slice());
            for (let key in cardCount) {
                if (this.isCardBoom(key, cardCount[key])) {
                    userCards = userCards.filter(item => this.getCardLogicValue(item) != key);
                }
            }
        }

        let { cardCount, countList } = this.getCardsAndCount(userCards.slice());
        countList.sort((a, b) => { return a.card - b.card });

        //单牌
        if (!curCardType || curCardType == gameProto.cardType.SINGLE) {
            //单个组合 不出队子及以上的单牌
            let curCardValue = curData ? this.getCardLogicValue(curData[0]) : 0;
            for (let key in cardCount) {
                key = parseInt(key);
                if (key > parseInt(curCardValue) && cardCount[key] == 1) {
                    let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice(0, 1);
                    let cards = {
                        cardList: cardList.slice(),
                        type: gameProto.cardType.SINGLE
                    };
                    outCardList.push(cards);
                }
            }
            for (let key in cardCount) {
                key = parseInt(key);
                if (key > parseInt(curCardValue) && cardCount[key] >= 2) {
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
                if (key > parseInt(curCardValue) && cardCount[key] == 2) {
                    let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice(0, 2);
                    let cards = {
                        cardList: cardList.slice(),
                        type: gameProto.cardType.DOUBLE
                    };
                    outCardList.push(cards);
                }
            }
            for (let key in cardCount) {
                key = parseInt(key);
                if (key > parseInt(curCardValue) && cardCount[key] > 2) {
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
                    let maxCardValue = 14;
                    if ((nextCardValue == cardValue + 1) && nextCardValue <= maxCardValue) {
                        //找到一个连续的
                        let nextCard = userCards.find(item => this.getCardLogicValue(item) == nextCardValue);
                        cardList.push(nextCard);
                        cardValue += 1;
                        if (this.gameRule.sanzhangsuanzha && (!curCardType && cardList.length >= 3)) {
                            let cards = {
                                cardList: cardList.slice(),
                                type: gameProto.cardType.SINGLE_LINE
                            };
                            outCardList.push(cards);
                        } else if ((!curCardType && cardList.length >= 5) || (count == cardList.length)) {
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
                    let maxCardValue = 14;
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
        if (!curCardType || (curCardType && curCardType == gameProto.cardType.THREE_LINE)) {

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
                let otherList = userCards.filter(item => !cardList.includes(item));
                //组合数据
                let maxLength = parseInt(cardList.length / 3);
                let {
                    cardCount,
                    countList
                } = this.getCardsAndCount(otherList.slice());
                //优先组合单个的
                let curList = countList.filter(item => item.count == 1);
                if (curList.length >= maxLength) {
                    let curOtherList = userCards.filter(item => cardCount[this.getCardLogicValue(item)] == 1);
                    curList = this.reGroupCard(curOtherList.slice(), maxLength);
                    for (let i = 0; i < curList.length; i++) {
                        if (curList[i].length == maxLength) {

                            let newCardList = cardList.slice();
                            newCardList = newCardList.concat(curList[i]);
                            let cards = {
                                cardList: newCardList.slice(),
                                type: gameProto.cardType.THREE_LINE_TAKE_ONE
                            };
                            outCardList.push(cards);
                        }
                    }
                }
                otherList = this.reGroupCard(otherList.slice(), maxLength);
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
                //飞机的情况 不包含2和飞机的其他牌组合
                let otherList = userCards.filter(item => (!cardList.includes(item)));
                let {
                    cardCount,
                    countList
                } = this.getCardsAndCount(otherList.slice());
                //let otherResult = this.getCardsAndCount(otherList);
                //组合数据
                let maxLength = parseInt(cardList.length / 3) * 2;

                //优先组合单个的
                let curList = countList.filter(item => item.count == 1);
                if (curList.length >= maxLength) {
                    let curOtherList = userCards.filter(item => cardCount[this.getCardLogicValue(item)] == 1);
                    curList = this.reGroupCard(curOtherList.slice(), maxLength);
                    for (let i = 0; i < curList.length; i++) {
                        if (curList[i].length == maxLength) {

                            let newCardList = cardList.slice();
                            newCardList = newCardList.concat(curList[i]);
                            let cards = {
                                cardList: newCardList.slice(),
                                type: gameProto.cardType.THREE_LINE_TAKE_TWO
                            };
                            outCardList.push(cards);
                        }
                    }
                }

                otherList = this.reGroupCard(otherList.slice(), maxLength);
                for (let i = 0; i < otherList.length; i++) {
                    if (otherList[i].length == maxLength) {

                        let newCardList = cardList.slice();
                        newCardList = newCardList.concat(otherList[i]);
                        let cards = {
                            cardList: newCardList.slice(),
                            type: gameProto.cardType.THREE_LINE_TAKE_TWO
                        };
                        outCardList.push(cards);
                    }
                }

            }
        }

        let curCardList = outCardList.filter(item => item.type != gameProto.cardType.BOMB_CARD && item.type != gameProto.cardType.TIAN_BOMB);
        if (curCardList.length == 0 && outCardList.length > 0) {
            //只能出炸弹
            outCardList.sort((a, b) => {
                return a.type - b.type
            });
            return outCardList;
        } else {
            // if (this.gameRule.heitao5) {
            //     //如果包含了黑桃五5的炸弹
            //     let hei5boom = outCardList.filter(item => item.cardList.includes(53) && item.type == gameProto.cardType.BOMB_CARD);
            //     if (hei5boom.length > 0) {
            //         return hei5boom;
            //     }
            // } else 
            if (this.gameRule.heitao3) {
                //如果包含了黑桃三3的炸弹
                let hei3boom = outCardList.filter(item => item.cardList.includes(51) && item.type == gameProto.cardType.BOMB_CARD);
                if (hei3boom.length > 0) {
                    return hei3boom;
                }
            }
            curCardList.sort((a, b) => {
                return a.type - b.type
            });
            return curCardList;

        }
    }


    getSortCard(curData, gameRule) {

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


    //是否拆分了炸弹
    isChaiZhaDan(cards, allCards) {
        if ("number" == typeof cards) {
            cards = [cards];
        }
        let curCards = cards.slice();
        let curAllCards = allCards.slice();
        let curType = this.getCardType(curCards);
        let isZhaDan = false;
        if (curType != gameProto.cardType.FOUR_LINE_TAKE_X && curType != gameProto.cardType.TIAN_BOMB && curType != gameProto.cardType.BOMB_CARD) {

            for (let i = 0; i < curCards.length; i++) {
                let myCard = curCards[i];
                let sameList = curAllCards.filter(item => this.getCardValue(item) == this.getCardValue(myCard));
                if (this.gameRule.sanzhangsuanzha) {
                    //3个的炸弹
                    if (sameList.length >= 3) {
                        isZhaDan = true;
                        break;
                    }
                } else {
                    //4个的炸弹或者3a炸弹
                    if (sameList.length >= 4 || (curType != gameProto.cardType.THREE_LINE_TAKE_ONE && curType != gameProto.cardType.THREE_LINE_TAKE_TWO && this.getCardValue(myCard) == 1 && sameList.length == 3 && this.gameRule.a3Boom)) {
                        isZhaDan = true;
                        break;
                    }
                }
            }
        }
        return isZhaDan;
    }


    //比较卡牌是否可以出
    compareCard(curData, lastData) {

        let result = {
            isSuccess: true,
            errMsg: null
        };

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
            } else if (curData.length != lastData.length) {
                result.isSuccess = false;
                result.errMsg = '牌型不符合规则';
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
            } else if (curData.length != lastData.length) {
                result.isSuccess = false;
                result.errMsg = '牌型不符合规则';
                return result;
            }
            else if (curType == gameProto.cardType.THREE_LINE_TAKE_ONE) {

                //三带一比较3张
                let curCardResult = this.getCardsAndCount(curData.slice());
                let lastCardResult = this.getCardsAndCount(lastData.slice());
                let curCard = null;
                let lastCard = null;
                let lincurCardResult = [];
                let linlastCardResult = [];
                if (curData.length >= 6 && lastData.length >= 6) {
                    for (let index = 1; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index - 1].count >= 3 && curCardResult.countList[index].count >= 3 && curCardResult.countList[index - 1].card == (curCardResult.countList[index].card - 1)) {
                            lincurCardResult.push(curCardResult.countList[index - 1].card);
                        }
                    }
                    for (let index = 1; index < lastCardResult.countList.length; index++) {
                        if (lastCardResult.countList[index - 1].count >= 3 && lastCardResult.countList[index].count >= 3 && lastCardResult.countList[index - 1].card == (lastCardResult.countList[index].card - 1)) {
                            linlastCardResult.push(lastCardResult.countList[index - 1].card);
                        }
                    }
                    curCard = lincurCardResult.shift();
                    lastCard = linlastCardResult.shift();
                } else {
                    curCard = curCardResult.countList.find(item => item.count == 3).card;
                    lastCard = lastCardResult.countList.find(item => item.count == 3).card;
                }
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
            } else if (curData.length != lastData.length) {
                result.isSuccess = false;
                result.errMsg = '牌型不符合规则';
                return result;
            }
            else if (curType == gameProto.cardType.THREE_LINE_TAKE_TWO) {

                let curCardResult = this.getCardsAndCount(curData.slice());
                let lastCardResult = this.getCardsAndCount(lastData.slice());
                let curCard = null;
                let lastCard = null;
                let lincurCardResult = [];
                let linlastCardResult = [];
                if (curData.length >= 6 && lastData.length >= 6) {
                    for (let index = 1; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index - 1].count >= 3 && curCardResult.countList[index].count >= 3 && curCardResult.countList[index - 1].card == (curCardResult.countList[index].card - 1)) {
                            lincurCardResult.push(curCardResult.countList[index - 1].card);
                        }
                    }
                    for (let index = 1; index < lastCardResult.countList.length; index++) {
                        if (lastCardResult.countList[index - 1].count >= 3 && lastCardResult.countList[index].count >= 3 && lastCardResult.countList[index - 1].card == (lastCardResult.countList[index].card - 1)) {
                            linlastCardResult.push(lastCardResult.countList[index - 1].card);
                        }
                    }
                    curCard = lincurCardResult.shift();
                    lastCard = linlastCardResult.shift();
                } else {
                    curCard = curCardResult.countList.find(item => item.count == 3).card;
                    lastCard = lastCardResult.countList.find(item => item.count == 3).card;
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
                result.errMsg = '只能出三带二';
                return result;
            }
        }
        //四带二
        else if (lastType == gameProto.cardType.FOUR_LINE_TAKE_X) {
            //炸弹
            if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_BOMB) {
                return result;
            } else if (curData.length != lastData.length) {
                result.isSuccess = false;
                result.errMsg = '牌型不符合规则';
                return result;
            }
            else if (curType == gameProto.cardType.FOUR_LINE_TAKE_X) {
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
    getCardType(cardDataArr) {


        let gameRule = this.gameRule;
        if (!cardDataArr || cardDataArr.length == 0) {
            return gameProto.cardType.ERROR;
        }
        cardDataArr = cardDataArr.slice();

        if (cardDataArr.length == 1) {
            //单牌
            return gameProto.cardType.SINGLE
        } else if (cardDataArr.length == 2) {
            //对子
            if (this.getCardLogicValue(cardDataArr[0]) === this.getCardLogicValue(cardDataArr[1])) {
                return gameProto.cardType.DOUBLE;
            }
            return gameProto.cardType.ERROR;
        } else {
            let {
                countList
            } = this.getCardsAndCount(cardDataArr);
            if (gameRule.sanzhangsuanzha) {
                //判断是否炸弹
                if (cardDataArr.length == 3 && this.isBoom(countList)) {
                    return gameProto.cardType.BOMB_CARD;
                }
                //是否单连子
                if (cardDataArr.length >= 3 && this.isDanLian(cardDataArr, countList, gameRule)) {
                    return gameProto.cardType.SINGLE_LINE;
                }
            } else {
                //是否3A炸弹
                if (gameRule.a3Boom && cardDataArr.length == 3 && this.isTianZha(countList)) {
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
                //是否四带二或者四带三
                if (gameRule.fourTakeTwo && cardDataArr.length == 6 && this.isSiDaiEr(countList)) {
                    return gameProto.cardType.FOUR_LINE_TAKE_X;
                }
                //四带三
                if (gameRule.fourTakeThree && cardDataArr.length == 7 && this.isSiDaiEr(countList)) {
                    return gameProto.cardType.FOUR_LINE_TAKE_X;
                }
                //是否三不带
                if (cardDataArr.length % 3 == 0 && this.isSanBuDai(countList)) {
                    return gameProto.cardType.THREE_LINE;
                }
                //三带一
                if (cardDataArr.length % 4 == 0 && this.isSanDaiYi(countList)) {
                    return gameProto.cardType.THREE_LINE_TAKE_ONE;
                }

                //三带二
                if (cardDataArr.length % 5 == 0 && this.isSanDaiEr(countList)) {
                    return gameProto.cardType.THREE_LINE_TAKE_TWO;
                }
            }
            //对连
            if (cardDataArr.length >= 4 && cardDataArr.length % 2 == 0 && this.isDuiLian(countList)) {
                return gameProto.cardType.DOUBLE_LINE;
            }

            //默认无牌型
            return gameProto.cardType.ERROR;
        }

    }

    //是否三带一
    isSanDaiYi(countList) {

        let isCardType = false;

        //带牌不能带2
        // if (countList.some(item => item.card == 15)) {
        //     return false;
        // }

        let sanCount = 0;
        let danCount = 0;
        let cardValue = [];
        let totalCount = 0;
        for (let i = 0; i < countList.length; i++) {
            let curData = countList[i];
            totalCount += curData.count;
            if (curData.count == 3) {
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
    isSanDaiEr(countList) {

        let isCardType = false;
        //带牌不能带2
        // if (countList.some(item => item.card == 15)) {
        //     return false;
        // }

        let sanCount = 0;
        let duiCount = 0;
        let cardValue = [];
        let totalCount = 0;
        for (let i = 0; i < countList.length; i++) {
            let curData = countList[i];
            totalCount += curData.count;
            if (curData.count == 3) {
                sanCount += 1;
                cardValue.push(curData.card);
            } else if (curData.count >= 1) {
                duiCount += curData.count;
            }
        }

        if (cardValue.length >= 1) {
            let lianList = this.findShunZi(cardValue);
            let leftCount = 0;

            for (let i = 0; i < countList.length; i++) {
                let card = parseInt(countList[i].card);
                if (!lianList.includes(card)) {
                    let count = countList[i].count;
                    leftCount += count;
                }
            }

            if (lianList.length > 0 && lianList.length * 2 == leftCount) {
                isCardType = true;
            }
        }


        return isCardType;
    }

    //是否四带二
    isSiDaiEr(countList) {

        let isCardType = false;

        //4个相同的牌就是炸弹
        if (countList.some(item => item.count == 4)) {
            isCardType = true;
        }
        return isCardType;

    }


    //是否对连
    isDuiLian(countList) {

        let isCardType = false;

        //带牌不能带2
        if (countList.some(item => item.card == 15)) {
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
    isDanLian(cardData, countList) {

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

        //返回是否顺子
        return this.isContinuous(curCardList);

    }

    //是否炸弹
    isBoom(countList) {

        let isCardType = false;
        if (this.gameRule.sanzhangsuanzha) {
            //3个相同的牌就是炸弹
            if (countList.length == 1 && countList[0].count == 3) {
                isCardType = true;
            }
        } else {
            //4个相同的牌就是炸弹
            if (countList.length == 1 && countList[0].count == 4) {
                isCardType = true;
            }
        }

        return isCardType;

    }

    //是否是天炸
    isTianZha(countList) {

        let isCardType = false;
        //3个A
        if (countList.length == 1 && countList[0].count == 3 && countList[0].card == 14) {
            isCardType = true;
        }
        return isCardType;

    }

    //是否三不带
    isSanBuDai(countList) {

        let isCardType = true;
        for (let i = 0; i < countList.length; i++) {
            if (countList[i].count != 3 || (this.gameRule.a3Boom && parseInt(countList[i].card) == 14)) {
                isCardType = false;
                break;
            }
            if (i < countList.length - 1 && parseInt(countList[i].card) + 1 != parseInt(countList[i + 1].card)) {
                isCardType = false;
                break;
            }
        }
        return isCardType;
    }

    //获取卡牌的值和数量
    getCardsAndCount(cardData) {

        let cardCount = {};
        let laiList = 0;
        for (let i = 0; i < cardData.length; i++) {
            let cardValue = this.getCardLogicValue(cardData[i]);
            if (this.gameRule.isLai && this.laiZiList.includes(this.getCardLogicValue(cardValue))) {
                laiList++;
                continue;
            }
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
            countList,
            laiList
        };

    }

    //判断是否连续
    isContinuous(cardData) {

        let curSet = new Set(cardData);
        let curList = Array.from(curSet);

        let maxCard = Math.max(...cardData);
        let minCard = Math.min(...cardData);
        if (curList.length == cardData.length && maxCard - minCard == cardData.length - 1) {
            return true;
        } else {
            return false;
        }
    }

    //获取3带的牌型
    getThreeLineType(userCards, lastCardValue) {

        let {
            cardCount,
            countList
        } = this.getCardsAndCount(userCards.slice());
        //3个的连子
        let threeLineResult = countList.filter(item => item.count == 3 && parseInt(item.card) > parseInt(lastCardValue));
        if (this.gameRule.a3Boom) {
            threeLineResult = threeLineResult.filter(item => parseInt(item.card) != 14);
        }
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
    reGroupCard(cardList, maxCount) {

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
    arrInArr(arr, arr1) {

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
    getMinValue(curData, maxCount = null) {

        let curCardValue = 0;
        let curCardResult = curData ? this.getCardsAndCount(curData) : null;

        if (curCardResult) {

            let duoList = curCardResult.countList.filter(item => item.count == maxCount);
            if (duoList.length >= 3 && maxCount == 3) {
                //特殊处理飞机带三条的情况
                for (let key in curCardResult.cardCount) {
                    if ((maxCount && curCardResult.cardCount[key] == maxCount) || !maxCount) {
                        let curKey = parseInt(key);
                        if (curCardResult.cardCount[curKey + 1] == maxCount && (curCardValue == 0 || curKey < curCardValue)) {
                            curCardValue = curKey;
                        }
                    }
                }

            } else {
                for (let key in curCardResult.cardCount) {
                    if ((maxCount && curCardResult.cardCount[key] == maxCount) || !maxCount) {
                        if ((curCardValue == 0 || parseInt(key) < curCardValue)) {
                            curCardValue = parseInt(key);
                        }
                    }
                }
            }
        }
        return curCardValue;
    }


    //查找数据中的顺子 适用于3带二
    findShunZi(countList) {

        let lianList = [];
        let curCardValue = 0;
        for (let i = 0; i < countList.length; i++) {
            let curCard = parseInt(countList[i]);
            if (curCard <= curCardValue) continue;
            let cardList = [curCard];
            //判断是否有连续的
            for (let k = i + 1; k < countList.length; k++) {
                let nextCardValue = parseInt(countList[k]);
                let maxCardValue = 14;
                if ((nextCardValue == curCard + 1) && nextCardValue <= maxCardValue) {
                    cardList.push(nextCardValue);
                }
                curCard += 1;
            }
            lianList.push(cardList);
        }
        lianList.sort((a, b) => {
            return b.length - a.length
        });

        return lianList[0];
    }


    /*------------------------------------自动出牌分析-----------------------------------------------------*/
    //获取自动出牌
    getAutoCard(userCards, curData = null, isBaoDan = false, curBureau) {


        userCards = userCards.slice();
        let curCardList = this.searchOutCard(userCards, curData);

        //首轮必须出黑桃三
        if (curBureau == 1 && this.gameRule.heitao3 && userCards.includes(51)) {
            curCardList = curCardList.filter(item => item.cardList.includes(51));
        }
        //首轮必须出黑桃五
        // if (curBureau == 1 && this.gameRule.heitao5 && userCards.includes(53)) {
        //     curCardList = curCardList.filter(item => item.cardList.includes(53));
        // }
        //如果有保单 然后只能出单张的时候
        if (isBaoDan && curCardList.every(item => item.cardList.length == 1)) {
            curCardList.sort((a, b) => {
                return (this.getCardLogicValue(b.cardList[0]) - this.getCardLogicValue(a.cardList[0]))
            });

            return curCardList[0] && curCardList[0].cardList;
        } else {
            curCardList.sort((a, b) => {
                return (b.cardList.length - a.cardList.length)
            });
            return curCardList[0] && curCardList[0].cardList;
        }
    }

    //获取AI自动出牌
    getAutoAiCard(cards, curData = null, isBaoDan = false, curBureau) {

        let userCards = cards.slice();
        //排序
        userCards.sort((a, b) => {
            return this.getCardLogicValue(a) - this.getCardLogicValue(b)
        });
        let {
            cardCount,
            countList
        } = this.getCardsAndCount(userCards);
        console.log('end');

    }


    getOutCard() {

    }

    //分析
    getGenCard(cards, curData, isBaoDan = false) {

    }

    sortCardList(cardDataArr) {
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
    }

}



module.exports = new GameLogic();