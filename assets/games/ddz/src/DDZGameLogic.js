let gameProto = require('./ApiDdz');
//数值掩码
let MASK_COLOR = 0xF0; //花色掩码
let MASK_VALUE = 0x0F; //数值掩码
class GameLogic {

    init(gameRule) {
        this.gameRule = gameRule;
        this.cards = null;
        this.laiZiList = []; //癞子点数
        if (this.gameRule.isLai && this.gameRule.laiZiList.length > 0) {
            for (let index = 0; index < this.gameRule.laiZiList.length; index++) {
                this.laiZiList.push(this.getCardLogicValue(this.gameRule.laiZiList[index]));
            }
        }
    }
    /*-----------------------------获取牌方法-------------------------------*/
    //获取所有卡牌
    getAllCards = function () {
        //去掉三四五
        if (this.gameRule.isSanSiWuFilter) {
            let cards = [
                0x4E, 0x4F, //王牌
                0X01, 0X02, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, //方块 A- K
                0X11, 0X12, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, //梅花 A- K
                0X21, 0X22, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, //红桃 A- K
                0X31, 0X32, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, //黑桃 A- K
            ];
            return cards.slice();
        } else if (!this.gameRule.isWashCard) {
            let cards = [
                0X03, 0X13, 0X23, 0X33, 0X04, 0X14, 0X24, 0X34, 0x05, 0x15, 0x25, 0x35, // 3- 5
                0x06, 0x16, 0x26, 0x36, 0x07, 0x17, 0x27, 0x37, 0x08, 0x18, 0x28, 0x38, // 6- 8
                0x09, 0x19, 0x29, 0x39, 0x0A, 0x1A, 0x2A, 0x3A, 0x0B, 0x1B, 0x2B, 0x3B, // 9- j
                0x0C, 0x1C, 0x2C, 0x3C, 0x0D, 0x1D, 0x2D, 0x3D, 0X01, 0X11, 0X21, 0X31, // 10- A
                0X02, 0X12, 0X22, 0X32, 0x4E, 0x4F, //2 -王牌
            ];
            return cards.slice();
        } else {
            let cards = [
                0x4E, 0x4F, //王牌
                0X01, 0X02, 0X03, 0X04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, //方块 A- K
                0X11, 0X12, 0X13, 0X14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, //梅花 A- K
                0X21, 0X22, 0X23, 0X24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, //红桃 A- K
                0X31, 0X32, 0X33, 0X34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, //黑桃 A- K
            ];
            return cards.slice();
        }

    }
    //获取卡牌
    getExceptCards = function (allTestCards) {

        let allCards = this.getAllCards();
        let testCards = [];
        for (let key in allTestCards) {
            testCards = testCards.concat(allTestCards[key]);
        }
        let newCards = allCards.filter(item => !testCards.includes(item));
        return newCards.slice();
    }

    //获取花色
    getCardColor = function (cardData) {
        return cardData & MASK_COLOR;
    };



    //获取不洗牌
    getUnWashCards = function () {

        let allCards = this.getAllCards();
        return allCards.slice();


    }

    //洗牌
    washList(list) {

        let curCards = list.slice();
        for (let index = 0; index < 300; index++) {
            for (let i = 0; i < curCards.length; ++i) {
                let random = Math.floor(Math.random() * curCards.length);
                let tmp = curCards[i];
                curCards[i] = curCards[random];
                curCards[random] = tmp;
            }
        }
        return curCards.slice();
    }


    //获取所有卡牌并洗牌
    getWashedCards = function (allTestCards) {
        let curCards = this.getExceptCards(allTestCards);
        let Cardlength = 10;
        //不洗牌玩法 只洗总牌数 54/6=9*2=18 次
        if (this.gameRule.isWashCard) {
            for (let index = 0; index < Cardlength; index++) {
                for (let i = 0; i < curCards.length; ++i) {
                    let random = Math.floor(Math.random() * curCards.length);
                    let tmp = curCards[i];
                    curCards[i] = curCards[random];
                    curCards[random] = tmp;
                }
            }
        }
        else {
            //不洗牌玩法 洗总牌数次数 1
            let linlength = curCards.length / 5;
            for (let i = 0; i < linlength; ++i) {
                let random = Math.floor(Math.random() * curCards.length);
                curCards = curCards.concat(curCards.splice(random, 4));
            }
        }

        return curCards.slice();
    }
    //判断牌是否在当前的牌库中
    isInCardList = function (allTestCards, cardData) {
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
        let cardValue = cardData & 0x0F;
        if (cardValue <= 0 || cardValue > (0x0F & 0x4F)) {
            return 0;
        }
        if (cardData == 0x4E) {
            return (cardValue + 2);
        }
        if (cardData == 0x4F) {
            return (cardValue + 2);
        }
        return (cardValue <= 2) ? (cardValue + 13) : cardValue;
    };


    isCardBoom(card, count) {
        if (card <= 13 && count == 4) {
            return true;
        } else {
            return false;
        }
    }
    //获取出牌推荐
    searchOutCard = function (userCards, curData = null) {
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
        if (curCardType && curCardType == gameProto.cardType.WANG_BOMB) {
            return outCardList;
        }

        //炸弹判断 四带二和四带三判断
        {
            let {
                cardCount,
                countList,
                laiList
            } = this.getCardsAndCount(userCards.slice());
            if (laiList == 4) {
                //纯癞子炸
                let cardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item)));
                let cards = {
                    cardList,
                    type: gameProto.cardType.CHUN_LAIZI_BOMB
                };
                outCardList.push(cards);
            }
            for (let key in cardCount) {
                if ((key == this.getCardLogicValue(0x4E) && userCards.includes(0x4F)) || (key == this.getCardLogicValue(0x4F) && userCards.includes(0x4E))) {
                    if (!curCardType || (curCardType && curCardType < gameProto.cardType.CHUN_LAIZI_BOMB)) {
                        let iswang = outCardList.filter(item => item.type == gameProto.cardType.WANG_BOMB);
                        if (iswang.length > 0) {
                            continue;
                        }
                        //天炸
                        let cardList = userCards.filter(item => this.getCardLogicValue(item) >= this.getCardLogicValue(0x4E)).slice();
                        let cards = {
                            cardList,
                            type: gameProto.cardType.WANG_BOMB
                        };
                        outCardList.push(cards);
                    }
                } else if (cardCount[key] == 4) {
                    //有4个的炸弹
                    if (!curCardType || (curCardType && curCardType < gameProto.cardType.WANG_BOMB)) {
                        if (!curCardType || (curCardType && curCardType <= gameProto.cardType.LAIZI_BOMB)) {
                            let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice();
                            let cards = {
                                cardList: cardList.slice(),
                                type: gameProto.cardType.BOMB_CARD
                            };
                            outCardList.push(cards);
                        } else if (curCardType == gameProto.cardType.BOMB_CARD) {
                            let curCardValue = this.getCardLogicValue(curData[0]);
                            if (key > curCardValue) {
                                let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice();
                                let cards = {
                                    cardList: cardList.slice(),
                                    type: gameProto.cardType.BOMB_CARD
                                };
                                outCardList.push(cards);
                            }
                        }
                    }
                } else if (cardCount[key] != 4 && laiList > 0 && cardCount[key] + laiList >= 4) {
                    //有4个的炸弹
                    if (!curCardType || (curCardType && curCardType < gameProto.cardType.BOMB_CARD)) {
                        let curCard = [];
                        if (curData && curCardType >= gameProto.cardType.LAIZI_BOMB) {
                            let curCardResult = this.getCardsAndCount(curData.slice());
                            if (!curCardResult.countList.find(item => item.count == curData.length) && curCardResult.laiList > 0) {
                                for (let index = 0; index < curCardResult.countList.length; index++) {
                                    if (curCardResult.countList.find(item => item.count == (curData.length - curCardResult.laiList))) {
                                        curCard = curCardResult.countList.find(item => item.count == (curData.length - curCardResult.laiList)).card;
                                        break;
                                    }
                                }
                            } else {
                                if (!curCardResult.countList.find(item => item.count == curData.length) && curCardResult.countList.length > 0) {
                                    let lincountList = curCardResult.countList.pop();
                                    curCard = lincountList.card;
                                } else if (curCardResult.countList.length > 0) {
                                    curCard = curCardResult.countList.find(item => item.count == curData.length).card;
                                }

                            }
                        }
                        let curCardValue = this.getCardLogicValue(curCard);
                        if (key > curCardValue && key != this.getCardLogicValue(0x4E) && key != this.getCardLogicValue(0x4F)) {
                            let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice();
                            let laicardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                            for (let index = 0; index < laicardList.length; index++) {
                                cardList = cardList.concat(laicardList.splice(index, 1));
                                index--;
                                if (cardList.length == 4) {
                                    break;
                                }
                            }
                            if (cardList.length != 4) {
                                continue;
                            }
                            let cards = {
                                cardList: cardList.slice(),
                                type: gameProto.cardType.LAIZI_BOMB
                            };
                            outCardList.push(cards);
                        }
                    } else if (curCardType == gameProto.cardType.BOMB_CARD && cardCount[key] == 4) {
                        let curCardValue = this.getCardLogicValue(curData[0]);
                        if (key > curCardValue) {
                            let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice();
                            let laicardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                            for (let index = 0; index < laicardList.length; index++) {
                                cardList = cardList.concat(laicardList.splice(index, 1));
                                index--;
                                if (cardList.length == 4) {
                                    break;
                                }
                            }
                            if (cardList.length != 4) {
                                continue;
                            }
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
            if ((!curCardType || (curData.length == 6 && curCardType && curCardType == gameProto.cardType.FOUR_LINE_TAKE_X))) {
                let curCardValue = 0;
                let curCardResult = curData ? this.getCardsAndCount(curData) : null;
                if (curCardResult) {
                    for (let key in curCardResult.cardCount) {
                        if (curCardResult.cardCount[key] == 4 || curCardResult.cardCount[key] + curCardResult.laiList >= 4) {
                            curCardValue = parseInt(key);
                        }
                    }
                }
                let silaiList = laiList;
                // if (curCardResult) {
                //     silaiList = curCardResult.laiList;
                // }
                let fourLineResult = countList.filter(item => item.count >= (4 - silaiList) && item.card > curCardValue).slice();
                //组合4带2的牌型数据
                for (let i = 0; i < fourLineResult.length; i++) {

                    let fourCardValue = fourLineResult[i].card;
                    let maxCardValue = 17;
                    let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != fourCardValue).slice();
                    if (laiList > 0) {
                        otherList = otherList.filter(item => !this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                    }
                    //组合数据
                    otherList = this.reGroupCard(otherList, 2);
                    // let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice(0, 4);
                    let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice();
                    if (laiList > 0) {
                        let laicardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                        for (let index = 0; index < laicardList.length; index++) {
                            if (cardList.length == 4) {
                                break;
                            }
                            cardList = cardList.concat(laicardList.splice(index, 1));
                            index--;
                        }
                    }
                    if (cardList.length != 4) {
                        continue;
                    }
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
            // if ((!curCardType || (curData.length == 7 && curCardType && curCardType == gameProto.cardType.FOUR_LINE_TAKE_X))) {

            //     let curCardValue = 0;
            //     let curCardResult = curData ? this.getCardsAndCount(curData) : null;
            //     if (curCardResult) {
            //         for (let key in curCardResult.cardCount) {
            //             if (curCardResult.cardCount[key] == 4 || curCardResult.cardCount[key] + curCardResult.laiList >= 4) {
            //                 curCardValue = parseInt(key);
            //             }
            //         }
            //     }
            //     let silaiList = 0;
            //     if (curCardResult) {
            //         silaiList = curCardResult.laiList;
            //     }
            //     let fourLineResult = countList.filter(item => item.count == (4 - silaiList) && item.card > curCardValue).slice();
            //     //组合4带3的牌型数据
            //     for (let i = 0; i < fourLineResult.length; i++) {

            //         let fourCardValue = fourLineResult[i].card;
            //         let maxCardValue = 14;
            //         let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != fourCardValue).slice();
            //         if (laiList > 0) {
            //             otherList = otherList.filter(item => !this.laiZiList.includes(this.getCardLogicValue(item))).slice();
            //         }
            //         //组合数据
            //         otherList = this.reGroupCard(otherList, 3);
            //         //let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice(0, 4);
            //         let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice();
            //         if (laiList > 0) {
            //             let laicardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
            //             for (let index = 0; index < laicardList.length; index++) {
            //                 cardList = cardList.concat(laicardList.splice(index, 1));
            //                 index--;
            //                 if (cardList.length == 4) {
            //                     break;
            //                 }
            //             }
            //         }
            //         for (let k = 0; k < otherList.length; k++) {
            //             if (otherList[k].length == 3) {
            //                 let newCardList = cardList.slice();
            //                 newCardList = newCardList.concat(otherList[k].slice());
            //                 let cards = {
            //                     cardList: newCardList.slice(),
            //                     type: gameProto.cardType.FOUR_LINE_TAKE_X
            //                 };
            //                 outCardList.push(cards);
            //             }
            //         }
            //     }
            // }
            //四带两对
            if ((!curCardType || (curData.length == 8 && curCardType && curCardType == gameProto.cardType.FOUR_LINE_TAKE_DUI))) {
                let curCardValue = 0;
                let curCardResult = curData ? this.getCardsAndCount(curData) : null;
                if (curCardResult) {
                    for (let key in curCardResult.cardCount) {
                        if (curCardResult.cardCount[key] == 4 || curCardResult.cardCount[key] + curCardResult.laiList >= 4) {
                            curCardValue = parseInt(key);
                        }
                    }
                }
                let silaiList = laiList;
                // if (curCardResult) {
                //     silaiList = curCardResult.laiList;
                // }
                let fourLineResult = countList.filter(item => item.count >= (4 - silaiList) && item.card > curCardValue).slice();
                //组合4带2对的牌型数据
                for (let i = 0; i < fourLineResult.length; i++) {
                    let fourCardValue = fourLineResult[i].card;
                    let maxCardValue = 17;
                    let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != fourCardValue).slice();
                    if (laiList > 0) {
                        otherList = otherList.filter(item => !this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                    }
                    //组合数据
                    let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice();
                    let otherResult = this.getCardsAndCount(otherList);
                    let doubleList = [];
                    for (let key in otherResult.cardCount) {
                        if ((otherResult.cardCount[key] >= 2 || (otherResult.cardCount[key] + silaiList) >= 2) && !cardList.some(item => this.getCardLogicValue(item) == key)) {
                            doubleList.push(key);
                        }
                    }
                    //组合数据
                    otherList = this.reGroupCard(doubleList, 2);
                    // let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice(0, 4);
                    if (laiList > 0) {
                        let laicardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                        for (let index = 0; index < laicardList.length; index++) {
                            if (cardList.length == 4) {
                                break;
                            }
                            cardList = cardList.concat(laicardList.splice(index, 1));
                            index--;
                        }
                    }
                    if (cardList.length != 4) {
                        continue;
                    }
                    for (let k = 0; k < otherList.length; k++) {
                        if (otherList[k].length == 2) {
                            let newCardList = cardList.slice();
                            let linList = [];
                            for (let index = 0; index < otherList[k].length; index++) {
                                let linotherList = userCards.filter(item => (this.getCardLogicValue(item) == otherList[k][index])).slice();
                                if (linotherList.length >= 2) {
                                    linList = linList.concat(linotherList.splice(0, 2));
                                } else {
                                    if (laiList > 0) {
                                        let laicardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                                        let linlaicard = linotherList.slice();
                                        for (let index = 0; index < laicardList.length; index++) {
                                            if (linList.includes(laicardList[index]) || linlaicard.includes(laicardList[index]) || newCardList.includes(laicardList[index])) {
                                                continue;
                                            }
                                            if (linlaicard.length >= 2) {
                                                break;
                                            }
                                            linlaicard = linlaicard.concat(laicardList.splice(index, 1));
                                            index--;
                                        }
                                        if (linlaicard.length == 2) {
                                            linList = linList.concat(linlaicard.splice(0, 2));
                                        }
                                    }
                                }
                            }
                            if (linList.length != 4) {
                                continue;
                            }
                            newCardList = newCardList.concat(linList.slice());
                            let cards = {
                                cardList: newCardList.slice(),
                                type: gameProto.cardType.FOUR_LINE_TAKE_DUI
                            };
                            outCardList.push(cards);
                        }
                    }
                }
            }
        }
        //牌的值及数量统计
        let {
            cardCount,
            countList,
            laiList
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
            if (laiList > 0) {
                let lin_laiCards = [];
                for (let index = 0; index < userCards.length; index++) {
                    if (this.laiZiList.includes(this.getCardLogicValue(userCards[index])) && this.getCardLogicValue(userCards[index]) > parseInt(curCardValue)) {
                        lin_laiCards.push(userCards[index]);
                    }
                }
                if (lin_laiCards.length > 0) {
                    let cardList = lin_laiCards.slice(0, 1);
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
            let curCardValue = curData ? this.getMinValue(curData) : 0;
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
                if (key > parseInt(curCardValue) && cardCount[key] >= 1 && laiList > 0 && key != this.getCardLogicValue(0x4E) && key != this.getCardLogicValue(0x4F)) {
                    let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice();
                    if (cardList.length < 2 && laiList > 0) {
                        let laicardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                        for (let index = 0; index < laicardList.length; index++) {
                            cardList = cardList.concat(laicardList.splice(index, 1));
                            index--;
                            if (cardList.length == 2) {
                                break;
                            }
                        }
                        let cards = {
                            cardList: cardList.slice(),
                            type: gameProto.cardType.DOUBLE
                        };
                        outCardList.push(cards);
                    }
                }
            }
            if (laiList >= 2) {
                let lin_laiCards = [];
                for (let index = 0; index < userCards.length; index++) {
                    if (this.laiZiList.includes(this.getCardLogicValue(userCards[index])) && this.getCardLogicValue(userCards[index]) > parseInt(curCardValue)) {
                        lin_laiCards.push(userCards[index]);
                    }
                }
                if (lin_laiCards.length >= 2) {
                    let cardList = lin_laiCards.slice(0, 2);
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
                let curCard = userCards.filter(item => this.getCardLogicValue(item) == cardValue);
                if (curCard.length > 1) {
                    for (let index = 1; index < curCard.length; index++) {
                        curCard.splice(index, 1);
                        index--;
                    }
                }
                let laicardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                let cardList = curCard;
                //判断是否有连续的
                for (let k = i + 1; k < countList.length; k++) {
                    let nextCardValue = parseInt(countList[k].card);
                    //不能带2 根据规则是否带A
                    let maxCardValue = 14;
                    if ((nextCardValue == cardValue + 1) && nextCardValue <= maxCardValue) {
                        //找到一个连续的
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == nextCardValue);
                        if (nextCard.length > 1) {
                            for (let index = 1; index < nextCard.length; index++) {
                                nextCard.splice(index, 1);
                                index--;
                            }
                        }
                        cardList = cardList.concat(nextCard.slice());
                        cardValue += 1;
                        if ((!curCardType && cardList.length >= 5) || (count == cardList.length)) {
                            let cards = {
                                cardList: cardList.slice(),
                                type: gameProto.cardType.SINGLE_LINE
                            };
                            outCardList.push(cards);
                        }
                    } else if (laicardList.length > 0 && nextCardValue <= maxCardValue) {
                        //找到一个连续的
                        cardList = cardList.concat(laicardList.pop());
                        cardValue += 1;
                        k--;
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
        let lincurData = this.getCardsAndCount(curData);
        //对联
        if (!curCardType || (curCardType && curCardType == gameProto.cardType.DOUBLE_LINE) ||
            (curData.length >= 6 && curData.length % 2 == 0 && this.isDuiLian(lincurData.countList, lincurData.laiList))) {
            //判断对连
            let count = curData ? curData.length : 0;
            let curCountList = countList.filter(item => item.count >= 1);
            let curCardValue = this.getMinValue(curData, 2);
            curCountList.sort((a, b) => {
                return a.card - b.card
            });
            for (let i = 0; i < curCountList.length; i++) {
                let cardValue = parseInt(curCountList[i].card);
                if (cardValue <= curCardValue) continue;
                //let cardList = userCards.filter(item => this.getCardLogicValue(item) == cardValue).slice(0, 2);
                let cardList = userCards.filter(item => this.getCardLogicValue(item) == cardValue);
                let laicardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                if (curCountList[i].count <= 1 && laicardList.length > 0) {
                    if (cardList.length == 1 && laicardList.length > 0) {
                        cardList.push(laicardList.pop());
                    } else if (laicardList.length >= 2) {
                        cardList.push(laicardList.pop());
                        cardList.push(laicardList.pop());
                    }
                } else if (cardList.length > 2) {
                    for (let index = 0; index < cardList.length; index++) {
                        if (cardList.length == 2) {
                            break;
                        }
                        cardList.pop();
                    }
                }
                if (cardList.length % 2 != 0) {
                    continue;
                }
                //判断是否有连续的
                for (let k = i + 1; k < curCountList.length; k++) {
                    let nextCardValue = parseInt(curCountList[k].card);
                    //不能带2 根据规则是否带A
                    let maxCardValue = 14;
                    if ((nextCardValue == cardValue + 1) && (nextCardValue <= maxCardValue) && curCountList[k].count >= 2) {
                        //找到一个连续的
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == nextCardValue).slice(0, 2);
                        cardList = cardList.concat(nextCard);
                        cardValue += 1;
                        if ((!curCardType && cardList.length >= 6) || (count == cardList.length)) {
                            let cards = {
                                cardList: cardList.slice(),
                                type: gameProto.cardType.DOUBLE_LINE
                            };
                            outCardList.push(cards);
                        }
                    } else if ((nextCardValue == cardValue + 1) && (nextCardValue <= maxCardValue) && (laicardList.length + curCountList[k].count) >= 2) {
                        //找到一个连续的
                        let linnextCard = [];
                        for (let index = 0; index < 2; index++) {
                            let nextCard = userCards.filter(item => this.getCardLogicValue(item) == nextCardValue).slice(0, 1);
                            if (nextCard.length > 0 && !linnextCard.includes(nextCard[nextCard.length - 1])) {
                                linnextCard = linnextCard.concat(nextCard);
                            }
                        }
                        if (linnextCard.length == 2) {
                            cardList = cardList.concat(linnextCard);
                        } else if (linnextCard.length == 1 && laicardList.length > 0) {
                            cardList = cardList.concat(linnextCard);
                            cardList.push(laicardList.pop());
                        } else if (laicardList.length >= 2) {
                            cardList.push(laicardList.pop());
                            cardList.push(laicardList.pop());
                        }
                        cardValue += 1;
                        if ((!curCardType && cardList.length >= 6) || (count == cardList.length)) {
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
        if ((!curCardType || (curCardType && curCardType == gameProto.cardType.THREE_LINE) ||
            (curData.length % 3 == 0 && this.isSanBuDai(lincurData.countList, lincurData.laiList)))) {
            let curCardValue = this.getMinValue(curData, 3);
            if (curData && curData.length > 0) {
                let curCardResult = this.getCardsAndCount(curData.slice());
                if (!curCardResult.countList.find(item => item.count == 3) && curCardResult.laiList > 0) {
                    for (let index = 0; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index].count + curCardResult.laiList >= 3) {
                            curCardValue = curCardResult.countList[index].card
                        }
                    }
                } else if (curCardResult.countList.find(item => item.count == 3)) {
                    curCardValue = curCardResult.countList.find(item => item.count == 3).card;
                }
            }
            let threeLineList = this.getThreeLineType(userCards.slice(), curCardValue);
            let count = curData ? curData.length : 0;
            threeLineList = threeLineList.filter(item => (count == 0 || count && item.cardList.length == count));
            let linLianSan = [];
            for (let i = 0; i < threeLineList.length; i++) {
                let cards = {
                    cardList: threeLineList[i].cardList.slice(),
                    type: gameProto.cardType.THREE_LINE
                };
                outCardList.push(cards);
                //校验是否连续
                if (count == 0 || count > 3) {
                    if (linLianSan[linLianSan.length - 1] && linLianSan[linLianSan.length - 1].minValue + 1 == threeLineList[i].minValue) {
                        linLianSan.push(threeLineList[i]);
                        let cardList = [];
                        for (let index = 0; index < linLianSan.length; index++) {
                            cardList = cardList.concat(linLianSan[index].cardList.slice());
                        }
                        let laicardList = cardList.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
                        if (laicardList.length > 0 && laicardList.length > laiList) {
                            linLianSan.pop();
                            continue;
                        }

                        cards = {
                            cardList: cardList.slice(),
                            type: gameProto.cardType.THREE_LINE
                        };
                        outCardList.push(cards);
                    } else {
                        linLianSan = [];
                        linLianSan.push(threeLineList[i]);
                    }
                }

            }
        }

        //三带一
        if (!curCardType || (curCardType && curCardType == gameProto.cardType.THREE_LINE_TAKE_ONE)) {
            let curCardValue = this.getMinValue(curData, 3);
            if (curData && curData.length > 0) {
                let curCardResult = this.getCardsAndCount(curData.slice());
                if (!curCardResult.countList.find(item => item.count == 3) && curCardResult.laiList > 0) {
                    for (let index = 0; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index].count + curCardResult.laiList >= 3) {
                            curCardValue = curCardResult.countList[index].card
                        }
                    }
                } else if (curCardResult.countList.find(item => item.count == 3)) {
                    curCardValue = curCardResult.countList.find(item => item.count == 3).card;
                }
            }
            let threeLineList = this.getThreeLineType(userCards.slice(), curCardValue);
            let count = curData ? (curData.length / 4) : 0;
            //判断几连
            threeLineList = threeLineList.filter(item => (count == 0 || item.cardList.length == count * 3));
            let linLianSan = [];
            for (let i = 0; i < threeLineList.length; i++) {
                let cardList = threeLineList[i].cardList.slice();
                //只有一个三代一时 组合单牌
                let maxCardValue = 17;
                let lincard = this.getCardLogicValue(cardList[0]);
                let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != lincard);
                //组合数据
                let maxLength = parseInt(cardList.length / 3);
                otherList = this.reGroupCard(otherList.slice(), maxLength);
                for (let j = 0; j < otherList.length; j++) {
                    if (otherList[j].length == maxLength && !cardList.includes(otherList[j][0])) {
                        let newCardList = cardList.slice();
                        newCardList = newCardList.concat(otherList[j]);
                        let cards = {
                            cardList: newCardList.slice(),
                            type: gameProto.cardType.THREE_LINE_TAKE_ONE
                        };
                        outCardList.push(cards);
                        linLianSan.push(JSON.parse(JSON.stringify(threeLineList[i])));
                        linLianSan[linLianSan.length - 1].cardList = newCardList.slice();
                    }
                }
            }
            //记录三对的值
            for (let i = 0; i < linLianSan.length; i++) {
                let cardList = linLianSan[i].cardList.slice();
                let minValue = linLianSan[i].minValue;
                //校验是否连续
                let threeList = linLianSan.filter(item => item.minValue == minValue + 1);
                if (threeList.length == 0) {
                    continue;
                }
                for (let key = 0; key < threeList.length; key++) {
                    let isCun = true;
                    //校验是否重复使用某张牌
                    for (let key_to = 0; key_to < cardList.length; key_to++) {
                        let linthreMinValue = threeList[key].cardList.filter(item => this.getCardLogicValue(item) == this.getCardLogicValue(cardList[key_to]))
                        if (threeList[key].cardList.includes(cardList[key_to]) && linthreMinValue.length < 3) {
                            isCun = false;
                            break;
                        }
                        let lincardListMinValue = cardList.filter(item => this.getCardLogicValue(item) == this.getCardLogicValue(cardList[key_to]))
                        if (threeList[key].cardList.includes(cardList[key_to]) && linthreMinValue.length >= 1 && lincardListMinValue.length >= 1) {
                            isCun = false;
                            break;
                        }
                    }
                    if (isCun) {
                        let lincardList = cardList.concat(threeList[key].cardList);
                        if (count == 0 || (lincardList.length / 4) == count) {
                            let cards = {
                                cardList: lincardList.slice(),
                                type: gameProto.cardType.THREE_LINE_TAKE_ONE
                            };
                            outCardList.push(cards);
                            linLianSan.push(JSON.parse(JSON.stringify(threeList[key])));
                            linLianSan[linLianSan.length - 1].cardList = lincardList.slice();
                        }
                    }
                }
            }
        }
        //三带对
        if (!curCardType || (curCardType && curCardType == gameProto.cardType.THREE_LINE_TAKE_DUI)) {
            let curCardValue = this.getMinValue(curData, 3);
            if (curData && curData.length > 0) {
                let curCardResult = this.getCardsAndCount(curData.slice());
                if (!curCardResult.countList.find(item => item.count == 3) && curCardResult.laiList > 0) {
                    for (let index = 0; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index].count + curCardResult.laiList >= 3) {
                            curCardValue = curCardResult.countList[index].card
                        }
                    }
                } else if (curCardResult.countList.find(item => item.count == 3)) {
                    curCardValue = curCardResult.countList.find(item => item.count == 3).card;
                }
            }
            let threeLineList = this.getThreeLineType(userCards.slice(), curCardValue);
            let count = curData ? (curData.length / 5) : 0;
            //判断几连
            threeLineList = threeLineList.filter(item => (count == 0 || count && item.cardList.length == count * 3));
            let linLianSan = [];
            for (let i = 0; i < threeLineList.length; i++) {
                let cardList = threeLineList[i].cardList.slice();
                let minValue = threeLineList[i].minValue;
                if (minValue <= curCardValue) continue;
                let maxCardValue = 17;
                //飞机的情况 不包含2和飞机的其他牌组合
                let lincard = this.getCardLogicValue(cardList[0]);
                let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != lincard);
                let otherResult = this.getCardsAndCount(otherList);
                let doubleList = [];
                for (let key in otherResult.cardCount) {
                    if (otherResult.cardCount[key] >= 2 && !cardList.some(item => this.getCardLogicValue(item) == key)) {
                        doubleList.push(key);
                    }
                }
                //组合数据
                let maxLength = parseInt(cardList.length / 3);
                otherList = this.reGroupCard(doubleList, maxLength);
                for (let j = 0; j < otherList.length; j++) {
                    let newCardList = cardList.slice();
                    if (otherList[j].length == maxLength) {
                        for (let k = 0; k < otherList[j].length; k++) {
                            let curList = userCards.filter(item => this.getCardLogicValue(item) == parseInt(otherList[j][k])).slice(0, 2);
                            newCardList = newCardList.concat(curList);
                        }
                    }
                    let cards = {
                        cardList: newCardList.slice(),
                        type: gameProto.cardType.THREE_LINE_TAKE_DUI
                    };
                    outCardList.push(cards);
                    linLianSan.push(JSON.parse(JSON.stringify(threeLineList[i])));
                    linLianSan[linLianSan.length - 1].cardList = newCardList.slice();
                }
            }
            //记录三对的值
            for (let i = 0; i < linLianSan.length; i++) {
                let cardList = linLianSan[i].cardList.slice();
                let minValue = linLianSan[i].minValue;
                //校验是否连续
                let threeList = linLianSan.filter(item => item.minValue == minValue + 1);
                if (threeList.length == 0) {
                    continue;
                }
                for (let key = 0; key < threeList.length; key++) {
                    let isCun = true;
                    //校验是否重复使用某张牌
                    for (let key_to = 0; key_to < cardList.length; key_to++) {
                        let linthreMinValue = threeList[key].cardList.filter(item => this.getCardLogicValue(item) == this.getCardLogicValue(cardList[key_to]))
                        if (threeList[key].cardList.includes(cardList[key_to]) && linthreMinValue.length < 3) {
                            isCun = false;
                            break;
                        }
                        let lincardListMinValue = cardList.filter(item => this.getCardLogicValue(item) == this.getCardLogicValue(cardList[key_to]))
                        if (threeList[key].cardList.includes(cardList[key_to]) && linthreMinValue.length >= 1 && lincardListMinValue.length >= 1) {
                            isCun = false;
                            break;
                        }
                    }
                    if (isCun) {
                        cardList = cardList.concat(threeList[key].cardList);
                        if (count == 0 || (cardList.length / 5) == count) {
                            let cards = {
                                cardList: cardList.slice(),
                                type: gameProto.cardType.THREE_LINE_TAKE_DUI
                            };
                            outCardList.push(cards);
                            linLianSan.push(JSON.parse(JSON.stringify(threeList[key])));
                            linLianSan[linLianSan.length - 1].cardList = cardList.slice();
                        }
                    }
                }
            }
        }
        //三带二
        // if (!curCardType || (curCardType && curCardType == gameProto.cardType.THREE_LINE_TAKE_TWO)) {

        //     let curCardValue = this.getMinValue(curData, 3);
        //     let threeLineList = this.getThreeLineType(userCards.slice(), curCardValue);
        //     let count = curData ? (curData.length / 5) : 0;
        //     //判断几连
        //     threeLineList = threeLineList.filter(item => (count == 0 || count && item.cardList.length == count * 3));
        //     let linLianSan = [];
        //     for (let i = 0; i < threeLineList.length; i++) {
        //         let cardList = threeLineList[i].cardList.slice();
        //         let minValue = threeLineList[i].minValue;
        //         if (minValue <= curCardValue) continue;
        //         let maxCardValue = 17;
        //         //飞机的情况 不包含2和飞机的其他牌组合
        //         let lincard = this.getCardLogicValue(cardList[0]);
        //         let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != lincard);
        //         let otherResult = this.getCardsAndCount(otherList);
        //         let doubleList = [];
        //         let listdoubleList = [];
        //         for (let key in otherResult.cardCount) {
        //             if (otherResult.cardCount[key] >= 1 && !cardList.some(item => this.getCardLogicValue(item) == key)) {
        //                 doubleList.push(key);
        //             }
        //             if (otherResult.cardCount[key] == 1 && !cardList.some(item => this.getCardLogicValue(item) == key)) {
        //                 listdoubleList.push(key);
        //             }
        //         }
        //         //组合数据
        //         let maxLength = parseInt(cardList.length / 3);
        //         if (listdoubleList >= 2) {
        //             otherList = this.listreGroupCard(listdoubleList, 2);
        //         } else {
        //             otherList = this.reGroupCard(doubleList, 2);
        //         }
        //         for (let j = 0; j < otherList.length; j++) {
        //             let newCardList = cardList.slice();
        //             if (otherList[j].length == maxLength * 2) {
        //                 for (let k = 0; k < otherList[j].length; k++) {
        //                     let curList = userCards.filter(item => this.getCardLogicValue(item) == parseInt(otherList[j][k])).slice(0, 1);
        //                     newCardList = newCardList.concat(curList);
        //                 }
        //             }
        //             let cards = {
        //                 cardList: newCardList.slice(),
        //                 type: gameProto.cardType.THREE_LINE_TAKE_TWO
        //             };
        //             outCardList.push(cards);
        //             linLianSan.push(JSON.parse(JSON.stringify(threeLineList[i])));
        //             linLianSan[linLianSan.length - 1].cardList = newCardList.slice();
        //         }
        //     }
        //     for (let i = 0; i < linLianSan.length; i++) {
        //         let cardList = linLianSan[i].cardList.slice();
        //         let minValue = linLianSan[i].minValue;
        //         //校验是否连续
        //         let threeList = linLianSan.filter(item => item.minValue == minValue + 1);
        //         if (threeList.length == 0) {
        //             continue;
        //         }
        //         for (let key = 0; key < threeList.length; key++) {
        //             let isCun = true;
        //             //校验是否重复使用某张牌
        //             for (let key_to = 0; key_to < cardList.length; key_to++) {
        //                 if (threeList[key].cardList.includes(cardList[key_to])) {
        //                     isCun = false;
        //                     break;
        //                 }
        //             }
        //             if (isCun) {
        //                 cardList = cardList.concat(threeList[key].cardList);
        //                 if (count == 0 || (cardList.length / 5) == count) {
        //                     let cards = {
        //                         cardList: cardList.slice(),
        //                         type: gameProto.cardType.THREE_LINE_TAKE_TWO
        //                     };
        //                     outCardList.push(cards);
        //                     linLianSan.push(JSON.parse(JSON.stringify(threeList[key])));
        //                     linLianSan[linLianSan.length - 1].cardList = cardList.slice();
        //                 }
        //             }
        //         }
        //     }
        // }

        //四带二
        // if (this.gameRule.siDaiEr && (!curCardType || (curCardType && curCardType == gameProto.cardType.FOUR_LINE_TAKE_X))) {
        //     let curCardValue = 0;
        //     let curCardResult = curData ? this.getCardsAndCount(curData) : null;
        //     if (curCardResult) {
        //         for (let key in curCardResult.cardCount) {
        //             if (curCardResult.cardCount[key] == 4 || (curCardResult.laiList + curCardResult.cardCount[key]) >= 4) {
        //                 curCardValue = parseInt(key);
        //             }
        //         }
        //     }
        //     //组合4带2的牌型数据
        //     for (let i = 0; i < fourLineResult.length; i++) {
        //         let fourCardValue = fourLineResult[i].card;
        //         //飞机的情况 不包含2和飞机的其他牌组合
        //         let maxCardValue = 17;
        //         let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != fourCardValue);
        //         //组合数据
        //         otherList = this.reGroupCard(otherList, 2);
        //         let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice(0, 4);
        //         for (let k = 0; k < otherList.length; k++) {
        //             if (otherList[k].length == 2) {
        //                 let newCardList = cardList.slice();
        //                 newCardList = newCardList.concat(otherList[k].slice());
        //                 let cards = {
        //                     cardList: newCardList.slice(),
        //                     type: gameProto.cardType.FOUR_LINE_TAKE_X
        //                 };
        //                 outCardList.push(cards);
        //             }
        //         }
        //     }
        // }

        // //四带两对
        // if (this.gameRule.siDaiEr && (!curCardType || (curCardType && curCardType == gameProto.cardType.FOUR_LINE_TAKE_DUI))) {
        //     let curCardValue = 0;
        //     let curCardResult = curData ? this.getCardsAndCount(curData) : null;
        //     if (curCardResult) {
        //         for (let key in curCardResult.cardCount) {
        //             if (curCardResult.cardCount[key] == 4 || curCardResult.cardCount[key] + curCardResult.laiList >= 4) {
        //                 curCardValue = parseInt(key);
        //             }
        //         }
        //     }
        //     let silaiList = 0;
        //     if (curCardResult) {
        //         silaiList = curCardResult.laiList;
        //     }
        //     let fourLineResult = countList.filter(item => item.count >= (4 - silaiList) && item.card > curCardValue).slice();
        //     //组合4带2对的牌型数据
        //     for (let i = 0; i < fourLineResult.length; i++) {
        //         let fourCardValue = fourLineResult[i].card;
        //         let maxCardValue = 17;
        //         let otherList = userCards.filter(item => (this.getCardLogicValue(item) <= maxCardValue) && this.getCardLogicValue(item) != fourCardValue).slice();
        //         if (laiList > 0) {
        //             otherList = otherList.filter(item => !this.laiZiList.includes(this.getCardLogicValue(item))).slice();
        //         }
        //         //组合数据
        //         let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice();
        //         let otherResult = this.getCardsAndCount(otherList);
        //         let doubleList = [];
        //         for (let key in otherResult.cardCount) {
        //             if (otherResult.cardCount[key] >= 2 && !cardList.some(item => this.getCardLogicValue(item) == key)) {
        //                 doubleList.push(key);
        //             }
        //         }
        //         //组合数据
        //         otherList = this.reGroupCard(doubleList, 2);
        //         // let cardList = userCards.filter(item => this.getCardLogicValue(item) == fourCardValue).slice(0, 4);
        //         if (laiList > 0) {
        //             let laicardList = userCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item))).slice();
        //             for (let index = 0; index < laicardList.length; index++) {
        //                 cardList = cardList.concat(laicardList.splice(index, 1));
        //                 index--;
        //                 if (cardList.length == 4) {
        //                     break;
        //                 }
        //             }
        //         }
        //         if (cardList.length != 4) {
        //             continue;
        //         }
        //         for (let k = 0; k < otherList.length; k++) {
        //             if (otherList[k].length == 2) {
        //                 let newCardList = cardList.slice();
        //                 let linList = [];
        //                 for (let index = 0; index < otherList[k].length; index++) {
        //                     let linotherList = userCards.filter(item => (this.getCardLogicValue(item) == otherList[k][index])).slice();
        //                     linList = linList.concat(linotherList.splice(0, 2));
        //                 }
        //                 newCardList = newCardList.concat(linList.slice());
        //                 let cards = {
        //                     cardList: newCardList.slice(),
        //                     type: gameProto.cardType.FOUR_LINE_TAKE_DUI
        //                 };
        //                 outCardList.push(cards);
        //             }
        //         }
        //     }
        // }
        return outCardList;
    }

    //比较卡牌是否可以出
    compareCard = function (curData, lastData) {

        let result = {
            isSuccess: true,
            errMsg: null
        };

        let curType = this.getCardType(curData);
        let lastType = this.getCardType(lastData);
        let {
            cardCount,
            countList,
            laiList
        } = this.getCardsAndCount(curData);
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
        if (curType == lastType && curData.length != lastData.length) {
            //牌型不对
            result.isSuccess = false;
            result.errMsg = '只能出相同牌数';
            return result;
        }
        //单排
        if (lastType == gameProto.cardType.SINGLE) {
            //炸弹
            if (curType == gameProto.cardType.LAIZI_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
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
            if (curType == gameProto.cardType.LAIZI_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else if (curType == gameProto.cardType.DOUBLE) {
                //单张比较
                // let curCard = this.getCardLogicValue(curData[0]);
                // let lastCard = this.getCardLogicValue(lastData[0]);
                let curCardResult = this.getCardsAndCount(curData.slice());
                let lastCardResult = this.getCardsAndCount(lastData.slice());
                let curCard = [];
                let lastCard = [];
                if (!curCardResult.countList.find(item => item.count == 2) && curCardResult.laiList > 0) {
                    for (let index = 0; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index].count + curCardResult.laiList >= 2) {
                            curCard = curCardResult.countList[index].card
                        }
                    }
                } else if (curCardResult.countList.find(item => item.count == 2)) {
                    curCard = curCardResult.countList.find(item => item.count == 2).card;
                }
                if (!lastCardResult.countList.find(item => item.count == 2) && lastCardResult.laiList > 0) {
                    for (let index = 0; index < lastCardResult.countList.length; index++) {
                        if (lastCardResult.countList[index].count + lastCardResult.laiList >= 2) {
                            lastCard = lastCardResult.countList[index].card
                        }
                    }
                } else {
                    lastCard = lastCardResult.countList.find(item => item.count == 2).card;
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
                result.errMsg = '只能出对子';
                return result;
            }
        }
        //三不带
        else if (lastType == gameProto.cardType.THREE_LINE) {
            //炸弹
            if (curType == gameProto.cardType.LAIZI_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else if (curType == gameProto.cardType.THREE_LINE || (curData.length % 3 == 0 && this.isSanBuDai(countList, laiList))) {
                //单张比较
                // let curCard = this.getCardLogicValue(curData[0]);
                // let lastCard = this.getCardLogicValue(lastData[0]);
                let curCardResult = this.getCardsAndCount(curData.slice());
                let lastCardResult = this.getCardsAndCount(lastData.slice());
                let curCard = [];
                let lastCard = [];
                if (!curCardResult.countList.find(item => item.count == 3) && curCardResult.laiList > 0) {
                    for (let index = 0; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index].count + curCardResult.laiList >= 3) {
                            curCard = curCardResult.countList[index].card
                        }
                    }
                } else if (curCardResult.countList.find(item => item.count == 3)) {
                    curCard = curCardResult.countList.find(item => item.count == 3).card;
                }
                if (!lastCardResult.countList.find(item => item.count == 3) && lastCardResult.laiList > 0) {
                    //lastCard = lastCardResult.countList.find(item => item.count == (3 - lastCardResult.laiList)).card; 
                    for (let index = 0; index < lastCardResult.countList.length; index++) {
                        if (lastCardResult.countList[index].count + lastCardResult.laiList >= 3) {
                            lastCard = lastCardResult.countList[index].card
                        }
                    }
                } else {
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
                result.errMsg = '只能出三不带';
                return result;
            }
        }
        //三带一
        else if (lastType == gameProto.cardType.THREE_LINE_TAKE_ONE) {
            //炸弹
            if (curType == gameProto.cardType.LAIZI_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else if (curType == gameProto.cardType.THREE_LINE_TAKE_ONE) {
                //三带一比较3张
                let curCardResult = this.getCardsAndCount(curData.slice());
                let lastCardResult = this.getCardsAndCount(lastData.slice());
                let curCard = [];
                let lastCard = [];
                if (!curCardResult.countList.find(item => item.count == 3) && curCardResult.laiList > 0) {
                    for (let index = 0; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index].count + curCardResult.laiList >= 3) {
                            curCard = curCardResult.countList[index].card
                        }
                    }
                } else if (curCardResult.countList.find(item => item.count == 3)) {
                    curCard = curCardResult.countList.find(item => item.count == 3).card;
                }
                if (!lastCardResult.countList.find(item => item.count == 3) && lastCardResult.laiList > 0) {
                    for (let index = 0; index < lastCardResult.countList.length; index++) {
                        if (lastCardResult.countList[index].count + lastCardResult.laiList >= 3) {
                            lastCard = lastCardResult.countList[index].card
                        }
                    }
                } else {
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
                result.errMsg = '只能出三带一';
                return result;
            }
        }
        //三带二
        // else if (lastType == gameProto.cardType.THREE_LINE_TAKE_TWO) {
        //     //炸弹
        //     if (curType == gameProto.cardType.LAIZI_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
        //         return result;
        //     } else if (curType == gameProto.cardType.THREE_LINE_TAKE_TWO) {
        //         //三带二比较3张
        //         let curCardResult = this.getCardsAndCount(curData.slice());
        //         let lastCardResult = this.getCardsAndCount(lastData.slice());
        //         let curCard = [];
        //         let lastCard = [];
        //         if (!curCardResult.countList.find(item => item.count == 3) && curCardResult.laiList > 0) {
        //             for (let index = 0; index < curCardResult.countList.length; index++) {
        //                 if (curCardResult.countList[index].count + curCardResult.laiList >= 3) {
        //                     curCard = curCardResult.countList[index].card
        //                 }
        //             }
        //         } else if (curCardResult.countList.find(item => item.count == 3)) {
        //             curCard = curCardResult.countList.find(item => item.count == 3).card;
        //         }
        //         if (!lastCardResult.countList.find(item => item.count == 3) && lastCardResult.laiList > 0) {
        //             for (let index = 0; index < lastCardResult.countList.length; index++) {
        //                 if (lastCardResult.countList[index].count + lastCardResult.laiList >= 3) {
        //                     lastCard = lastCardResult.countList[index].card
        //                 }
        //             }
        //         } else {
        //             lastCard = lastCardResult.countList.find(item => item.count == 3).card;
        //         }
        //         if (parseInt(lastCard) < parseInt(curCard)) {
        //             return result;
        //         } else {
        //             //大小正确
        //             result.isSuccess = false;
        //             result.errMsg = '出牌必须大于上家';
        //             return result;
        //         }

        //     } else {
        //         //牌型不对
        //         result.isSuccess = false;
        //         result.errMsg = '只能出三带二';
        //         return result;
        //     }
        // } 
        else if (lastType == gameProto.cardType.THREE_LINE_TAKE_DUI) {
            //三带对
            if (curType == gameProto.cardType.LAIZI_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else if (curType == gameProto.cardType.THREE_LINE_TAKE_DUI) {
                //三带对比较3张
                let curCardResult = this.getCardsAndCount(curData.slice());
                let lastCardResult = this.getCardsAndCount(lastData.slice());
                let curCard = [];
                let lastCard = [];
                if (!curCardResult.countList.find(item => item.count == 3) && curCardResult.laiList > 0) {
                    for (let index = 0; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index].count + curCardResult.laiList >= 3) {
                            curCard = curCardResult.countList[index].card
                        }
                    }
                } else if (curCardResult.countList.find(item => item.count == 3)) {
                    curCard = curCardResult.countList.find(item => item.count == 3).card;
                }
                if (!lastCardResult.countList.find(item => item.count == 3) && lastCardResult.laiList > 0) {
                    for (let index = 0; index < lastCardResult.countList.length; index++) {
                        if (lastCardResult.countList[index].count + lastCardResult.laiList >= 3) {
                            lastCard = lastCardResult.countList[index].card
                        }
                    }
                } else {
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
                result.errMsg = '只能出三带对';
                return result;
            }
        }
        //四带二
        else if (lastType == gameProto.cardType.FOUR_LINE_TAKE_X) {
            //炸弹
            if (curType == gameProto.cardType.LAIZI_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else if (curType == gameProto.cardType.FOUR_LINE_TAKE_X) {
                //四带二比较四张
                let curCardResult = this.getCardsAndCount(curData.slice());
                let lastCardResult = this.getCardsAndCount(lastData.slice());
                let curCard = [];
                let lastCard = [];
                if (!curCardResult.countList.find(item => item.count == 4) && curCardResult.laiList > 0) {
                    for (let index = 0; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index].count + curCardResult.laiList >= 4) {
                            curCard = curCardResult.countList[index].card
                        }
                    }
                } else if (curCardResult.countList.find(item => item.count == 4)) {
                    curCard = curCardResult.countList.find(item => item.count == 4).card;
                }
                if (!lastCardResult.countList.find(item => item.count == 4) && lastCardResult.laiList > 0) {
                    for (let index = 0; index < lastCardResult.countList.length; index++) {
                        if (lastCardResult.countList[index].count + lastCardResult.laiList >= 4) {
                            lastCard = lastCardResult.countList[index].card
                        }
                    }
                } else {
                    lastCard = lastCardResult.countList.find(item => item.count == 4).card;
                }
                // let curCard = curCardResult.countList.find(item => item.count == 4).card;
                // let lastCard = lastCardResult.countList.find(item => item.count == 4).card;
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
        //四带两对
        else if (lastType == gameProto.cardType.FOUR_LINE_TAKE_DUI) {
            //炸弹
            if (curType == gameProto.cardType.LAIZI_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else if (curType == gameProto.cardType.FOUR_LINE_TAKE_DUI) {
                //四带二比较四张
                let curCardResult = this.getCardsAndCount(curData.slice());
                let lastCardResult = this.getCardsAndCount(lastData.slice());
                let curCard = [];
                let lastCard = [];
                if (!curCardResult.countList.find(item => item.count == 4) && curCardResult.laiList > 0) {
                    for (let index = 0; index < curCardResult.countList.length; index++) {
                        if (curCardResult.countList[index].count + curCardResult.laiList >= 4) {
                            curCard = curCardResult.countList[index].card
                        }
                    }
                } else if (curCardResult.countList.find(item => item.count == 4)) {
                    curCard = curCardResult.countList.find(item => item.count == 4).card;
                }
                if (!lastCardResult.countList.find(item => item.count == 4) && lastCardResult.laiList > 0) {
                    for (let index = 0; index < lastCardResult.countList.length; index++) {
                        if (lastCardResult.countList[index].count + lastCardResult.laiList >= 4) {
                            lastCard = lastCardResult.countList[index].card
                        }
                    }
                } else {
                    lastCard = lastCardResult.countList.find(item => item.count == 4).card;
                }
                // let curCard = curCardResult.countList.find(item => item.count == 4).card;
                // let lastCard = lastCardResult.countList.find(item => item.count == 4).card;
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
                result.errMsg = '只能出四带两对';
                return result;
            }
        }
        //单连
        else if (lastType == gameProto.cardType.SINGLE_LINE) {
            //炸弹
            if (curType == gameProto.cardType.LAIZI_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else if (curType == gameProto.cardType.SINGLE_LINE && curData.length == lastData.length) {
                //单连比较单张
                let curCard = 0;
                let lastCard = 0;
                let lincurCard = [];
                let linlastCard = [];
                //当前牌的最大值
                for (let i = 0; i < curData.length; i++) {
                    if (this.getCardLogicValue(curData[i]) > curCard && !this.laiZiList.includes(this.getCardLogicValue(curData[i]))) {
                        curCard = this.getCardLogicValue(curData[i])
                    }
                    if (!this.laiZiList.includes(this.getCardLogicValue(curData[i]))) {
                        lincurCard.push(curData[i]);
                    }
                }
                if (lincurCard.length != curData.length) {
                    let linlaizi = curData.length - lincurCard.length;
                    if (linlaizi > 0 && lincurCard.length > 0) {
                        lincurCard.sort((a, b) => {
                            return (this.getCardLogicValue(b) - this.getCardLogicValue(a))
                        });
                        for (let index = 0; index < linlaizi; index++) {
                            lincurCard.push(lincurCard[0] + 1);
                            lincurCard.sort((a, b) => {
                                return (this.getCardLogicValue(b) - this.getCardLogicValue(a))
                            });
                        }
                        let lincurType = this.getCardType(lincurCard)
                        if (lincurType != gameProto.cardType.ERROR) {
                            curCard = this.getCardLogicValue(lincurCard[0]);
                        }
                    }
                    // let lincurType = this.getCardType(lincurCard)
                    // if (lincurType != gameProto.cardType.ERROR) {
                    //     curCard = (curCard + 1) >= 15 ? curCard : (curCard + 1);
                    // }
                }
                //上次出牌的最大值
                for (let i = 0; i < lastData.length; i++) {
                    if (this.getCardLogicValue(lastData[i]) > lastCard && !this.laiZiList.includes(this.getCardLogicValue(lastData[i]))) {
                        lastCard = this.getCardLogicValue(lastData[i])
                    }
                    if (!this.laiZiList.includes(this.getCardLogicValue(lastData[i]))) {
                        linlastCard.push(lastData[i]);
                    }
                }
                if (linlastCard.length != lastData.length) {
                    let linlaizi = lastData.length - linlastCard.length;
                    if (linlaizi > 0 && linlastCard.length > 0) {
                        linlastCard.sort((a, b) => {
                            return (this.getCardLogicValue(b) - this.getCardLogicValue(a))
                        });
                        for (let index = 0; index < linlaizi; index++) {
                            linlastCard.push(linlastCard[0] + 1);
                            linlastCard.sort((a, b) => {
                                return (this.getCardLogicValue(b) - this.getCardLogicValue(a))
                            });
                        }
                        let lincurType = this.getCardType(linlastCard)
                        if (lincurType != gameProto.cardType.ERROR) {
                            curCard = this.getCardLogicValue(linlastCard[0]);
                        }
                    }
                    // let lincurType = this.getCardType(linlastCard)
                    // if (lincurType != gameProto.cardType.ERROR) {
                    //     lastCard = (lastCard + 1) >= 15 ? lastCard : (lastCard + 1);
                    // }
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
            if (curType == gameProto.cardType.LAIZI_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else if ((curType == gameProto.cardType.DOUBLE_LINE && curData.length == lastData.length) ||
                (curData.length >= 6 && curData.length % 2 == 0 && this.isDuiLian(countList, laiList) && curData.length == lastData.length)) {
                //对连比较大小
                let curCard = 0;
                let lastCard = 0;

                //当前牌的最大值
                for (let i = 0; i < curData.length; i++) {
                    if (this.getCardLogicValue(curData[i]) > curCard && !this.laiZiList.includes(this.getCardLogicValue(curData[i]))) {
                        curCard = this.getCardLogicValue(curData[i])
                    }
                }
                //上次出牌的最大值
                for (let i = 0; i < lastData.length; i++) {
                    if (this.getCardLogicValue(lastData[i]) > lastCard && !this.laiZiList.includes(this.getCardLogicValue(lastData[i]))) {
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
        } else if (lastType == gameProto.cardType.LAIZI_BOMB) {
            //炸弹
            if (curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else if (curType == gameProto.cardType.LAIZI_BOMB) {
                //单张比较
                let curCard = 0;
                let lastCard = 0;
                for (let i = 0; i < curData.length; i++) {
                    if (!this.laiZiList.includes(this.getCardLogicValue(curData[i]))) {
                        curCard = this.getCardLogicValue(curData[i]);
                    }
                }
                for (let i = 0; i < lastData.length; i++) {
                    if (!this.laiZiList.includes(this.getCardLogicValue(lastData[i]))) {
                        lastCard = this.getCardLogicValue(lastData[i]);
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
                result.errMsg = '只能出炸弹';
                return result;
            }
        } else if (lastType == gameProto.cardType.BOMB_CARD) {
            //炸弹
            if (curType == gameProto.cardType.WANG_BOMB || curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else if (curType == gameProto.cardType.BOMB_CARD) {
                //单张比较
                let curCard = 0;
                let lastCard = 0;
                for (let i = 0; i < curData.length; i++) {
                    if (!this.laiZiList.includes(this.getCardLogicValue(curData[i]))) {
                        curCard = this.getCardLogicValue(curData[i]);
                    }
                }
                for (let i = 0; i < lastData.length; i++) {
                    if (!this.laiZiList.includes(this.getCardLogicValue(lastData[i]))) {
                        lastCard = this.getCardLogicValue(lastData[i]);
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
                result.errMsg = '只能出炸弹';
                return result;
            }
        } else if (lastType == gameProto.cardType.WANG_BOMB) {
            if (curType == gameProto.cardType.CHUN_LAIZI_BOMB) {
                return result;
            } else {
                //天炸第二大
                result.isSuccess = false;
                result.errMsg = '出牌必须大于上家';
                return result;
            }
        } else if (lastType == gameProto.cardType.CHUN_LAIZI_BOMB) {
            //癞子炸最大
            result.isSuccess = false;
            result.errMsg = '出牌必须大于上家';
            return result;
        }

    }

    //获取卡牌的类型
    getCardType = function (cardDataArr) {

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
            //是否天炸
            if (cardDataArr.length == 2 && this.isTianZha(cardDataArr)) {
                return gameProto.cardType.WANG_BOMB;
            }
            let lincard = 0;
            let linlai = 0;
            for (let index = 0; index < cardDataArr.length; index++) {
                if (this.getCardLogicValue(cardDataArr[index]) >= this.getCardLogicValue(lincard)) {
                    lincard = cardDataArr[index];
                }
                if (this.laiZiList.includes(this.getCardLogicValue(cardDataArr[index]))) {
                    linlai++;
                }
            }
            if (this.getCardLogicValue(cardDataArr[0]) === this.getCardLogicValue(cardDataArr[1]) ||
                (this.gameRule.isLai && linlai > 0 && ![0x4E, 0x4F].includes(lincard))) {
                return gameProto.cardType.DOUBLE;
            }
            return gameProto.cardType.ERROR;
        } else {

            let {
                cardCount,
                countList,
                laiList
            } = this.getCardsAndCount(cardDataArr);
            //判断是否纯癞子炸
            if (laiList == 4 && cardDataArr.length == 4) {
                return gameProto.cardType.CHUN_LAIZI_BOMB;
            }
            //判断是否炸弹
            if (cardDataArr.length == 4 && this.isBoom(countList, 0)) {
                return gameProto.cardType.BOMB_CARD;
            }
            //判断是否癞子炸
            if (cardDataArr.length == 4 && this.isBoom(countList, laiList)) {
                return gameProto.cardType.LAIZI_BOMB;
            }
            //是否单连子
            if (cardDataArr.length >= 5 && this.isDanLian(cardDataArr, countList, laiList)) {
                return gameProto.cardType.SINGLE_LINE;
            }

            //是否四代二
            if (this.gameRule.isSiDaiEr && cardDataArr.length == 6 && this.isSiDaiEr(countList, laiList)) {
                return gameProto.cardType.FOUR_LINE_TAKE_X;
            }
            //是否四代两对
            if (this.gameRule.isSiDaiEr && cardDataArr.length == 8 && this.isSiDaiErDui(countList, laiList)) {
                return gameProto.cardType.FOUR_LINE_TAKE_DUI;
            }
            //是否三不带
            if (cardDataArr.length % 3 == 0 && this.isSanBuDai(countList, laiList)) {
                return gameProto.cardType.THREE_LINE;
            }

            //三带一
            if (cardDataArr.length % 4 == 0 && this.isSanDaiYi(countList, laiList)) {
                return gameProto.cardType.THREE_LINE_TAKE_ONE;
            }

            //是否三带对
            if (cardDataArr.length % 5 == 0 && this.isSanDaiDui(countList, laiList)) {
                return gameProto.cardType.THREE_LINE_TAKE_DUI;
            }

            //三代二
            // if (cardDataArr.length % 5 == 0 && this.isSanDaiEr(countList, laiList)) {
            //     return gameProto.cardType.THREE_LINE_TAKE_TWO;
            // }
            //对连
            if (cardDataArr.length >= 6 && cardDataArr.length % 2 == 0 && this.isDuiLian(countList, laiList)) {
                return gameProto.cardType.DOUBLE_LINE;
            }
            //默认无牌型
            return gameProto.cardType.ERROR;
        }

    }

    //是否三带一
    isSanDaiYi = function (countList, laiList) {

        let isCardType = false;
        let sanCount = 0;
        let danCount = 0;
        let cardValue = [];
        let totalCount = 0;
        let duiCount = 0;
        for (let j = 0; j < countList.length; j++) {
            let laiceList = laiList;
            for (let i = 0; i < countList.length; i++) {
                let curData = countList[i];
                totalCount += curData.count;
                if (curData.count == 3) {
                    sanCount += 1;
                    cardValue.push(curData.card);
                } else if (laiceList > 0 && curData.count + laiceList >= 3 && curData.count < 3 && curData.card != 16 && curData.card != 17) {
                    sanCount += 1;
                    totalCount += (3 - curData.count);
                    laiceList -= (3 - curData.count);
                    cardValue.push(curData.card);
                } else if (curData.count == 1) {
                    danCount += 1;
                } else if (curData.count == 2) {
                    duiCount += 1
                }
            }
            if (danCount > sanCount && laiceList >= 3) {
                laiceList -= 3;
                totalCount += 3;
                sanCount += 1;
            }
            if ((sanCount / 3) > danCount && laiceList >= 2) {
                laiceList -= 1;
                totalCount += 1;
                danCount += 1;
            }
            if (duiCount > 0 && sanCount / 2 == duiCount) {
                danCount += 2;
            }
            let isLianXu = this.isContinuous(cardValue, laiceList);
            if (isLianXu && (sanCount == (totalCount + laiceList) / 4) && totalCount == sanCount * 3 + danCount) {
                isCardType = true;
                break;
            }
            let lincountList = countList.shift();
            countList.push(lincountList);
            sanCount = 0;
            danCount = 0;
            cardValue = [];
            totalCount = 0;
        }
        return isCardType;
    }


    //是否三带对
    isSanDaiDui = function (countList, laiList) {

        let isCardType = false;
        let sanCount = 0;
        let duiCount = 0;
        let cardValue = [];
        let totalCount = 0;
        let linList = countList.length;
        for (let j = 0; j < linList; j++) {
            let laiceList = laiList;
            for (let i = 0; i < countList.length; i++) {
                let curData = countList[i];
                totalCount += curData.count;
                if (curData.count == 3) {
                    sanCount += 1;
                    cardValue.push(curData.card);
                } else if (laiceList > 0 && curData.count + laiceList >= 3 && curData.count < 3 && curData.card != 16 && curData.card != 17) {
                    sanCount += 1;
                    totalCount += laiceList;
                    laiceList -= (3 - curData.count);
                    cardValue.push(curData.card);
                } else if (curData.count == 2) {
                    duiCount += 2;
                } else if (laiceList > 0 && curData.count + laiceList >= 2 && curData.count < 2 && curData.card != 16 && curData.card != 17) {
                    totalCount += laiceList;
                    laiceList -= (2 - curData.count);
                    duiCount += 2;
                }
            }
            if ((duiCount / 2) > sanCount && laiceList >= 3) {
                laiceList -= 3;
                totalCount += 3;
                sanCount += 1;
            }
            if ((sanCount / 3) > (duiCount / 2) && laiceList >= 2) {
                laiceList -= 2;
                totalCount += 2;
                duiCount += 2;
            }
            let isLianXu = this.isContinuous(cardValue, laiceList);
            if (isLianXu && (sanCount == (totalCount + laiceList) / 5) && totalCount == sanCount * 3 + duiCount) {
                isCardType = true;
                break;
            }
            let lincountList = countList.shift();
            countList.push(lincountList);
            sanCount = 0;
            duiCount = 0;
            cardValue = [];
            totalCount = 0;
        }

        return isCardType;
    }

    //是否三带二
    isSanDaiEr = function (countList, laiList) {

        let isCardType = false;
        let sanCount = 0;
        let duiCount = 0;
        let cardValue = [];
        let totalCount = 0;
        let linList = countList.length;
        for (let j = 0; j < linList; j++) {
            let laiceList = laiList;
            for (let i = 0; i < countList.length; i++) {
                let curData = countList[i];
                totalCount += curData.count;
                if (curData.count == 3) {
                    sanCount += 1;
                    cardValue.push(curData.card);
                } else if (laiceList > 0 && curData.count + laiceList >= 3 && curData.count < 3 && curData.card != 16 && curData.card != 17) {
                    sanCount += 1;
                    totalCount += laiceList;
                    laiceList -= (3 - curData.count);
                    cardValue.push(curData.card);
                } else if (curData.count == 2) {
                    duiCount += 2;
                } else if (curData.count == 1) {
                    duiCount += 1;
                }
            }
            if ((duiCount / 2) > sanCount && laiceList >= 3) {
                laiceList -= 3;
                totalCount += 3;
                sanCount += 1;
            }
            if ((sanCount / 3) > (duiCount / 2)) {
                if (laiceList >= 2) {
                    laiceList -= 2;
                    totalCount += 2;
                    duiCount += 2;
                } else if (laiceList >= 1) {
                    laiceList -= 1;
                    totalCount += 1;
                    duiCount += 1;
                }

            }
            let isLianXu = this.isContinuous(cardValue, laiceList);
            if (isLianXu && (sanCount == (totalCount + laiceList) / 5) && totalCount == sanCount * 3 + duiCount) {
                isCardType = true;
                break;
            }
            let lincountList = countList.shift();
            countList.push(lincountList);
            sanCount = 0;
            duiCount = 0;
            cardValue = [];
            totalCount = 0;
        }

        return isCardType;
    }

    //是否四带二
    isSiDaiEr = function (countList, laiList) {
        let isCardType = false;
        //4个相同的牌就是炸弹
        if (countList.some(item => item.count == 4)) {
            isCardType = true;
        }
        if (countList.some(item => item.count + laiList >= 4)) {
            isCardType = true;
        }
        return isCardType;
    }
    //是否四带二对
    isSiDaiErDui = function (countList, laiList) {
        // let isCardType = false;
        // //4个相同的牌就是炸弹
        // if (countList.some(item => item.count == 4)) {
        //     isCardType = true;
        // }

        // if (countList.some(item => item.count + laiList >= 4)) {
        //     isCardType = true;
        // }

        let isCardType = false;
        let siCount = 0;
        let duiCount = 0;
        let cardValue = [];
        let totalCount = 0;
        let linList = countList.length;
        for (let j = 0; j < linList; j++) {
            let laiceList = laiList;
            for (let i = 0; i < countList.length; i++) {
                let curData = countList[i];
                totalCount += curData.count;
                if (curData.count == 4) {
                    siCount += 1;
                    cardValue.push(curData.card);
                } else if (laiceList > 0 && curData.count + laiceList >= 4 && curData.count <= 3 && curData.card != 16 && curData.card != 17) {
                    siCount += 1;
                    totalCount += laiceList;
                    laiceList -= (4 - curData.count);
                    cardValue.push(curData.card);
                } else if (curData.count == 2) {
                    duiCount += 2;
                } else if (laiceList > 0 && curData.count + laiceList >= 2 && curData.count <= 1 && curData.card != 16 && curData.card != 17) {
                    duiCount += 2;
                    totalCount += (2 - curData.count);
                    laiceList -= (2 - curData.count);
                }
            }
            if ((duiCount / 2) > siCount && laiceList >= 4) {
                laiceList -= 4;
                totalCount += 4;
                siCount += 1;
            }
            if ((siCount / 4) > (duiCount / 2)) {
                if (laiceList >= 2) {
                    laiceList -= 2;
                    totalCount += 2;
                    duiCount += 2;
                } else if (laiceList >= 1) {
                    laiceList -= 1;
                    totalCount += 1;
                    duiCount += 1;
                }

            }
            let isLianXu = this.isContinuous(cardValue, laiceList);
            if (isLianXu && (siCount == (totalCount + laiceList) / 8) && totalCount == siCount * 4 + duiCount) {
                isCardType = true;
                return isCardType;
            }
            let lincountList = countList.shift();
            countList.push(lincountList);
            siCount = 0;
            duiCount = 0;
            cardValue = [];
            totalCount = 0;
        }

        for (let j = 0; j < linList; j++) {
            for (let i = 0; i < countList.length; i++) {
                let curData = countList[i];
                totalCount += curData.count;
                if (curData.count == 4) {
                    siCount += 1;
                    cardValue.push(curData.card);
                } else if (curData.count == 2) {
                    duiCount += 2;
                }
            }
            duiCount += laiList;
            totalCount += laiList;
            let isLianXu = this.isContinuous(cardValue, 0);
            if (isLianXu && (siCount == (totalCount) / 8) && totalCount == siCount * 4 + duiCount) {
                isCardType = true;
                return isCardType;
            }
            let lincountList = countList.shift();
            countList.push(lincountList);
            siCount = 0;
            duiCount = 0;
            cardValue = [];
            totalCount = 0;
        }
        return isCardType;
    }
    //是否对连
    isDuiLian = function (countList, laiList) {

        let isCardType = false;
        let totalCount = 0;
        let duiCount = 0;
        let cardValue = [];
        for (let i = 0; i < countList.length; i++) {
            let curData = countList[i];
            totalCount += curData.count;
            if (curData.card >= 15) {
                break;
            }
            cardValue.push(curData.card);
            if (curData.count == 2) {
                duiCount += 1;
            } else if (curData.count == 1 && laiList != 0) {
                duiCount += 1;
                totalCount += 1;
                laiList--;
            }
        }
        if (laiList == 2) {
            laiList--;
        }
        let isLianXu = this.isContinuous(cardValue, laiList);
        if (isLianXu && totalCount == duiCount * 2) {
            isCardType = true;
        }
        return isCardType;

    }

    //连子5个起连
    isDanLian = function (cardData, countList, laiList) {

        let curCardList = [];
        for (let i = 0; i < cardData.length; i++) {
            if (this.laiZiList.includes(this.getCardLogicValue(cardData[i]))) {
                continue;
            }
            curCardList.push(this.getCardLogicValue(cardData[i]));
        }
        if (laiList > 0 && curCardList.length > 0) {
            for (let index = 0; index < curCardList.length; index++) {
                if (laiList > 0 && curCardList[index - 1] && curCardList[index - 1] != curCardList[index] + 1) {
                    curCardList.push(this.getCardLogicValue(curCardList[index] + 1));
                    curCardList.sort((a, b) => {
                        return (this.getCardLogicValue(b) - this.getCardLogicValue(a))
                    });
                    laiList--;
                }
            }
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
        return this.isContinuous(curCardList, laiList);

    }
    //是否炸弹
    isBoom = function (countList, laiList) {

        let isCardType = false;
        //4个相同的牌就是炸弹
        if (countList.length == 1 && countList[0].count == 4) {
            isCardType = true;
        }
        if (countList.length >= 1 && countList[0].count + laiList >= 4 && countList[0].card != 16 && countList[0].card != 17) {
            isCardType = true;
        }
        return isCardType;

    }

    //是否是天炸
    isTianZha = function (countList) {

        let isCardType = false;
        //3个A
        // if (countList.length == 1 && countList[0].count == 3 && countList[0].card == 14) {
        //     isCardType = true;
        // }
        if (countList.indexOf(0x4E) != -1 && countList.indexOf(0x4F) != -1) {
            isCardType = true;
        }
        return isCardType;

    }

    //是否三不带
    isSanBuDai = function (countList, laiList) {

        let isCardType = false;
        let sanCount = 0;
        let cardValue = [];
        let totalCount = 0;
        for (let j = 0; j < countList.length; j++) {
            let laiceList = laiList;
            for (let i = 0; i < countList.length; i++) {
                let curData = countList[i];
                totalCount += curData.count;
                if (curData.count == 3) {
                    sanCount += 1;
                    cardValue.push(curData.card);
                } else if (laiceList > 0 && curData.count + laiceList >= 3 && curData.count <= 3) {
                    sanCount += 1;
                    totalCount += (3 - curData.count);
                    laiceList -= (3 - curData.count);
                    cardValue.push(curData.card);
                }
            }
            if (laiceList >= 3) {
                laiceList -= 3;
                totalCount += 3;
                sanCount += 1;
            }
            let isLianXu = this.isContinuous(cardValue, laiceList);
            if (isLianXu && (sanCount == (totalCount + laiceList) / 3) && totalCount == sanCount * 3) {
                isCardType = true;
                break;
            }
            let lincountList = countList.shift();
            countList.push(lincountList);
            sanCount = 0;
            cardValue = [];
            totalCount = 0;
        }
        return isCardType;
    }

    //获取卡牌的值和数量
    getCardsAndCount = function (cardData) {
        cardData = cardData ? cardData : []
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
    isContinuous = function (cardData, laiList) {
        let maxCard = Math.max(...cardData);
        let minCard = Math.min(...cardData);
        if (maxCard - minCard == cardData.length - 1) {
            return true;
        } else if (laiList > 0 && maxCard - (minCard + laiList) == cardData.length - 1) {
            return true;
        } else {
            return false;
        }
    }

    //获取3带的牌型
    getThreeLineType = function (userCards, lastCardValue) {

        let {
            cardCount,
            countList,
            laiList
        } = this.getCardsAndCount(userCards.slice());
        //3个的连子
        let threeLineResult = countList.filter(item => item.count >= (3 - laiList) && parseInt(item.card) > parseInt(lastCardValue));
        // 三不带卡牌
        let threeLineList = [];
        for (let i = 0; i < threeLineResult.length; i++) {
            let linlaiList = laiList;
            let linuserCards = userCards.slice();
            let cardValue = parseInt(threeLineResult[i].card);
            let cardList = [];
            for (let index = 0; index < linuserCards.length; index++) {
                if (this.getCardLogicValue(linuserCards[index]) == cardValue && cardList.length < 3) {
                    cardList = cardList.concat(linuserCards.splice(index, 1));
                    index--;
                }
            }
            if (cardList.length < 3 && linlaiList > 0) {
                let lincardList = linuserCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item)));
                for (let index = 0; index < lincardList.length; index++) {
                    cardList = cardList.concat(linuserCards.splice(linuserCards.indexOf(lincardList[index]), 1));
                    lincardList.splice(index, 1);
                    linlaiList--;
                    index--;
                    if (cardList.length == 3) {
                        break;
                    }
                }
            }
            if (cardList.length < 3) {
                continue;
            }
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
                let nextLineResult = countList.filter(item => item.count == (3 - linlaiList) && item.card == nextCardValue);
                if (nextLineResult.length > 0) {
                    let nextCardsList = [];
                    for (let index = 0; index < linuserCards.length; index++) {
                        if (this.getCardLogicValue(linuserCards[index]) == nextCardValue && cardList.length < 3) {
                            cardList = cardList.concat(linuserCards.splice(index, 1));
                            index--;
                        }
                    }
                    if (cardList.length < 3 && linlaiList > 0) {
                        let lincardList = linuserCards.filter(item => this.laiZiList.includes(this.getCardLogicValue(item)));
                        for (let index = 0; index < lincardList.length; index++) {
                            cardList = cardList.concat(linuserCards.splice(linuserCards.indexOf(lincardList[index]), 1));
                            lincardList.splice(index, 1);
                            linlaiList--;
                            index--;
                            if (cardList.length == 3) {
                                break;
                            }
                        }
                    }
                    if (cardList.length + nextCardsList.length < 6 || nextCardsList.length < 3) {
                        break;
                    }
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
    listreGroupCard = function (cardList, maxCount) {
        cardList = cardList.slice();
        let list = [];
        for (let i = 0; i < cardList.length; i++) {
            let curCard = cardList[i];
            let curList = [curCard];
            let isCanNext = true;
            //let nextIndex = i + 1;
            let nextIndex = 0;
            while (isCanNext && curList.length != maxCount) {
                if (!cardList[nextIndex]) {
                    break;
                }
                if (!curList.includes(cardList[nextIndex])) {
                    curList.push(cardList[nextIndex]);
                    curList.sort((a, b) => {
                        return a - b
                    });
                    if (!this.arrInArr(list.slice(), curList.slice())) {
                        i = 0;
                    } else {
                        curList.splice(curList.indexOf(cardList[nextIndex]), 1);
                    }
                }
                // if (nextIndex < cardList.length) {
                nextIndex += 1;
                // } else {
                //     isCanNext = false;
                // }
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
    //数据组合
    reGroupCard = function (cardList, maxCount) {
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
    arrInArr = function (arr, arr1) {
        let isHave = false;
        // arr = arr.map(item => {
        //     return this.getCardLogicValue(item)
        // });
        arr1 = arr1.map(item => {
            return this.getCardLogicValue(item)
        });
        for (let i = 0; i < arr.length; i++) {
            let cardList = arr[i].map(item => {
                return this.getCardLogicValue(item)
            });
            if (cardList.toString() == arr1.toString()) {
                isHave = true;
                break;
            }
        }
        return isHave;
    }

    //获取最小值
    getMinValue = function (curData, maxCount = null) {

        let curCardValue = 0;
        let curCardResult = curData ? this.getCardsAndCount(curData) : null;
        if (curCardResult) {
            for (let key in curCardResult.cardCount) {
                if ((maxCount && (curCardResult.cardCount[key] + curCardResult.laiList) >= maxCount) || !maxCount) {
                    if ((curCardValue == 0 || parseInt(key) < curCardValue)) {
                        curCardValue = parseInt(key);
                    }
                }
            }
        }
        return curCardValue;
    }
    //获取自动出牌
    getAutoCard = function (userCards, curData = null) {
        userCards = userCards.slice();
        let curCardList = this.searchOutCard(userCards, curData);
        //如果有保单 然后只能出单张的时候
        if (curCardList.every(item => item.cardList.length == 1)) {
            curCardList.sort((a, b) => {
                return (this.getCardLogicValue(a.cardList[0]) - this.getCardLogicValue(b.cardList[0]));
            });
            return curCardList[0] && curCardList[0].cardList;
        } else {
            curCardList.sort((a, b) => {
                return (b.cardList.length - a.cardList.length)
            });
            return curCardList[0] && curCardList[0].cardList;
        }
    }
}

module.exports = new GameLogic();