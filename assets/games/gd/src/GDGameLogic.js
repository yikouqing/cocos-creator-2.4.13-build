const gameProto = require('./ApiGd');
//默认卡牌
const cards = [
    0x4E, 0x4F,
    0X01, 0X02, 0X03, 0X04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, //方块 A- K
    0X11, 0X12, 0X13, 0X14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, //梅花 A- K
    0X21, 0X22, 0X23, 0X24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, //红桃 A- K
    0X31, 0X32, 0X33, 0X34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, //黑桃 A- K

    0x4E, 0x4F,
    0X01, 0X02, 0X03, 0X04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, //方块 A- K
    0X11, 0X12, 0X13, 0X14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, //梅花 A- K
    0X21, 0X22, 0X23, 0X24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, //红桃 A- K
    0X31, 0X32, 0X33, 0X34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, //黑桃 A- K
];

//数值掩码
const MASK_COLOR = 0xF0; //花色掩码
const MASK_VALUE = 0x0F; //数值掩码

var logic = module.exports;
//获取所有卡牌
logic.getAllCards = function () {
    return cards;
}
//获取逢人配数量
logic.getAdaptive = function (cards, MainInterface = null) {
    let Adaptive = {};
    //初始化数据
    Adaptive.Sum = 0; //主牌数量
    Adaptive.AdaptiveSum = 0; //逢人配数量
    Adaptive.AdaptiveArr = [];
    if (!MainInterface) return Adaptive;
    //红桃为逢人配 其他为主牌
    for (let index of cards) {
        //获得数值
        if (this.getCardValue(index) == MainInterface) {
            Adaptive.Sum++;
            if (parseInt((this.getCardColor(index)) / 10) == 3) {
                Adaptive.AdaptiveSum++;
                Adaptive.AdaptiveArr.push(index);
            }
        }
    }
    return Adaptive;
}
//获取卡牌
logic.getExceptCards = function (allTestCards, uid = null) {

    let allCards = cards.slice();
    let testCards = [];
    for (let key in allTestCards) {
        if (uid && uid == key) {
            continue;
        }
        testCards = testCards.concat(allTestCards[key]);
    }

    for (let index in testCards) {
        let find = allCards.findIndex(item => item == testCards[index])
        allCards.splice(find, 1);
    }
    //let newCards = allCards.filter(item => !testCards.includes(item));
    return allCards.slice();
}

//获取花色
logic.getCardColor = function (cardData) {
    return cardData & MASK_COLOR;
};


//获取所有卡牌并洗牌
logic.getWashedCards = function (allTestCards, isWashCard) {

    let curCards = this.getExceptCards(allTestCards);
    let length = 0;
    //不洗牌玩法 只洗总牌数 54/6=9*2=18 次
    if (isWashCard) {
        length = curCards.length / 6;
    } else {
        //不洗牌玩法 洗总牌数次数 54
        length = curCards.length;
    }
    for (let i = 0; i < length; ++i) {
        let random = Math.floor(Math.random() * curCards.length);
        let tmp = curCards[i];
        curCards[i] = curCards[random];
        curCards[random] = tmp;
    }
    //curCards.sort((a, b) => { return this.getCardLogicValue(b) -  this.getCardLogicValue(a) });
    return curCards.slice();


}
//判断牌是否在当前的牌库中
logic.isInCardList = function (allTestCards, cardData, uid = null) {

    let curCards = this.getExceptCards(allTestCards, uid);
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
//排序
logic.sortCardList = function (cardDataArr, MainInterface = null) {
    //数目过虑
    if (!cardDataArr || cardDataArr.length <= 1) return cardDataArr;
    let cardCount = cardDataArr.length;
    //转换数值
    let sortValueArr = [];
    for (let i = 0; i < cardDataArr.length; i++) {
        sortValueArr[i] = this.getCardLogicValue(cardDataArr[i], MainInterface);
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
//分析
logic.analyseCardDataArr = function (cardDataArr, MainInterface = null) {
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
        let logicValue = this.getCardLogicValue(cardDataArr[i], MainInterface);
        if (logicValue <= 0) return null;
        //搜索同牌
        for (let j = i + 1; j < cardCount; j++) {
            //获取扑克
            if (this.getCardLogicValue(cardDataArr[j], MainInterface) !== logicValue) break;
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
//对比
logic.removeCard = function (removeCardArr, cardDataArr) {
    if (removeCardArr.length > cardDataArr.length) return false;

    let tempCardDataArr = cardDataArr.slice();

    //置零扑克
    let deleteCount = 0;
    for (let i = 0; i < removeCardArr.length; i++) {
        for (let j = 0; j < cardDataArr.length; j++) {
            if (removeCardArr[i] === tempCardDataArr[j]) {
                tempCardDataArr[j] = 0;
                deleteCount++;
                break;
            }
        }
    }
    if (deleteCount !== removeCardArr.length) return false;

    let index = 0;
    for (let i = 0; i < tempCardDataArr.length; ++i) {
        if (tempCardDataArr[i] !== 0) {
            cardDataArr[index++] = tempCardDataArr[i];
        }
    }
    cardDataArr.splice(index, cardDataArr.length - index);
    return true;
};
//逻辑数值
logic.getCardLogicValue = function (cardData, MainInterface = null) {
    //扑克属性
    let cardValue = this.getCardValue(cardData);
    if (cardValue <= 0 || cardValue > 18) {
        return 0;
    }

    if (cardData == 0x4E) {
        cardValue = 16;
    } else if (cardData == 0x4F) {
        cardValue = 17;
    } else if (cardValue == MainInterface) {
        cardValue = 15;
        return cardValue;
    }
    return (cardValue <= 1) ? (cardValue + 13) : cardValue;
};

logic.getSortCard = function (curData, gameRule, MainInterface = null) {

    let curType = this.getCardType(curData, gameRule, MainInterface);

    //三带二
    if (curType == gameProto.cardType.THREE_LINE_TAKE_TWO) {

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
            let curDataList = curData.filter(item => this.getCardLogicValue(item, MainInterface) == countList[i].card);
            curList = curList.concat(curDataList);
        }
        curData = curList.slice();
    }
    return curData;

}

//获取出牌推荐
logic.searchOutCard = function (gameRule, userCards, MainInterface = null, curData = null) {


    let outCardList = [];
    if (!userCards || userCards.length <= 0) {
        return outCardList;
    }
    //排序
    userCards.sort((a, b) => {
        return this.getCardLogicValue(a) - this.getCardLogicValue(b)
    });
    if (curData) {
        //排序
        curData.sort((a, b) => {
            return this.getCardLogicValue(a) - this.getCardLogicValue(b)
        });
    }

    //逢人配数量及牌
    let MainInterfaceList = this.getAdaptive(userCards.slice(), MainInterface);
    //出牌的类型
    let curCardType = this.getCardType(curData, gameRule, MainInterface);
    //天炸最大
    if (curCardType && curCardType == gameProto.cardType.TIAN_WANG_BOMB) {
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
        let curCardValue = curData ? this.getCardLogicValue(curData[0], MainInterface) : 0;
        for (let key in cardCount) {
            key = parseInt(key);
            let linMainInterface = 0;
            if (key == MainInterface) {
                linMainInterface = 15;
            }
            if (key > parseInt(curCardValue) || linMainInterface > parseInt(curCardValue)) {
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
    if (!curCardType || curCardType == gameProto.cardType.DOUBLE || (curCardType && curCardType == gameProto.cardType.THREE_LINE_TAKE_TWO)) {

        //队子组合
        let curCardValue = curData ? this.getCardLogicValue(curData[0], MainInterface) : 0;
        if (curCardType && curCardType == gameProto.cardType.THREE_LINE_TAKE_TWO) {
            curCardValue = 0;
        }
        for (let key in cardCount) {
            key = parseInt(key);
            let linMainInterface = 0;
            if (key == MainInterface) {
                linMainInterface = 15;
            }
            if ((key > parseInt(curCardValue) || linMainInterface > parseInt(curCardValue)) && cardCount[key] >= 2) {
                let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice(0, 2);
                let cards = {
                    cardList: cardList.slice(),
                    type: gameProto.cardType.DOUBLE
                };
                outCardList.push(cards);
            }
        }
        //计算加入逢人配牌组合
        if (MainInterfaceList && MainInterfaceList.AdaptiveSum > 0) {
            for (let key in cardCount) {
                key = parseInt(key);
                if (key > parseInt(curCardValue) && cardCount[key] >= 1) {
                    let cardList = userCards.filter(item => this.getCardLogicValue(item) == key).slice(0, 1);
                    //逢人配 不可与王组合
                    if (cardList[0] >= 0x4E) continue;
                    let cards = {
                        cardList: [cardList[0], MainInterfaceList.AdaptiveArr[0]],
                        type: gameProto.cardType.DOUBLE
                    };
                    outCardList.push(cards);
                }
            }
        }
    }

    //单联
    if (!curCardType || curCardType == gameProto.cardType.SINGLE_LINE) {

        let count = curData ? curData.length : 0;
        let curCardValue = 0;
        let ISMaxValue = false;
        if (curCardType && curCardType == gameProto.cardType.SINGLE_LINE) {
            curCardValue = parseInt(this.getMinValue(curData, null, MainInterface))
            let SunMaxValue = this.getSunMaxValue(curData, MainInterface);
            if (SunMaxValue == 14 && (this.getCardLogicValue(curData[0]) == 2 || this.getCardLogicValue(curData[1]) == 3 || this.getCardLogicValue(curData[2]) == 4)) {
                curCardValue = 1;
            } else if (SunMaxValue == 14) {
                ISMaxValue = true;
            }
        }
        for (let i = 0; i < userCards.length; i++) {
            let cardValue = parseInt(this.getCardLogicValue(userCards[i]));
            if (cardValue >= 15 || cardValue <= curCardValue || ISMaxValue) continue;
            let curCard = userCards[i];
            let cardList = [curCard];
            //同花顺逢人配数量及牌
            let SINGLE_LINEList = this.getAdaptive(userCards.slice(), MainInterface);
            //判断是否有连续的
            for (let k = 0; k < userCards.length; k++) {
                let nextCardValue = parseInt(this.getCardLogicValue(userCards[k]));
                //特殊算法 当下一位为2时 A变为1 计算A 2 3 4 5 可能性 
                if (!curCardType && nextCardValue == 2 && cardValue == 14 && cardList.length == 1) {
                    cardValue = 1;
                }
                let nextCard = userCards.find(item => this.getCardLogicValue(item) == (cardValue + 1));
                if (!nextCard) {
                    if (SINGLE_LINEList && SINGLE_LINEList.AdaptiveSum > 0) {
                        cardList.push(MainInterfaceList.AdaptiveArr[0]);
                        SINGLE_LINEList.AdaptiveSum--;
                        cardValue += 1;
                    } else {
                        break;
                    }
                } else {
                    cardList.push(nextCard);
                    cardValue += 1;
                }
                //if ((nextCardValue == cardValue + 1)) {
                if (cardList.length == 5) {
                    if (MainInterfaceList && MainInterfaceList.AdaptiveSum > 0) {
                        //遍历牌组 如果已有逢人配 减一
                        let AdaptiveList = cardList.slice();
                        let AdaptiveSum = MainInterfaceList.AdaptiveSum;
                        for (let index = 0; index < AdaptiveList.length; index++) {
                            if (AdaptiveList[index] == MainInterfaceList.AdaptiveArr[0]) {
                                AdaptiveSum--;
                            }
                        }
                        //逢人配小于0
                        if (AdaptiveSum < 0) {
                            break;
                        }
                    }
                    //排序
                    cardList.sort((a, b) => {
                        return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                    });
                    let curCards = outCardList.find(item => item.type == gameProto.cardType.SINGLE_LINE && item.cardList.toString() == cardList.toString());
                    if (!curCards) {
                        let cards = {
                            cardList: cardList.slice(),
                            type: gameProto.cardType.SINGLE_LINE
                        };
                        outCardList.push(cards);
                        i = -1;
                        break;
                    }
                }
                //}
            }
        }
    }

    //对联
    if (!curCardType || (curCardType && curCardType == gameProto.cardType.DOUBLE_LINE)) {
        //判断对连
        let count = curData ? curData.length : 0;
        let curCountList = countList.filter(item => item.count >= 2);
        let curCardValue = this.getMinValue(curData, 2, MainInterface);
        curCountList.sort((a, b) => {
            return a.card - b.card
        });
        let A23curCountList = [];
        for (let i = 0; i < curCountList.length; i++) {
            let cardValue = parseInt(curCountList[i].card);
            if (cardValue <= curCardValue) continue;
            if (cardValue >= 15) continue;
            if (cardValue == 14 || cardValue == 2 || cardValue == 3) {
                A23curCountList.push(curCountList[i]);
            }
            let cardList = userCards.filter(item => this.getCardLogicValue(item) == cardValue).slice(0, 2);
            let ISZhao = false;
            //判断是否有连续的
            for (let k = i + 1; k < curCountList.length; k++) {
                let nextCardValue = parseInt(curCountList[k].card);
                if (nextCardValue == cardValue + 1) {
                    //找到一个连续的
                    let nextCard = userCards.filter(item => this.getCardLogicValue(item) == nextCardValue).slice(0, 2);
                    cardList = cardList.concat(nextCard);
                    cardValue += 1;
                    //排序
                    cardList.sort((a, b) => {
                        return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                    });
                    let curCard = outCardList.find(item => item.type == gameProto.cardType.DOUBLE_LINE && item.cardList.toString() == cardList.toString());
                    if (!curCard) {
                        if (cardList.length == 6) {
                            let cards = {
                                cardList: cardList.slice(),
                                type: gameProto.cardType.DOUBLE_LINE
                            };
                            outCardList.push(cards);
                            ISZhao == true;
                        }
                    }
                } else {
                    break;
                }
            }
            //逢人配数据组合
            if (!ISZhao && cardList.length < 6 && MainInterfaceList && MainInterfaceList.AdaptiveSum > 0) {
                //查询所在位置 
                let curCounMain = countList.findIndex(item => item.card == cardValue);
                //组合前2中1 --后2 中1-- 前1 中1 后1 --  
                //前2中1 组合数据
                if (countList[curCounMain - 2] && countList[curCounMain - 2].count && parseInt(countList[curCounMain - 2].card) == (cardValue - 2) &&
                    countList[curCounMain - 1] && countList[curCounMain - 1].count && parseInt(countList[curCounMain - 1].card) == (cardValue - 1)) {

                    let nextcount = MainInterfaceList.AdaptiveSum;
                    let lincard = [];
                    let Qian_2_cardValue = parseInt(countList[curCounMain - 2].card);
                    //前2数据记录
                    if (countList[curCounMain - 2].count >= 2 && Qian_2_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain - 2].card).slice(0, 2);
                        lincard.push(nextCard[0]);
                        lincard.push(nextCard[1]);
                    } else if (countList[curCounMain - 2].count == 1 && nextcount > 0 && Qian_2_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain - 2].card).slice(0, 1);
                        lincard.push(nextCard[0]);
                        lincard.push(MainInterfaceList.AdaptiveArr[0]);
                    }
                    //前1数据记录
                    let Qian_1_cardValue = parseInt(countList[curCounMain - 1].card);
                    if (countList[curCounMain - 1].count >= 2 && Qian_1_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain - 1].card).slice(0, 2);
                        lincard.push(nextCard[0]);
                        lincard.push(nextCard[1]);
                    } else if (countList[curCounMain - 1].count == 1 && nextcount > 0 && Qian_1_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain - 1].card).slice(0, 1);
                        lincard.push(nextCard[0]);
                        lincard.push(MainInterfaceList.AdaptiveArr[0]);
                    }

                    //整合数据
                    let lincardList = cardList.concat(lincard);
                    //遍历牌组 如果有逢人配 减一
                    for (let index = 0; index < lincardList.length; index++) {
                        if (lincardList[index] == MainInterfaceList.AdaptiveArr[0]) {
                            nextcount--;
                        }
                    }
                    if (lincardList && lincardList.length == 6 && nextcount >= 0) {
                        //排序
                        lincardList.sort((a, b) => {
                            return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                        });
                        let curCard = outCardList.find(item => item.type == gameProto.cardType.DOUBLE_LINE && item.cardList.toString() == lincardList.toString());
                        if (!curCard) {
                            let cards = {
                                cardList: lincardList.slice(),
                                type: gameProto.cardType.DOUBLE_LINE
                            };
                            outCardList.push(cards);
                        }

                    }
                }
                //后2 中1组合数据
                if (countList[curCounMain + 2] && countList[curCounMain + 2].count && parseInt(countList[curCounMain + 2].card) == (cardValue + 2) &&
                    countList[curCounMain + 1] && countList[curCounMain + 1].count && parseInt(countList[curCounMain + 1].card) == (cardValue + 1)) {

                    let nextcount = MainInterfaceList.AdaptiveSum;
                    let lincard = [];
                    let Hou_2_cardValue = parseInt(countList[curCounMain + 2].card);
                    //后2数据记录
                    if (countList[curCounMain + 2].count >= 2 && Hou_2_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain + 2].card).slice(0, 2);
                        lincard.push(nextCard[0]);
                        lincard.push(nextCard[1]);
                    } else if (countList[curCounMain + 2].count == 1 && nextcount > 0 && Hou_2_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain + 2].card).slice(0, 1);
                        lincard.push(nextCard[0]);
                        lincard.push(MainInterfaceList.AdaptiveArr[0]);
                    }
                    //后1数据记录
                    let Hou_1_cardValue = parseInt(countList[curCounMain + 1].card);
                    if (countList[curCounMain + 1].count >= 2 && Hou_1_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain + 1].card).slice(0, 2);
                        lincard.push(nextCard[0]);
                        lincard.push(nextCard[1]);
                    } else if (countList[curCounMain + 1].count == 1 && nextcount > 0 && Hou_1_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain + 1].card).slice(0, 1);
                        lincard.push(nextCard[0]);
                        lincard.push(MainInterfaceList.AdaptiveArr[0]);
                    }
                    //整合数据
                    let lincardList = cardList.concat(lincard);
                    //遍历牌组 如果有逢人配 减一
                    for (let index = 0; index < lincardList.length; index++) {
                        if (lincardList[index] == MainInterfaceList.AdaptiveArr[0]) {
                            nextcount--;
                        }
                    }
                    if (lincardList && lincardList.length == 6 && nextcount >= 0) {
                        //排序
                        lincardList.sort((a, b) => {
                            return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                        });
                        let curCard = outCardList.find(item => item.type == gameProto.cardType.DOUBLE_LINE && item.cardList.toString() == lincardList.toString());
                        if (!curCard) {
                            let cards = {
                                cardList: lincardList.slice(),
                                type: gameProto.cardType.DOUBLE_LINE
                            };
                            outCardList.push(cards);
                        }

                    }
                }

                //前1 中1 后1 组合数据
                if (countList[curCounMain + 1] && countList[curCounMain + 1].count && parseInt(countList[curCounMain + 1].card) == (cardValue + 1) &&
                    countList[curCounMain - 1] && countList[curCounMain - 1].count && parseInt(countList[curCounMain - 1].card) == (cardValue - 1)) {

                    let nextcount = MainInterfaceList.AdaptiveSum;
                    let lincard = [];
                    let Qian_1_cardValue = parseInt(countList[curCounMain + 1].card);
                    let Hou_1_cardValue = parseInt(countList[curCounMain - 1].card);
                    //前1数据记录
                    if (countList[curCounMain + 1].count >= 2 && Qian_1_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain + 1].card).slice(0, 2);
                        lincard.push(nextCard[0]);
                        lincard.push(nextCard[1]);
                    } else if (countList[curCounMain + 1].count == 1 && nextcount > 0 && Qian_1_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain + 1].card).slice(0, 1);
                        lincard.push(nextCard[0]);
                        lincard.push(MainInterfaceList.AdaptiveArr[0]);
                    }
                    //后1数据记录
                    if (countList[curCounMain - 1].count >= 2 && Hou_1_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain - 1].card).slice(0, 2);
                        lincard.push(nextCard[0]);
                        lincard.push(nextCard[1]);
                    } else if (countList[curCounMain - 1].count == 1 && nextcount > 0 && Hou_1_cardValue > curCardValue) {
                        let nextCard = userCards.filter(item => this.getCardLogicValue(item) == countList[curCounMain - 1].card).slice(0, 1);
                        lincard.push(nextCard[0]);
                        lincard.push(MainInterfaceList.AdaptiveArr[0]);
                    }

                    //整合数据
                    let lincardList = cardList.concat(lincard);
                    //遍历牌组 如果有逢人配 减一
                    for (let index = 0; index < lincardList.length; index++) {
                        if (lincardList[index] == MainInterfaceList.AdaptiveArr[0]) {
                            nextcount--;
                        }
                    }
                    if (lincardList && lincardList.length == 6 && nextcount >= 0) {
                        //排序
                        lincardList.sort((a, b) => {
                            return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                        });
                        let curCard = outCardList.find(item => item.type == gameProto.cardType.DOUBLE_LINE && item.cardList.toString() == lincardList.toString());
                        if (!curCard) {
                            let cards = {
                                cardList: lincardList.slice(),
                                type: gameProto.cardType.DOUBLE_LINE
                            };
                            outCardList.push(cards);
                        }

                    }
                }
            }
        }
        //特殊校验 A 2 3 
        for (let i = 0; i < A23curCountList.length; i++) {
            let cardValue = parseInt(A23curCountList[i].card);
            if (cardValue <= curCardValue || (cardValue == 14 && 1 <= curCardValue)) continue;
            if (cardValue >= 15) continue;
            let SINGLE_LINEList = this.getAdaptive(userCards.slice(), MainInterface);
            let cardList = userCards.filter(item => this.getCardLogicValue(item) == cardValue && item != (MainInterface + 32)).slice(0, 2);
            if (cardList.length < 2) {
                break;
            }

            //特殊算法 A 2 3可能性 
            if (cardValue == 14) {
                cardValue = 1;
            }
            //计算 2 3 
            let nextCard_One = [];
            let nextCard_Tow = [];
            //cardValue==1
            if (cardValue == 1) {
                //计算 2 3 
                nextCard_One = userCards.filter(item => this.getCardLogicValue(item) == (cardValue + 1) && item != (MainInterface + 32)).slice();
                nextCard_Tow = userCards.filter(item => this.getCardLogicValue(item) == (cardValue + 2) && item != (MainInterface + 32)).slice();
            } else if (cardValue == 2) {
                //计算 1 3 
                nextCard_One = userCards.filter(item => this.getCardLogicValue(item) == (14) && item != (MainInterface + 32)).slice();
                nextCard_Tow = userCards.filter(item => this.getCardLogicValue(item) == (cardValue + 1) && item != (MainInterface + 32)).slice();
            } else if (cardValue == 3) {
                //计算 1 2 
                nextCard_One = userCards.filter(item => this.getCardLogicValue(item) == (14) && item != (MainInterface + 32)).slice();
                nextCard_Tow = userCards.filter(item => this.getCardLogicValue(item) == (cardValue - 1) && item != (MainInterface + 32)).slice();
            }
            if (!nextCard_One) {
                if (SINGLE_LINEList && SINGLE_LINEList.AdaptiveSum >= 2) {
                    cardList.push(MainInterfaceList.AdaptiveArr[0]);
                    cardList.push(MainInterfaceList.AdaptiveArr[0]);
                    SINGLE_LINEList.AdaptiveSum -= 2;
                } else {
                    break;
                }
            } else if (nextCard_One && nextCard_One.length < 2) {
                if (SINGLE_LINEList && SINGLE_LINEList.AdaptiveSum >= 1) {
                    cardList.push(MainInterfaceList.AdaptiveArr[0]);
                    cardList.push(nextCard_One[0]);
                    SINGLE_LINEList.AdaptiveSum--;
                } else {
                    break;
                }
            } else {
                cardList.push(nextCard_One[0]);
                cardList.push(nextCard_One[1]);
            }
            if (!nextCard_Tow) {
                if (SINGLE_LINEList && SINGLE_LINEList.AdaptiveSum >= 2) {
                    cardList.push(MainInterfaceList.AdaptiveArr[0]);
                    cardList.push(MainInterfaceList.AdaptiveArr[0]);
                    SINGLE_LINEList.AdaptiveSum -= 2;
                } else {
                    break;
                }
            } else if (nextCard_Tow && nextCard_Tow.length < 2) {
                if (SINGLE_LINEList && SINGLE_LINEList.AdaptiveSum >= 1) {
                    cardList.push(MainInterfaceList.AdaptiveArr[0]);
                    cardList.push(nextCard_Tow[0]);
                    SINGLE_LINEList.AdaptiveSum--;
                } else {
                    break;
                }
            } else {
                cardList.push(nextCard_Tow[0]);
                cardList.push(nextCard_Tow[1]);
            }
            //排序
            cardList.sort((a, b) => {
                return this.getCardLogicValue(a) - this.getCardLogicValue(b)
            });
            let curCard = outCardList.find(item => item.type == gameProto.cardType.DOUBLE_LINE && item.cardList.toString() == cardList.toString());
            if (!curCard) {
                if (cardList.length == 6) {
                    let cards = {
                        cardList: cardList.slice(),
                        type: gameProto.cardType.DOUBLE_LINE
                    };
                    outCardList.push(cards);
                }
            }
        }
    }

    //三不带
    if ((!curCardType || (curCardType && curCardType == gameProto.cardType.THREE_LINE) || (curCardType && curCardType == gameProto.cardType.THREE_LINE_TAKE_TWO) ||
        (curCardType && curCardType == gameProto.cardType.STEEL_PLATE))) {

        let curCardValue = this.getMinValue(curData, 3, MainInterface);
        //三不带
        let curCardData = [];
        if (curData) {
            //获取去掉癞子
            for (let i = 0; i < curData.length; i++) {
                if (curData[i] != (MainInterface + 32)) {
                    curCardData.push(curData[i]);
                }
            }
            curCardData.sort((a, b) => {
                return this.getCardLogicValue(b) - this.getCardLogicValue(a)
            });
            //AAA 222 按最小算
            if (curCardValue == 14 && this.getCardLogicValue(curCardData[curCardData.length - 1]) == 2) {
                curCardValue = 1;
            }
        }

        let threeLineList = this.getThreeLineType(userCards, curCardValue, MainInterface);
        if (curCardType && curCardType == gameProto.cardType.THREE_LINE) {
            let count = curData ? curData.length : 0;
            threeLineList = threeLineList.filter(item => (count == 0 || count && item.cardList.length == count));
        }

        for (let i = 0; i < threeLineList.length; i++) {
            if (threeLineList[i].cardList.length != 3) {
                continue;
            }
            //排序
            threeLineList[i].cardList.sort((a, b) => {
                return this.getCardLogicValue(a) - this.getCardLogicValue(b)
            });
            let curCard = outCardList.find(item => item.type == gameProto.cardType.THREE_LINE && item.cardList.toString() == threeLineList[i].cardList.toString());
            if (!curCard) {
                let cards = {
                    cardList: threeLineList[i].cardList.slice(),
                    type: gameProto.cardType.THREE_LINE
                };
                outCardList.push(cards);
            }

        }
        //逢人配数据组合
        if (MainInterfaceList && MainInterfaceList.AdaptiveSum >= 2) {

            let curCountList = countList.filter(item => item.count >= 1 && item.card != this.getCardLogicValue(MainInterfaceList.AdaptiveArr[0]));
            curCountList.sort((a, b) => {
                return a.card - b.card
            });
            for (let i = 0; i < curCountList.length; i++) {
                let cardValue = parseInt(curCountList[i].card);
                if (cardValue >= 15 || cardValue <= curCardValue) continue;
                let cardList = [];
                let nextCard = userCards.filter(item => this.getCardLogicValue(item) == curCountList[i].card).slice(0, 1);
                cardList.push(nextCard[0]);
                cardList.push(MainInterfaceList.AdaptiveArr[0]);
                cardList.push(MainInterfaceList.AdaptiveArr[0]);
                //排序
                cardList.sort((a, b) => {
                    return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                });
                let curCard = outCardList.find(item => item.type == gameProto.cardType.THREE_LINE && item.cardList.toString() == cardList.toString());
                if (!curCard) {
                    let cards = {
                        cardList: cardList.slice(),
                        type: gameProto.cardType.THREE_LINE
                    };
                    outCardList.push(cards);
                }
            }
        }
        //逢人配数据组合
        if (MainInterfaceList && MainInterfaceList.AdaptiveSum >= 1) {
            let curCountList = countList.filter(item => item.count >= 2 && item.card != this.getCardLogicValue(MainInterfaceList.AdaptiveArr[0]));
            curCountList.sort((a, b) => {
                return a.card - b.card
            });
            for (let i = 0; i < curCountList.length; i++) {
                let cardValue = parseInt(curCountList[i].card);
                if (cardValue >= 15 || cardValue <= curCardValue) continue;
                let cardList = [];
                let nextCard = userCards.filter(item => this.getCardLogicValue(item) == curCountList[i].card).slice(0, 2);
                cardList.push(nextCard[0]);
                cardList.push(nextCard[1]);
                cardList.push(MainInterfaceList.AdaptiveArr[0]);
                //排序
                cardList.sort((a, b) => {
                    return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                });
                let curCard = outCardList.find(item => item.type == gameProto.cardType.THREE_LINE && item.cardList.toString() == cardList.toString());
                if (!curCard) {
                    let cards = {
                        cardList: cardList.slice(),
                        type: gameProto.cardType.THREE_LINE
                    };
                    outCardList.push(cards);
                }

            }
        }
    }

    //三带二
    if (!curCardType || (curCardType && curCardType == gameProto.cardType.THREE_LINE_TAKE_TWO)) {
        //获取到之前已经算出来的 对牌 和三带 进行 钢板和三带二组合 
        let Three_CardList = outCardList.filter(item => item.type == gameProto.cardType.THREE_LINE).slice();
        let Tow_CardList = outCardList.filter(item => item.type == gameProto.cardType.DOUBLE).slice();
        for (let i = 0; i < Three_CardList.length; i++) {
            //组合3带2
            for (let j = 0; j < Tow_CardList.length; j++) {
                let nextcount = MainInterfaceList.AdaptiveSum;
                if (Three_CardList[i].cardList.includes(Tow_CardList[j].cardList[0]) || Three_CardList[i].cardList.includes(Tow_CardList[j].cardList[1])) {
                    continue;
                }
                //整合数据
                let lincardList = Three_CardList[i].cardList.concat(Tow_CardList[j].cardList);
                //遍历牌组 如果有逢人配 减一
                for (let index = 0; index < lincardList.length; index++) {
                    if (lincardList[index] == MainInterfaceList.AdaptiveArr[0]) {
                        nextcount--;
                    }
                }
                if (lincardList && lincardList.length == 5 && nextcount >= 0) {
                    //排序
                    lincardList.sort((a, b) => {
                        return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                    });
                    let curCard = outCardList.find(item => item.type == gameProto.cardType.THREE_LINE_TAKE_TWO && item.cardList.toString() == lincardList.toString());
                    if (!curCard) {
                        let cards = {
                            cardList: lincardList.slice(),
                            type: gameProto.cardType.THREE_LINE_TAKE_TWO
                        };
                        outCardList.push(cards);
                    }
                }
            }
        }
        if (curCardType && curData && curData.length > 0) {
            outCardList = outCardList.filter(item => item.type == gameProto.cardType.THREE_LINE_TAKE_TWO);
            if (!outCardList || outCardList.length <= 0) {
                outCardList = [];
            }
        }
    }

    //钢板
    if (!curCardType || (curCardType && curCardType == gameProto.cardType.STEEL_PLATE)) {
        //获取到之前已经算出来的三带 进行 钢板组合 
        let Three_CardList = outCardList.filter(item => item.type == gameProto.cardType.THREE_LINE).slice();
        if (curCardType) {
            outCardList = [];
        }
        //组合
        for (let i = 0; i < Three_CardList.length; i++) {
            //组合钢板
            let steel_Plate = [];
            for (let k = 0; k < Three_CardList.length; k++) {
                for (let l = 0; l < Three_CardList[k].cardList.length; l++) {
                    if (Three_CardList[k].cardList[l] == MainInterfaceList.AdaptiveArr[0] || Three_CardList[i].cardList[l] == MainInterfaceList.AdaptiveArr[0]) {
                        continue;
                    }
                    if ((this.getCardLogicValue(Three_CardList[k].cardList[l]) + 1) == this.getCardLogicValue(Three_CardList[i].cardList[l])) {
                        steel_Plate.push(Three_CardList[k]);
                        break;
                    }
                    if ((this.getCardLogicValue(Three_CardList[k].cardList[l]) - 1) == this.getCardLogicValue(Three_CardList[i].cardList[l])) {
                        steel_Plate.push(Three_CardList[k]);
                        break;
                    }
                }
            }

            if (steel_Plate && steel_Plate.length > 0) {
                for (let j = 0; j < steel_Plate.length; j++) {
                    let nextcount = MainInterfaceList.AdaptiveSum;
                    //整合数据
                    let lincardList = Three_CardList[i].cardList.concat(steel_Plate[j].cardList);
                    //遍历牌组 如果有逢人配 减一
                    for (let index = 0; index < lincardList.length; index++) {
                        if (lincardList[index] == MainInterfaceList.AdaptiveArr[0]) {
                            nextcount--;
                        }
                    }
                    if (lincardList && lincardList.length == 6 && nextcount >= 0) {
                        //排序
                        lincardList.sort((a, b) => {
                            return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                        });
                        let curCard = outCardList.find(item => item.type == gameProto.cardType.STEEL_PLATE && item.cardList.toString() == lincardList.toString());
                        if (!curCard) {
                            let cards = {
                                cardList: lincardList.slice(),
                                type: gameProto.cardType.STEEL_PLATE
                            };
                            outCardList.push(cards);
                        }
                    }
                }
            }
        }


    }
    //炸弹判断
    for (let key in cardCount) {
        if (cardCount[key] >= 4) {
            //有4个的炸弹
            if (!curCardType || (curCardType && curCardType < gameProto.cardType.BOMB_CARD)) {
                let cardList = userCards.filter(item => this.getCardLogicValue(item) == key);
                let cards = {
                    cardList: cardList.slice(),
                    type: gameProto.cardType.BOMB_CARD
                };
                outCardList.push(cards);
            } else if (curCardType == gameProto.cardType.BOMB_CARD) {
                let curCardValue = this.getCardLogicValue(this.getMinValue(curData, null, MainInterface), MainInterface);
                let cardList = userCards.filter(item => this.getCardLogicValue(item) == key);
                let keyCardValue = this.getCardLogicValue(key, MainInterface);
                if ((keyCardValue > curCardValue && cardList.length >= curData.length) || cardList.length > curData.length) {
                    let cards = {
                        cardList: cardList.slice(),
                        type: gameProto.cardType.BOMB_CARD
                    };
                    outCardList.push(cards);
                }
            } else if (curCardType == gameProto.cardType.TONG_HUA_SUN && cardCount[key] >= 6) {
                let cardList = userCards.filter(item => this.getCardLogicValue(item) == key);
                let cards = {
                    cardList: cardList.slice(),
                    type: gameProto.cardType.BOMB_CARD
                };
                outCardList.push(cards);
            }
        }
        if (cardCount[key] + MainInterfaceList.AdaptiveSum >= 4 && MainInterfaceList.AdaptiveSum != 0) {
            if (key > 15) continue;
            for (let i = 0; i <= MainInterfaceList.AdaptiveSum; i++) {
                let cardList = userCards.filter(item => this.getCardLogicValue(item) == key);
                cardList = cardList.concat(MainInterfaceList.AdaptiveArr.slice(0, i));
                if (curCardType && (curCardType == gameProto.cardType.BOMB_CARD || curCardType == gameProto.cardType.TONG_HUA_SUN) && cardList.length < curData.length) {
                    continue;
                }
                let nextcount = MainInterfaceList.AdaptiveSum;
                //遍历牌组 如果有逢人配 减一
                for (let index = 0; index < cardList.length; index++) {
                    if (cardList[index] == MainInterfaceList.AdaptiveArr[0]) {
                        nextcount--;
                    }
                }
                //排序
                cardList.sort((a, b) => {
                    return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                });
                let curCard = outCardList.find(item => item.type == gameProto.cardType.BOMB_CARD && item.cardList.toString() == cardList.toString());

                let curCardValue = 0;
                if (curData && curData[0] && curCardType == gameProto.cardType.BOMB_CARD) {
                    //curCardValue = this.getCardLogicValue(curData[0], MainInterface);
                    curCardValue = parseInt(this.getMinValue(curData, null, MainInterface))
                }
                let keyCardValue = this.getCardLogicValue(key, MainInterface);
                let ISTongHuaShun = true;
                if (curCardType && curCardType == gameProto.cardType.TONG_HUA_SUN) {
                    ISTongHuaShun = false;
                }
                if (!curCard && cardList.length >= 4 && nextcount >= 0 && ((keyCardValue > curCardValue && ISTongHuaShun) || cardList.length > curData.length)) {
                    let cards = {
                        cardList: cardList.slice(),
                        type: gameProto.cardType.BOMB_CARD
                    };
                    outCardList.push(cards);
                }
            }

        }
    }
    //同花顺炸弹判断
    let count = curData ? curData.length : 0;

    let TONGoutCardList = [];
    let curCardValue = 0;
    let ISMaxValue = false;
    if (curCardType && curCardType == gameProto.cardType.TONG_HUA_SUN) {
        curCardValue = parseInt(this.getMinValue(curData, null, MainInterface))
        let SunMaxValue = this.getSunMaxValue(curData, MainInterface);
        if (SunMaxValue == 14 && (this.getCardLogicValue(curData[0]) == 2 || this.getCardLogicValue(curData[1]) == 3 || this.getCardLogicValue(curData[2]) == 4)) {
            curCardValue = 1;
        } else if (SunMaxValue == 14) {
            ISMaxValue = true;
        }
    }
    for (let i = 0; i < userCards.length; i++) {
        let cardValue = parseInt(this.getCardLogicValue(userCards[i]));
        if (cardValue >= 15 || cardValue <= curCardValue || ISMaxValue) continue;
        let curCard = userCards[i];
        let cardList = [curCard];
        //同花顺逢人配数量及牌
        let SINGLE_LINEList = this.getAdaptive(userCards.slice(), MainInterface);
        //判断是否有连续的
        for (let k = 0; k < userCards.length; k++) {
            let nextCardValue = parseInt(this.getCardLogicValue(userCards[k]));
            //特殊算法 当下一位为2时 A变为1 计算A 2 3 4 5 可能性 
            if (nextCardValue == 2 && cardValue == 14 && cardList.length == 1) {
                cardValue = 1;
            }
            let nextCard = userCards.find(item => this.getCardLogicValue(item) == (cardValue + 1) && (this.getCardColor(item) / 10) == (this.getCardColor(curCard) / 10));
            if (!nextCard) {
                if (SINGLE_LINEList && SINGLE_LINEList.AdaptiveSum > 0) {
                    cardList.push(MainInterfaceList.AdaptiveArr[0]);
                    SINGLE_LINEList.AdaptiveSum--;
                    cardValue += 1;
                } else {
                    break;
                }
            } else {
                cardList.push(nextCard);
                cardValue += 1;
            }
            //if ((nextCardValue == cardValue + 1)) {
            if (cardList.length == 5) {
                if (MainInterfaceList && MainInterfaceList.AdaptiveSum > 0) {
                    //遍历牌组 如果已有逢人配 减一
                    let AdaptiveList = cardList.slice();
                    let AdaptiveSum = MainInterfaceList.AdaptiveSum;
                    for (let index = 0; index < AdaptiveList.length; index++) {
                        if (AdaptiveList[index] == MainInterfaceList.AdaptiveArr[0]) {
                            AdaptiveSum--;
                        }
                    }
                    //逢人配小于0
                    if (AdaptiveSum < 0) {
                        break;
                    }
                }
                //排序
                cardList.sort((a, b) => {
                    return this.getCardLogicValue(a) - this.getCardLogicValue(b)
                });
                let curCards = TONGoutCardList.find(item => item.type == gameProto.cardType.SINGLE_LINE && item.cardList.toString() == cardList.toString());
                if (!curCards) {
                    let cards = {
                        cardList: cardList.slice(),
                        type: gameProto.cardType.SINGLE_LINE
                    };
                    TONGoutCardList.push(cards);
                    i = -1;
                    break;
                }
            }
            //}
        }
    }
    //6张以上的炸弹 同花顺不可炸
    if (curCardType && curCardType == gameProto.cardType.BOMB_CARD && count >= 6) {
        TONGoutCardList = [];
    }
    //获取到之前已经算出来的 单顺
    let Straight_Flush = TONGoutCardList.filter(item => item.type == gameProto.cardType.SINGLE_LINE).slice();
    if (Straight_Flush && Straight_Flush.length > 0) {
        //遍历所有牌 花色是否相同
        for (let i = 0; i < Straight_Flush.length; i++) {
            let Colour = true;
            for (let j = 1; j < Straight_Flush[i].cardList.length; j++) {
                let Colour_to = parseInt((this.getCardColor(Straight_Flush[i].cardList[j - 1])) / 10);
                let Colour_two = parseInt((this.getCardColor(Straight_Flush[i].cardList[j])) / 10);
                if (Straight_Flush[i].cardList[j - 1] == MainInterfaceList.AdaptiveArr[0] ||
                    Straight_Flush[i].cardList[j] == MainInterfaceList.AdaptiveArr[0]) continue;
                if (Colour_to != Colour_two) {
                    Colour = false;
                    break;
                }
            }
            if (Colour) {
                //排序
                Straight_Flush[i].cardList.sort((a, b) => {
                    return a - b
                })
                //let lincardData = this.getCardLogicValue(Straight_Flush[i].cardList[0]);
                let lincardData = parseInt(this.getMinValue(Straight_Flush[i].cardList, null, MainInterface))
                let nextCard = Straight_Flush[i].cardList.find(item => this.getCardLogicValue(item) == 3 || this.getCardLogicValue(item) == 5);
                if (lincardData == 14 && nextCard) {
                    lincardData = 1;
                }
                let curCard = outCardList.find(item => item.type == gameProto.cardType.TONG_HUA_SUN && item.cardList.toString() == Straight_Flush[i].cardList.toString());
                if (!curCard && Straight_Flush[i].cardList.length == 5 && lincardData > curCardValue) {
                    let cards = {
                        cardList: Straight_Flush[i].cardList.slice(),
                        type: gameProto.cardType.TONG_HUA_SUN
                    };
                    outCardList.push(cards);
                }
            }
        }
    }
    let wangList = countList.filter(item => item.card > 15);
    if (wangList && wangList[1] && wangList[0].count == 2 && wangList[1].count == 2) {
        //天炸
        let cardList = userCards.filter(item => this.getCardLogicValue(item) > 15);
        let cards = {
            cardList,
            type: gameProto.cardType.TIAN_WANG_BOMB
        };
        outCardList.push(cards);
    }
    return outCardList;
}

//比较卡牌是否可以出
logic.compareCard = function (curData, lastData, gameRule, MainInterface = null) {

    let result = {
        isSuccess: true,
        errMsg: null
    };

    let curType = this.getCardType(curData, gameRule, MainInterface);
    let lastType = this.getCardType(lastData, gameRule, MainInterface);
    curData.sort((a, b) => {
        return this.getCardLogicValue(b) - this.getCardLogicValue(a)
    });
    if (lastData) {
        lastData.sort((a, b) => {
            return this.getCardLogicValue(b) - this.getCardLogicValue(a)
        });
    }
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
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_WANG_BOMB || curType == gameProto.cardType.TONG_HUA_SUN) {
            return result;
        } else if (curType == gameProto.cardType.SINGLE) {
            //单张比较
            let curCard = this.getCardLogicValue(curData[0], MainInterface);
            let lastCard = this.getCardLogicValue(lastData[0], MainInterface);
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
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_WANG_BOMB || curType == gameProto.cardType.TONG_HUA_SUN) {
            return result;
        } else if (curType == gameProto.cardType.DOUBLE) {
            //单张比较
            let curCard = this.getCardLogicValue(curData[0], MainInterface);
            let lastCard = this.getCardLogicValue(lastData[0], MainInterface);
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
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_WANG_BOMB || curType == gameProto.cardType.TONG_HUA_SUN) {
            return result;
        } else if (curType == gameProto.cardType.THREE_LINE) {
            //单张比较
            let curCard = this.getCardLogicValue(curData[0], MainInterface);
            let lastCard = this.getCardLogicValue(lastData[0], MainInterface);
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
    //三带二
    else if (lastType == gameProto.cardType.THREE_LINE_TAKE_TWO) {
        //炸弹
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_WANG_BOMB || curType == gameProto.cardType.TONG_HUA_SUN) {
            return result;
        } else if (curType == gameProto.cardType.THREE_LINE_TAKE_TWO) {
            //三带二比较3张
            let curCardResult = this.getCardsAndCount(curData.slice());
            let lastCardResult = this.getCardsAndCount(lastData.slice());
            let curCard = curCardResult.countList.find(item => item.count == 3);
            if (curCard) {
                curCard = curCard.card;
            } else {
                for (let index in curCardResult.countList) {
                    if (!curCard || parseInt(curCardResult.countList[index].card) > parseInt(curCard)) {
                        curCard = curCardResult.countList[index].card;
                    }

                }
            }
            if (curCard == MainInterface) {
                curCard = 15;
            }
            let lastCard = lastCardResult.countList.find(item => item.count == 3);
            if (lastCard) {
                lastCard = lastCard.card;
            } else {
                for (let index in lastCardResult.countList) {
                    if (!lastCard || parseInt(lastCardResult.countList[index].card) > parseInt(lastCard)) {
                        lastCard = lastCardResult.countList[index].card;
                    }

                }
            }
            if (lastCard == MainInterface) {
                lastCard = 15;
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
    //单连
    else if (lastType == gameProto.cardType.SINGLE_LINE) {
        //炸弹
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_WANG_BOMB || curType == gameProto.cardType.TONG_HUA_SUN) {
            return result;
        } else if (curType == gameProto.cardType.SINGLE_LINE && curData.length == lastData.length) {
            //单连比较单张
            let curCard = 0;
            let lastCard = 0;
            curData.sort((a, b) => {
                return this.getCardLogicValue(b) - this.getCardLogicValue(a)
            });
            lastData.sort((a, b) => {
                return this.getCardLogicValue(b) - this.getCardLogicValue(a)
            });

            //当前牌的最大值
            curCard = this.getSunMaxValue(curData, MainInterface);
            // for (let i = 0; i < curData.length; i++) {
            //     if (this.getCardLogicValue(curData[i]) > curCard) {
            //         curCard = this.getCardLogicValue(curData[i])
            //     }
            // }
            if (curCard == 14 && this.getCardLogicValue(curData[1]) == 5) {
                curCard = 5;
            }
            //上次出牌的最大值
            lastCard = this.getSunMaxValue(lastData, MainInterface);
            // for (let i = 0; i < lastData.length; i++) {
            //     if (this.getCardLogicValue(lastData[i]) > lastCard) {
            //         lastCard = this.getCardLogicValue(lastData[i])
            //     }
            // }
            if (lastCard == 14 && this.getCardLogicValue(lastData[1]) == 5) {
                lastCard = 5;
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
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_WANG_BOMB || curType == gameProto.cardType.TONG_HUA_SUN) {
            return result;
        } else if (curType == gameProto.cardType.DOUBLE_LINE && curData.length == lastData.length) {
            //对连比较大小
            let curCardData = [];
            let lastCardData = [];
            //获取去掉癞子
            for (let i = 0; i < curData.length; i++) {
                if (curData[i] != (MainInterface + 32)) {
                    curCardData.push(curData[i]);
                }
            }
            //获取去掉癞子
            for (let i = 0; i < lastData.length; i++) {
                if (lastData[i] != (MainInterface + 32)) {
                    lastCardData.push(lastData[i]);
                }
            }
            curCardData.sort((a, b) => {
                return this.getCardLogicValue(b) - this.getCardLogicValue(a)
            });
            lastCardData.sort((a, b) => {
                return this.getCardLogicValue(b) - this.getCardLogicValue(a)
            });
            //当前出牌的最大值
            let curCard = this.getSunMaxValue(curData, MainInterface);
            if (curCard == 14 && (this.getCardLogicValue(curCardData[curCardData.length - 1]) == 2 || this.getCardLogicValue(curCardData[curCardData.length - 1]) == 3)) {
                curCard = 3;
            }
            //上次出牌的最大值
            let lastCard = this.getSunMaxValue(lastData, MainInterface);
            if (lastCard == 14 && (this.getCardLogicValue(lastCardData[lastCardData.length - 1]) == 2 || this.getCardLogicValue(lastCardData[lastCardData.length - 1]) == 3)) {
                lastCard = 3;
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
    //钢板 
    else if (lastType == gameProto.cardType.STEEL_PLATE) {
        //炸弹
        if (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TIAN_WANG_BOMB || curType == gameProto.cardType.TONG_HUA_SUN) {
            return result;
        } else if (curType == gameProto.cardType.STEEL_PLATE && curData.length == lastData.length) {
            //钢板比较大小
            let curCardData = [];
            let lastCardData = [];
            //获取去掉癞子
            for (let i = 0; i < curData.length; i++) {
                if (curData[i] != (MainInterface + 32)) {
                    curCardData.push(curData[i]);
                }
            }
            //获取去掉癞子
            for (let i = 0; i < lastData.length; i++) {
                if (lastData[i] != (MainInterface + 32)) {
                    lastCardData.push(lastData[i]);
                }
            }
            curCardData.sort((a, b) => {
                return this.getCardLogicValue(b) - this.getCardLogicValue(a)
            });
            lastCardData.sort((a, b) => {
                return this.getCardLogicValue(b) - this.getCardLogicValue(a)
            });
            //当前牌的最大值
            let curCard = this.getSunMaxValue(curData, MainInterface);
            //AAA 222 按最小算
            if (curCard == 14 && this.getCardLogicValue(curCardData[curCardData.length - 1]) == 2) {
                curCard = 1;
            }
            //上次出牌的最大值
            let lastCard = this.getSunMaxValue(lastData, MainInterface);
            if (lastCard == 14 && this.getCardLogicValue(lastCardData[lastCardData.length - 1]) == 2) {
                lastCard = 1;
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
            result.errMsg = '只能出钢板';
            return result;
        }
    }
    //炸弹
    else if (lastType == gameProto.cardType.BOMB_CARD || lastType == gameProto.cardType.TONG_HUA_SUN) {
        //炸弹
        if (curType == gameProto.cardType.TIAN_WANG_BOMB) {
            return result;
        } else if (curData.length > lastData.length && (curType == gameProto.cardType.BOMB_CARD || curType == gameProto.cardType.TONG_HUA_SUN)) {
            return result;
        } else if (lastType == gameProto.cardType.TONG_HUA_SUN && curType == gameProto.cardType.BOMB_CARD) {
            //同长度 同花顺炸弹大
            if (curData.length > lastData.length) {
                return result;
            } else {
                result.isSuccess = false;
                result.errMsg = '出牌必须大于上家';
                return result;
            }
        } else if (curType == gameProto.cardType.TONG_HUA_SUN && lastType == gameProto.cardType.BOMB_CARD) {
            //同长度 同花顺炸弹大
            if (curData.length >= lastData.length) {
                return result;
            } else {
                result.isSuccess = false;
                result.errMsg = '出牌必须大于上家';
                return result;
            }
        } else if ((curType == gameProto.cardType.BOMB_CARD && curData.length == lastData.length) ||
            (curType == gameProto.cardType.TONG_HUA_SUN && curData.length > lastData.length) ||
            (curType == gameProto.cardType.TONG_HUA_SUN && lastType == gameProto.cardType.TONG_HUA_SUN)) {
            //单张比较
            //let curCard = this.getCardLogicValue(curData[0], MainInterface);
            //let lastCard = this.getCardLogicValue(lastData[0], MainInterface);
            let curCardData = [];
            let lastCardData = [];
            //获取去掉癞子
            for (let i = 0; i < curData.length; i++) {
                if (curData[i] != (MainInterface + 32)) {
                    curCardData.push(curData[i]);
                }
            }
            //获取去掉癞子
            for (let i = 0; i < lastData.length; i++) {
                if (lastData[i] != (MainInterface + 32)) {
                    lastCardData.push(lastData[i]);
                }
            }
            curCardData.sort((a, b) => {
                return this.getCardLogicValue(b) - this.getCardLogicValue(a)
            });
            lastCardData.sort((a, b) => {
                return this.getCardLogicValue(b) - this.getCardLogicValue(a)
            });
            //当前牌的最大值
            let curCard = this.getSunMaxValue(curData, MainInterface);
            //A,2,3,4,5 按最小算
            if (curCard == 14 && this.getCardLogicValue(curCardData[curCardData.length - 1]) <= 5) {
                curCard = 1;
            }
            if (curCard == MainInterface) {
                curCard = this.getCardLogicValue(curCard, MainInterface);
            }
            //上次出牌的最大值
            let lastCard = this.getSunMaxValue(lastData, MainInterface);
            if (lastCard == 14 && this.getCardLogicValue(lastCardData[lastCardData.length - 1]) <= 5) {
                lastCard = 1;
            }
            if (lastCard == MainInterface) {
                lastCard = this.getCardLogicValue(lastCard, MainInterface);
            }
            //let curCard = this.getSunMaxValue(curData, MainInterface);
            //let lastCard = this.getSunMaxValue(lastData, MainInterface);
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
    } else if (lastType == gameProto.cardType.TIAN_WANG_BOMB) {
        //天炸最大
        result.isSuccess = false;
        result.errMsg = '出牌必须大于上家';
        return result;
    }

}

//获取卡牌的类型
logic.getCardType = function (cardDataArr, gameRule, MainInterface = null) {

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
        if (this.getCardLogicValue(cardDataArr[0], MainInterface) === this.getCardLogicValue(cardDataArr[1], MainInterface)) {
            return gameProto.cardType.DOUBLE;
        } else if (this.getCardLogicValue(cardDataArr[0]) == MainInterface || this.getCardLogicValue(cardDataArr[1]) == MainInterface) {
            return gameProto.cardType.DOUBLE;
        }
        return gameProto.cardType.ERROR;
    } else {

        let {
            cardCount,
            countList
        } = this.getCardsAndCount(cardDataArr);
        //判断是否为天王炸弹
        if (cardDataArr.length == 4 && this.isTWBoom(countList, cardDataArr, MainInterface)) {
            return gameProto.cardType.TIAN_WANG_BOMB;
        }
        //判断是否炸弹
        if (cardDataArr.length >= 4 && this.isBoom(countList, cardDataArr, MainInterface)) {
            return gameProto.cardType.BOMB_CARD;
        }
        //判断是否同花顺炸弹
        if (cardDataArr.length >= 4 && this.isTongBoom(cardDataArr, countList, gameRule, MainInterface)) {
            return gameProto.cardType.TONG_HUA_SUN;
        }
        //是否单连子
        if (cardDataArr.length == 5 && this.isDanLian(cardDataArr, countList, gameRule, MainInterface)) {
            return gameProto.cardType.SINGLE_LINE;
        }
        //是否三不带
        if (cardDataArr.length == 3 && this.isSanBuDai(cardDataArr, countList, MainInterface)) {
            return gameProto.cardType.THREE_LINE;
        }
        //是否钢板
        if (cardDataArr.length == 6 && this.isGangBan(cardDataArr, countList, MainInterface)) {
            return gameProto.cardType.STEEL_PLATE;
        }
        //三代二
        if (cardDataArr.length == 5 && this.isSanDaiEr(countList, gameRule, cardDataArr, MainInterface)) {
            return gameProto.cardType.THREE_LINE_TAKE_TWO;
        }
        //对连
        if (cardDataArr.length == 6 && cardDataArr.length % 2 == 0 && this.isDuiLian(countList, gameRule, cardDataArr, MainInterface)) {
            return gameProto.cardType.DOUBLE_LINE;
        }
        //默认无牌型
        return gameProto.cardType.ERROR;
    }

}

//是否三带二
logic.isSanDaiEr = function (countList, gameRule, cardDataArr, MainInterface) {

    let isCardType = false;
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
        } else if (curData.count == 2) {
            duiCount += 1;
        }
    }
    if ((sanCount == totalCount / 5) && totalCount == sanCount * 3 + duiCount * 2) {
        isCardType = true;
    }

    if (MainInterface && !isCardType) {
        let getAdaptive = this.getAdaptive(cardDataArr, MainInterface);
        if (getAdaptive.AdaptiveSum <= 0) {
            return isCardType;
        }
        let {
            cardCount,
            countList
        } = this.getCardsAndCount(cardDataArr, MainInterface);
        countList.sort((a, b) => {
            return a.card - b.card
        });
        let Three_Count = countList.filter(item => item.count == 3);
        let Tow_Count = countList.filter(item => item.count == 2);
        let On_Count = countList.filter(item => item.count == 1);
        let List_Shu = 0;
        if (Three_Count.length == 0 && Tow_Count.length > 0) {
            getAdaptive.AdaptiveSum--;
            Tow_Count.shift();
            List_Shu++;
        }
        if (Tow_Count.length == 0 && On_Count.length > 0) {
            getAdaptive.AdaptiveSum--;
            On_Count.shift();
            List_Shu++;
        }
        if (Three_Count.length == 1) {
            List_Shu++;
        }
        if (Tow_Count.length == 1) {
            List_Shu++;
        }
        if (List_Shu != 2) {
            return isCardType;
        }
        if (getAdaptive.AdaptiveSum >= 0) {
            isCardType = true;
        }
    }
    return isCardType;
}


//是否对连
logic.isDuiLian = function (countList, gameRule, cardDataArr, MainInterface) {

    let isCardType = false;
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
    if (!isCardType) {
        let getAdaptive = this.getAdaptive(cardDataArr, MainInterface);
        let {
            cardCount,
            countList
        } = this.getCardsAndCount(cardDataArr, MainInterface);
        countList.sort((a, b) => {
            return a.card - b.card
        });
        isCardType = false;
        totalCount = 0;
        duiCount = 0;
        cardValue = [];
        let AdaptiveSum = getAdaptive.AdaptiveSum;
        for (let i = 0; i < countList.length; i++) {
            let curData = countList[i];
            totalCount += curData.count;
            cardValue.push(curData.card);
            if (curData.count == 2) {
                duiCount += 1;
            } else if (curData.count < 2 && AdaptiveSum > 0) {
                AdaptiveSum = AdaptiveSum - curData.count;
                duiCount += 1;
            }
        }
        let isLianXu = this.isContinuous(cardValue, MainInterface);
        if (isLianXu && (totalCount + getAdaptive.AdaptiveSum) == duiCount * 2) {
            isCardType = true;
        }
    }
    return isCardType;

}

//连子5个起连
logic.isDanLian = function (cardData, countList, gameRule, MainInterface = null) {

    let curCardList = [];
    for (let i = 0; i < cardData.length; i++) {
        //不记录主牌
        if (MainInterface != null && this.getCardValue(cardData[i]) == MainInterface && parseInt((this.getCardColor(cardData[i])) / 10) == 3) {
            continue;
        }
        curCardList.push(this.getCardLogicValue(cardData[i]));
    }

    //如果有不是单牌的
    if (curCardList.find(item => item.count > 1)) {
        return false;
    }

    //连牌不能带王
    if (curCardList.includes(16)) {
        return false;
    }

    //返回是否顺子
    return this.isContinuous(cardData, MainInterface);

}
//是否天王炸弹
logic.isTWBoom = function (countList) {

    let isCardType = false;
    //2个小王2个大王
    if (countList.length == 2 && countList[0].count == 2 && countList[1].count == 2 && countList[0].card == this.getCardLogicValue(0x4E) && countList[1].card == this.getCardLogicValue(0x4F)) {
        isCardType = true;
    }
    return isCardType;
}
//是否炸弹
logic.isBoom = function (countList, cardDataArr, MainInterface = null) {

    let isCardType = false;
    //4个相同的牌就是炸弹
    if (countList.length == 1 && countList[0].count == cardDataArr.length) {
        isCardType = true;
    }
    //带主牌计算
    if (!isCardType) {
        let getAdaptive = this.getAdaptive(cardDataArr, MainInterface);
        let {
            cardCount,
            countList
        } = this.getCardsAndCount(cardDataArr, MainInterface);
        for (let index = 0; index < countList.length; index++) {
            if (countList[index].count + getAdaptive.AdaptiveSum == cardDataArr.length) {
                isCardType = true;
                break;
            }
        }
    }
    return isCardType;
}
//是否同花顺炸弹
logic.isTongBoom = function (cardData, countList, gameRule, MainInterface = null) {

    let curCardList = [];
    for (let i = 0; i < cardData.length; i++) {
        //不记录主牌
        if (MainInterface != null && this.getCardValue(cardData[i]) == MainInterface && parseInt((this.getCardColor(cardData[i])) / 10) == 3) {
            continue;
        }
        if (MainInterface != null && this.getCardValue(cardData[i + 1]) == MainInterface && parseInt((this.getCardColor(cardData[i + 1])) / 10) == 3) {
            continue;
        }
        //校验花色
        if (cardData[i + 1] && parseInt((this.getCardColor(cardData[i])) / 10) != parseInt((this.getCardColor(cardData[i + 1])) / 10)) {
            return false;
        }
        curCardList.push(this.getCardLogicValue(cardData[i], MainInterface));
    }

    //如果有不是单牌的
    if (curCardList.find(item => item.count > 1)) {
        return false;
    }

    //连牌不能带王
    if (curCardList.includes(16)) {
        return false;
    }

    //返回是否顺子
    return this.isContinuous(cardData, MainInterface);
}
//是否是天炸
logic.isTianZha = function (countList) {

    let isCardType = false;
    //3个A
    // if (countList.length == 1 && countList[0].count == 3 && countList[0].card == 14) {
    //     isCardType = true;
    // }
    if (countList.length == 1 && countList[0].count == 4 && countList.indexOf(0x4E) != -1 && countList.indexOf(0x4F) != -1) {
        isCardType = true;
    }
    return isCardType;

}

//是否三不带
logic.isSanBuDai = function (cardDataArr, countList, MainInterface = null) {
    if (cardDataArr.length != 3) {
        return false
    }
    let isCardType = true;
    for (let i = 0; i < countList.length; i++) {
        if (countList[i].count != 3) {
            isCardType = false;
            break;
        }
    }
    if (MainInterface && !isCardType) {
        let getAdaptive = this.getAdaptive(cardDataArr, MainInterface);
        let {
            cardCount,
            countList
        } = this.getCardsAndCount(cardDataArr, MainInterface);
        for (let index = 0; index < countList.length; index++) {
            if (countList[index].count + getAdaptive.AdaptiveSum == 3) {
                isCardType = true;
            }
        }
    }
    return isCardType;
}
//是否钢板
logic.isGangBan = function (cardDataArr, countList, MainInterface = null) {
    if (cardDataArr.length != 6) {
        return false;
    }
    let isCardType = true;
    for (let i = 0; i < countList.length; i++) {
        if (countList[i].count != 3) {
            isCardType = false;
            break;
        }
    }
    if (MainInterface && !isCardType) {
        let getAdaptive = this.getAdaptive(cardDataArr, MainInterface);
        let {
            cardCount,
            countList
        } = this.getCardsAndCount(cardDataArr, MainInterface);
        for (let i = 0; i < countList.length; i++) {
            if (countList[i].count < 3 && countList[i].count + getAdaptive.AdaptiveSum >= 3) {
                getAdaptive.AdaptiveSum -= (3 - countList[i].count);
                isCardType = true;
            } else if (countList[i].count == 3) {
                isCardType = true;
            } else {
                isCardType = false;
                break;
            }
        }
        if (getAdaptive.AdaptiveSum < 0) {
            isCardType = false;
        }
    }
    return isCardType;
}
//获取卡牌的值和数量
logic.getCardsAndCount = function (cardData, MainInterface = null) {

    let cardCount = {};
    for (let i = 0; i < cardData.length; i++) {
        //参数跟升级牌花色一样不记录
        if (MainInterface != null && this.getCardValue(cardData[i]) == MainInterface && parseInt((this.getCardColor(cardData[i])) / 10) == 3) {
            continue;
        }
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
logic.isContinuous = function (cardData, MainInterface = null) {
    let getAdaptive = this.getAdaptive(cardData, MainInterface);
    // let curCards = cardData.map(item => {
    //     return this.getCardLogicValue(item)
    // });
    let curCards = [];
    for (let index = 0; index < cardData.length; index++) {
        if (this.getCardValue(cardData[index]) == MainInterface) {
            if (parseInt((this.getCardColor(cardData[index])) / 10) != 3) {
                curCards.push(this.getCardLogicValue(cardData[index]));
            }
        } else {
            curCards.push(this.getCardLogicValue(cardData[index]));
        }
    }
    //特殊校验 1 2 3 4 5 
    if (cardData.length == 5 || cardData.length == 3) {
        let ISshun = true;
        let ISshuncardData = [];
        for (let i = 0; i < curCards.length; i++) {
            let lincardData = this.getCardLogicValue(curCards[i]);
            if (lincardData == 14) {
                lincardData = 1;
            }
            ISshuncardData.push(lincardData);
        }
        ISshuncardData.sort((a, b) => {
            return a - b;
        });

        let AdaptiveSum = 0;
        if (getAdaptive && getAdaptive.AdaptiveSum > 0) {
            AdaptiveSum = getAdaptive.AdaptiveSum;
        }
        for (let i = 1; i < ISshuncardData.length; i++) {
            let one_wei = (ISshuncardData[i - 1] + 1);
            let tow_wei = ISshuncardData[i];
            if (one_wei != tow_wei) {
                if (AdaptiveSum > 0) {
                    AdaptiveSum--;
                    ISshuncardData.push(one_wei);
                    ISshuncardData.sort((a, b) => {
                        return a - b;
                    });
                    i = 0;
                } else {
                    ISshun = false;
                    break;
                }
            }

        }
        if (ISshun) {
            return true;
        }
    }

    let curSet = new Set(curCards);
    let curList = Array.from(curSet);

    let maxCard = Math.max(...curList);
    let minCard = Math.min(...curList);

    if (cardData.length <= 4 && cardData.length >= 3 && curList.length == curCards.length && maxCard - minCard <= ((curCards.length - 1) + getAdaptive.AdaptiveSum)) {
        return true;
    }
    if (curList.length == curCards.length && maxCard - minCard <= ((curCards.length - 1) + getAdaptive.AdaptiveSum) && curCards.length + getAdaptive.AdaptiveSum >= 5) {
        return true;
    } else {
        return false;
    }
}

//获取3带的牌型
logic.getThreeLineType = function (userCards, lastCardValue, MainInterface = null) {

    let {
        cardCount,
        countList
    } = this.getCardsAndCount(userCards.slice(), MainInterface);
    //3个的连子
    let threeLineResult = countList.filter(item => item.count >= 3 && this.getCardLogicValue(item.card, MainInterface) > parseInt(lastCardValue));
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
logic.arrInArr = function (arr, arr1, MainInterface = null) {

    let isHave = false;
    arr = arr.map(item => {
        return this.getCardLogicValue(item, MainInterface)
    });
    arr1 = arr1.map(item => {
        return this.getCardLogicValue(item, MainInterface)
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
logic.getMinValue = function (curData, maxCount = null, MainInterface = null) {

    let curCardValue = 0;
    let curCardResult = curData ? this.getCardsAndCount(curData, MainInterface) : null;
    if (curCardResult) {
        for (let key in curCardResult.cardCount) {
            if ((maxCount && curCardResult.cardCount[key] == maxCount) || !maxCount) {
                if ((curCardValue == 0 || parseInt(key) < curCardValue)) {
                    curCardValue = parseInt(this.getCardLogicValue(key, MainInterface));
                }
            }
        }
        let getAdaptive = this.getAdaptive(curData, MainInterface);
        if (maxCount == 3 && curCardValue == 0 && getAdaptive && getAdaptive.AdaptiveSum > 0) {
            for (let key in curCardResult.cardCount) {
                if ((maxCount && (curCardResult.cardCount[key] + getAdaptive.AdaptiveSum) == maxCount) || !maxCount) {
                    if ((curCardValue == 0 || parseInt(key) > curCardValue)) {
                        curCardValue = parseInt(this.getCardLogicValue(key, MainInterface));
                    }
                }
            }
        }
    }
    return curCardValue;
}
//获取顺子最大值
logic.getSunMaxValue = function (curData, MainInterface) {
    let getAdaptive = this.getAdaptive(curData, MainInterface);
    //getAdaptive.AdaptiveSum
    let ISshuncardData = curData.slice();
    ISshuncardData.sort((a, b) => {
        return this.getCardLogicValue(a) - this.getCardLogicValue(b);
    });
    if (getAdaptive && getAdaptive.AdaptiveSum > 0) {
        let curCards = [];
        //去掉红桃2
        for (let index = 0; index < ISshuncardData.length; index++) {
            if (this.getCardValue(ISshuncardData[index]) == MainInterface) {
                if (parseInt((this.getCardColor(ISshuncardData[index])) / 10) != 3) {
                    curCards.push(this.getCardLogicValue(ISshuncardData[index]));
                }
            } else {
                curCards.push(this.getCardLogicValue(ISshuncardData[index]));
            }
        }

        let AdaptiveSum = getAdaptive.AdaptiveSum;
        for (let i = 1; i < ISshuncardData.length; i++) {
            let one_wei = (curCards[i - 1] + 1);
            let tow_wei = curCards[i];
            if (one_wei != tow_wei && AdaptiveSum > 0) {
                if (one_wei == 15) {
                    one_wei = (curCards[0] - 1);
                }
                curCards.push(one_wei);
                AdaptiveSum--;
            }
        }
        curCards.sort((a, b) => {
            return this.getCardLogicValue(a) - this.getCardLogicValue(b);
        });
        if (this.isContinuous(curCards, MainInterface)) {
            return this.getCardLogicValue(curCards[curCards.length - 1]);
        }
    }

    return this.getCardLogicValue(ISshuncardData[ISshuncardData.length - 1]);
}