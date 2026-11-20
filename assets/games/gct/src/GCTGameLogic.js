const gameProto = require('./ApiGct');
//数值掩码
const MASK_COLOR = 0xF0; //花色掩码
const MASK_VALUE = 0x0F; //数值掩码

var logic = module.exports;
logic.getCardValue = function (cardData) {
    return cardData & MASK_VALUE;
};

//获取花色
logic.getCardColor = function (cardData) {
    return cardData & MASK_COLOR;
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

logic.getCardLogicValueArr = function (cardDataArr) {
    let arr = [];
    for (let i = 0; i < cardDataArr.length; ++i) {
        arr.push(logic.getCardLogicValue(cardDataArr[i]));
    }
    return arr;
};

logic.getCardValueArr = function (cardDataArr) {
    let arr = [];
    for (let i = 0; i < cardDataArr.length; ++i) {
        arr.push(logic.getCardValue(cardDataArr[i]));
    }
    arr.sort(function (a, b) {
        return (a - b)
    });
    return arr;
};

/*
 * 根据牌，判断先出牌的玩家
 * @param cardsArray Array 玩家手牌数
 * @param exceptID Number 需要刨除的chairID，空位
 * @return Number 先出牌的玩家chairID
 */
logic.getFirstOutChairID = function (cardsArray, exceptID) {
    for (let i = 0x33; i <= 0x3C; ++i) {
        for (let j = i; j >= 0x01; j -= 0x10) {
            for (let k = 0; k < cardsArray.length; ++k) {
                if (k == exceptID) {
                    continue;
                }
                let cards = cardsArray[k];
                if ((cards.indexOf(j) != -1)) {
                    return k;
                }
            }
        }
    }
    return 0;
};

/*
 * 获取牌堆 
 * @param gameType Number 游戏类型
 * @return Array 牌数组
 */
logic.getRandCardList = function (gameType) {
    let cards = [ /* 扑克数据（去掉两王） */
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, //方块 A - K
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, //梅花 A - K
        0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, //红桃 A - K
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, //黑桃 A - K
    ];
    for (let i = 0; i < 100; ++i) {
        let random1 = Math.floor(Math.random() * cards.length);
        let random2 = Math.floor(Math.random() * cards.length);
        if (random1 != random2) {
            let temp = cards[random1];
            cards[random1] = cards[random2];
            cards[random2] = temp;
        }
    }
    return cards;
};


logic.sortCardList = function (cardDataArr, isOrderByCount) {
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
    //数目排序
    if (!!isOrderByCount) {
        //分析扑克
        let analyseResult = this.analyseCardDataArr(cardDataArr);

        cardDataArr = [];
        //拷贝四牌
        cardDataArr = cardDataArr.concat(analyseResult.fourCardData);
        //拷贝三牌
        cardDataArr = cardDataArr.concat(analyseResult.threeCardData);
        //拷贝对牌
        cardDataArr = cardDataArr.concat(analyseResult.doubleCardData);
        //拷贝单牌
        cardDataArr = cardDataArr.concat(analyseResult.singleCardData);
    }
    return cardDataArr;
};

/*
 * 获取牌型
 * @param cardDataArr 牌数组
 * @param gameRule 游戏规则，判断某些特殊牌型
 * @return Number 牌类型
 */
logic.getCardType = function (cardDataArr, gameRule) {
    if (!cardDataArr) {
        return gameProto.cardType.ERROR;
    }
    cardDataArr = cardDataArr.slice();
    logic.sortCardList(cardDataArr);
    let cardCount = cardDataArr.length;
    //简单牌型
    switch (cardCount) {
        case 0: {
            return gameProto.cardType.ERROR;
        }
        case 1: { //单牌
            return gameProto.cardType.SINGLE;
        }
        case 2: { //对牌
            if (this.getCardLogicValue(cardDataArr[0]) === this.getCardLogicValue(cardDataArr[1])) {
                return gameProto.cardType.DOUBLE;
            }
            return gameProto.cardType.ERROR;
        }
    }

    //分析扑克
    let analyseResult = this.analyseCardDataArr(cardDataArr);
    if (!analyseResult) {
        return gameProto.cardType.ERROR;
    }

    // 四牌判断
    if (analyseResult.fourCardData.length > 0) {
        //牌型判断
        if ((analyseResult.fourCardData.length === 4) && (cardCount === 4)) {
            return gameProto.cardType.BOMB_CARD;
        }
        if (analyseResult.fourCardData.length === 4 && cardCount >= 5 && cardCount <= 8) {
            if (cardCount == 6 && gameRule.shuaiWei && gameRule.lastTurn) {
                return gameProto.cardType.FOUR_LINE_TAKE_TWO;
            } else if (cardCount == 7) {
                return gameProto.cardType.FOUR_LINE_TAKE_THREE;
            }
        }
        return gameProto.cardType.ERROR;
    }

    // 三牌判断
    if (analyseResult.threeCardData.length > 0) {
        let threeCount = analyseResult.threeCardData.length / 3;
        let maxLineCount = 1;
        //连牌判断
        if (threeCount > 1) {
            let arr = [];
            for (let i = 0; i < threeCount; ++i) {
                arr.push(this.getCardLogicValue(analyseResult.threeCardData[i * 3]));
            }
            for (let i = 0; i < arr.length; ++i) {
                let count = 1;
                for (let j = i + 1; j < arr.length; ++j) {
                    if (arr[i] == arr[j] + j - i) {
                        ++count;
                    } else if (arr[i] == 15 && arr[j] == 3) {
                        ++count;
                    } else {
                        break;
                    }
                }
                if (count > maxLineCount) {
                    maxLineCount = count;
                }
            }
        }


        //牌形判断
        if (maxLineCount * 3 === cardCount) {
            // if (this.getCardValue(cardDataArr[0]) == 0x01 && gameRule.ThreeABomb) {
            //     return gameProto.cardType.BOMB_CARD;
            // }
            return gameProto.cardType.THREE_LINE;
        }
        if (maxLineCount * 5 === cardCount) {
            return gameProto.cardType.THREE_LINE_TAKE_TWO;
        }
        if (maxLineCount * 4 === cardCount && gameRule.shuaiWei && gameRule.lastTurn) {
            return gameProto.cardType.THREE_LINE_TAKE_ONE;
        }


        return gameProto.cardType.ERROR;
    }

    //两张类型
    if (analyseResult.doubleCardData.length / 2 >= 2) {
        let doubleCount = analyseResult.doubleCardData.length / 2;
        //变量定义
        let singleCard = this.getCardValueArr(analyseResult.doubleCardData);
        //变量定义
        let cardData = singleCard[0];
        let firstLogicValue = cardData;
        //错误过虑
        //if (firstLogicValue > 15) return gameProto.cardType.ERROR;
        //连牌判断
        if (firstLogicValue == 1 && singleCard[singleCard.length - 1] == 13) {
            firstLogicValue = 14;
            for (let i = doubleCount - 1, j = 1; i > 0; i--, j++) {
                let cardData = singleCard[i * 2];
                if (firstLogicValue !== cardData + j)
                    return gameProto.cardType.ERROR;
            }
        } else {
            //连牌判断
            for (let i = 1; i < doubleCount; i++) {
                let cardData = singleCard[i * 2];
                if (firstLogicValue + i !== cardData)
                    return gameProto.cardType.ERROR;
            }
        }
        //二连判断
        if ((doubleCount * 2) === cardCount) return gameProto.cardType.DOUBLE_LINE;
        return gameProto.cardType.ERROR;
    }

    //单张判断
    if ((analyseResult.singleCardData.length >= 3) && (analyseResult.singleCardData.length === cardCount)) {
        let singleCard = this.getCardValueArr(analyseResult.singleCardData);
        //变量定义
        let cardData = singleCard[0];
        let firstLogicValue = cardData;
        //错误过虑
        // if (firstLogicValue>15) return gameProto.cardType.ERROR;
        //A在第一位逆向判断
        if (firstLogicValue == 1 && singleCard[singleCard.length - 1] == 13) {
            firstLogicValue = 14;
            for (let i = singleCard.length - 1, j = 1; i > 0; i--, j++) {
                let cardData = singleCard[i];
                if (firstLogicValue !== cardData + j)
                    return gameProto.cardType.ERROR;
            }
        } else {
            //连牌判断
            for (let i = 1; i < singleCard.length; i++) {
                let cardData = singleCard[i];
                if (firstLogicValue + i !== cardData)
                    return gameProto.cardType.ERROR;
            }
        }

        return gameProto.cardType.SINGLE_LINE;
    }
    return gameProto.cardType.ERROR;
};

logic.analyseCardDataArr = function (cardDataArr) {
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

logic.compareCard = function (firstCardArr, nextCardArr, gameRule, lastTurn) {
    firstCardArr = firstCardArr.slice();
    logic.sortCardList(firstCardArr);
    nextCardArr = nextCardArr.slice();
    logic.sortCardList(nextCardArr);
    //获取类型
    let nextType = this.getCardType(nextCardArr, gameRule);
    //类型判断
    if (nextType === gameProto.cardType.ERROR) {
        return false;
    }
    let firstType = this.getCardType(firstCardArr, gameRule);

    //炸弹判断
    if ((firstType !== gameProto.cardType.BOMB_CARD) && (nextType === gameProto.cardType.BOMB_CARD)) {
        return true;
    }
    if ((firstType === gameProto.cardType.BOMB_CARD) && (nextType !== gameProto.cardType.BOMB_CARD)) {
        return false;
    }

    //规则判断
    if ((nextType == gameProto.cardType.THREE_LINE || nextType == gameProto.cardType.THREE_LINE_TAKE_ONE ||
        nextType == gameProto.cardType.THREE_LINE_TAKE_TWO) && (firstType == gameProto.cardType.THREE_LINE ||
            firstType == gameProto.cardType.THREE_LINE_TAKE_ONE || firstType == gameProto.cardType.THREE_LINE_TAKE_TWO) &&
        lastTurn && !gameRule.baiwei) {
        /* null */
    } else if ((firstType !== nextType) || (firstCardArr.length !== nextCardArr.length)) {
        return false;
    }

    //开始对比
    switch (nextType) {
        case gameProto.cardType.SINGLE:
        case gameProto.cardType.DOUBLE: {
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextCardArr[0]);
            let firstLogicValue = this.getCardLogicValue(firstCardArr[0]);
            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
        case gameProto.cardType.SINGLE_LINE:
        case gameProto.cardType.DOUBLE_LINE: {
            let nextValueArr = this.getCardValueArr(nextCardArr);
            let firstValueArr = this.getCardValueArr(firstCardArr);
            //获取数值
            let nextLogicValue = nextValueArr[0];
            let firstLogicValue = firstValueArr[0];
            if (nextLogicValue == 1)
                nextLogicValue = (nextValueArr[nextValueArr.length - 1] == 13 ? 14 : nextLogicValue);
            if (firstLogicValue == 1)
                firstLogicValue = (firstValueArr[firstValueArr.length - 1] == 13 ? 14 : firstLogicValue);
            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
        case gameProto.cardType.BOMB_CARD: {
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextCardArr[0]);
            let firstLogicValue = this.getCardLogicValue(firstCardArr[0]);
            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
        case gameProto.cardType.THREE_LINE:
        case gameProto.cardType.THREE_LINE_TAKE_ONE:
        case gameProto.cardType.THREE_LINE_TAKE_TWO: {
            //分析扑克
            let nextResult = this.analyseCardDataArr(nextCardArr);
            let firstResult = this.analyseCardDataArr(firstCardArr);
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextResult.threeCardData[0]);
            let firstLogicValue = this.getCardLogicValue(firstResult.threeCardData[0]);
            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
        case gameProto.cardType.FOUR_LINE_TAKE_TWO:
            //分析扑克
            let nextResult = this.analyseCardDataArr(nextCardArr);
            let firstResult = this.analyseCardDataArr(firstCardArr);
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextResult.fourCardData[0]);
            let firstLogicValue = this.getCardLogicValue(firstResult.fourCardData[0]);

            //对比扑克
            return nextLogicValue > firstLogicValue;
        case gameProto.cardType.FOUR_LINE_TAKE_THREE: {
            //分析扑克
            let nextResult = this.analyseCardDataArr(nextCardArr);
            let firstResult = this.analyseCardDataArr(firstCardArr);
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextResult.fourCardData[0]);
            let firstLogicValue = this.getCardLogicValue(firstResult.fourCardData[0]);

            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
    }
    return false;
};

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

logic.removeCardByValue = function (removeCardValueArr, cardDataArr) {
    if (removeCardValueArr.length > cardDataArr.length) return false;

    let tempCardDataArr = cardDataArr.slice();

    //置零扑克
    let deleteCount = 0;
    for (let i = 0; i < removeCardValueArr.length; i++) {
        let isDelete = false;
        for (let j = 0; j < cardDataArr.length; j++) {
            if (removeCardValueArr[i] === this.getCardLogicValue(tempCardDataArr[j])) {
                tempCardDataArr[j] = 0;
                isDelete = true;
            }
        }
        if (isDelete) deleteCount++;
    }
    if (deleteCount !== removeCardValueArr.length) return false;

    let index = 0;
    for (let i = 0; i < tempCardDataArr.length; ++i) {
        if (tempCardDataArr[i] !== 0) {
            cardDataArr[index++] = tempCardDataArr[i];
        }
    }
    cardDataArr.splice(index, cardDataArr.length - index);
    return true;
};

//出牌搜索
logic.searchOutCard = function (handCardDataArr, turnCardDataArr, gameRule) {
    let resultCardArr = [];

    //构造扑克
    let cardDataArr = handCardDataArr.slice();
    let cardCount = handCardDataArr.length;

    cardDataArr = this.sortCardList(cardDataArr);

    let turnCardCount = turnCardDataArr.length;

    //获取类型
    let turnOutCardType = this.getCardType(turnCardDataArr, gameRule);

    //出牌分析
    switch (turnOutCardType) {
        case gameProto.cardType.ERROR: {
            return resultCardArr;
        }
        case gameProto.cardType.SINGLE: //单牌类型
        case gameProto.cardType.DOUBLE: //对牌类型
            {
                //获取数值
                let logicValue = this.getCardLogicValue(turnCardDataArr[0]);
                //分析扑克
                let analyseResult = this.analyseCardDataArr(cardDataArr);
                //寻找单牌
                if (turnCardCount <= 1) {
                    for (let i = 0; i < analyseResult.singleCardData.length; i++) {
                        let index = analyseResult.singleCardData.length - i - 1;
                        if (this.getCardLogicValue(analyseResult.singleCardData[index]) > logicValue) {
                            //设置结果
                            resultCardArr.push(analyseResult.singleCardData[index]);
                            return resultCardArr;
                        }
                    }
                }

                //寻找对牌
                if (turnCardCount <= 2) {
                    for (let i = 0; i < analyseResult.doubleCardData.length; i++) {
                        let index = (analyseResult.doubleCardData.length / 2 - i - 1) * 2;
                        if (this.getCardLogicValue(analyseResult.doubleCardData[index]) > logicValue) {
                            //设置结果
                            resultCardArr = analyseResult.doubleCardData.slice(index, index + turnCardCount);
                            return resultCardArr;
                        }
                    }
                }

                //寻找三牌
                if (turnCardCount <= 3) {
                    for (let i = 0; i < analyseResult.threeCardData.length; i++) {
                        let index = (analyseResult.threeCardData.length / 3 - i - 1) * 3;
                        if (this.getCardLogicValue(analyseResult.threeCardData[index]) > logicValue) {
                            //设置结果
                            resultCardArr = analyseResult.threeCardData.slice(index, index + turnCardCount);
                            return resultCardArr;
                        }
                    }
                }
                break;
            }
        case gameProto.cardType.SINGLE_LINE: //单连类型
            {
                //长度判断
                if (cardCount < turnCardCount) break;
                //获取数值
                let logicValue = this.getCardLogicValue(turnCardDataArr[0]);
                //新增 当 2 连牌时 转为  2
                logicValue = (logicValue == 15 ? 2 : logicValue);
                logicValue = (logicValue == 14 ? 1 : logicValue);
                if (this.getCardLogicValue(turnCardDataArr[1]) == 14) {
                    logicValue = 1;
                }
                if (this.getCardLogicValue(turnCardDataArr[1]) == 13) {
                    logicValue = this.getCardLogicValue(turnCardDataArr[0]);
                }
                //搜索连牌
                for (let i = (turnCardCount - 1); i < cardCount; i++) {
                    //获取数值
                    let handLogicValue = this.getCardLogicValue(cardDataArr[cardCount - i - 1]);
                    //构造判断
                    if (handLogicValue >= 15) break;
                    if (handLogicValue <= logicValue) continue;
                    //搜索连牌
                    let lineCount = 0;
                    for (let j = (cardCount - i - 1); j < cardCount; j++) {
                        if ((this.getCardLogicValue(cardDataArr[j]) + lineCount) === handLogicValue) {
                            //增加连数
                            resultCardArr[lineCount++] = cardDataArr[j];
                            //完成判断
                            if (lineCount === turnCardCount) {
                                return resultCardArr;
                            }
                        }
                    }
                }
                //特殊A 2 判断
                let data = [];

                for (let i = 0; i < cardCount - 1; i++) {
                    //获取数值
                    data = this.getCardValueArr(handCardDataArr);
                    let handLogicValue = this.getCardLogicValue(data[i]);
                    handLogicValue = (handLogicValue == 14 ? 1 : handLogicValue);
                    handLogicValue = (handLogicValue == 15 ? 2 : handLogicValue);
                    //构造判断
                    if (handLogicValue <= logicValue) continue;
                    //搜索连牌
                    let lineCount = 0;
                    for (let j = i; j < data.length; j++) {
                        let Coun_to = data[j];
                        if (Coun_to === handLogicValue + lineCount) {
                            //查找data数组在 cardDataArr位置
                            for (let k = 0; k < data.length; k++) {
                                if (data[j] == this.getCardValue([cardDataArr[k]])) {
                                    //增加连数
                                    resultCardArr[lineCount++] = cardDataArr[k];
                                    break;
                                }
                            }
                            //完成判断
                            if (lineCount === turnCardCount) {
                                return resultCardArr;
                            }
                        }
                    }
                }
                break;
            }
        case gameProto.cardType.DOUBLE_LINE: //对连类型
            {
                //长度判断
                if (cardCount < turnCardCount) break;

                //获取数值
                let logicValue = this.getCardLogicValue(turnCardDataArr[0]);
                //新增 当 A 2 连牌时 转为 1 和 2
                logicValue = (logicValue == 15 ? 2 : logicValue);
                //搜索连牌
                for (let i = (turnCardCount - 1); i < cardCount; i++) {
                    //获取数值
                    let handLogicValue = this.getCardLogicValue(cardDataArr[cardCount - i - 1]);

                    //构造判断
                    if (handLogicValue <= logicValue) continue;
                    if ((handLogicValue >= 15)) break;

                    //搜索连牌
                    let lineCount = 0;
                    for (let j = (cardCount - i - 1); j < (cardCount - 1); j++) {
                        if (((this.getCardLogicValue(cardDataArr[j]) + lineCount) === handLogicValue) &&
                            ((this.getCardLogicValue(cardDataArr[j + 1]) + lineCount) === handLogicValue)) {
                            //增加连数
                            resultCardArr[lineCount * 2] = cardDataArr[j];
                            resultCardArr[lineCount * 2 + 1] = cardDataArr[j + 1];
                            lineCount++;
                            //完成判断
                            if (lineCount * 2 === turnCardCount) {
                                return resultCardArr;
                            }
                        }
                    }
                }
                let data = [];
                //新增 当 A 2 连牌时 转为 1 和 2
                logicValue = (logicValue == 15 ? 2 : logicValue);
                if (this.getCardLogicValue(cardDataArr[0]) == 15 || this.getCardLogicValue(cardDataArr[0]) == 14) {
                    if (this.getCardLogicValue(turnCardDataArr[2]) == 13) {
                        logicValue = this.getCardLogicValue(turnCardDataArr[0]);
                    }
                    for (let i = 0; i < turnCardCount - 1; i++) {
                        //获取数值
                        data = this.getCardValueArr(handCardDataArr);
                        let handLogicValue = this.getCardLogicValue(data[i]);
                        handLogicValue = (handLogicValue == 14 ? 1 : handLogicValue);
                        //构造判断
                        if (handLogicValue <= logicValue) continue;
                        if ((handLogicValue > 15)) break;
                        //搜索连牌
                        let lineCount = 0;
                        for (let j = i; j < data.length; j++) {
                            let Coun_to = data[j];
                            let Coun_er = data[j + 1];
                            if ((Coun_to === handLogicValue + lineCount) && (Coun_er === handLogicValue + lineCount)) {
                                //查找data数组在 cardDataArr位置
                                for (let k = 0; k < data.length; k++) {
                                    if (data[j] == this.getCardValue([cardDataArr[k]])) {
                                        //增加连数
                                        resultCardArr[lineCount * 2] = cardDataArr[k];
                                        resultCardArr[lineCount * 2 + 1] = cardDataArr[k + 1];
                                        lineCount++;
                                        break;
                                    }
                                }
                                //完成判断
                                if (lineCount * 2 === turnCardCount) {
                                    return resultCardArr;
                                }
                            }
                        }
                    }
                }

                break;
            }
        case gameProto.cardType.THREE_LINE: //三连类型
        case gameProto.cardType.THREE_LINE_TAKE_ONE: //三带1
            //长度判断 摆尾时,最后一手可以3带1
            if (turnCardCount == 4 && gameRule.shuaiWei && cardCount < 5) {
                if (logic.compareCard(turnCardDataArr, handCardDataArr, gameRule, true)) {
                    return handCardDataArr.slice();
                }
            } else if (cardCount < turnCardCount) {
                break;
            }
        case gameProto.cardType.THREE_LINE_TAKE_TWO: //三带2
            {


                //获取数值
                let logicValue = 0;
                for (let i = 0; i < turnCardCount - 2; i++) {
                    logicValue = this.getCardLogicValue(turnCardDataArr[i]);
                    if (this.getCardLogicValue(turnCardDataArr[i + 1]) !== logicValue) continue;
                    if (this.getCardLogicValue(turnCardDataArr[i + 2]) !== logicValue) continue;
                    break;
                }

                //属性数值
                let turnLineCount = 0;
                if (turnOutCardType === gameProto.cardType.THREE_LINE_TAKE_ONE) turnLineCount = turnCardCount / 4;
                else if (turnOutCardType === gameProto.cardType.THREE_LINE_TAKE_TWO) turnLineCount = turnCardCount / 5;
                else turnLineCount = turnCardCount / 3;

                //搜索连牌
                for (let i = turnLineCount * 3 - 1; i < cardCount; i++) {
                    //获取数值
                    let handLogicValue = this.getCardLogicValue(cardDataArr[cardCount - i - 1]);
                    //构造判断
                    if (handLogicValue <= logicValue) continue;
                    if ((turnLineCount > 1) && (handLogicValue >= 15)) break;

                    //搜索连牌
                    let lineCount = 0;
                    for (let j = (cardCount - i - 1); j < (cardCount - 2); j++) {
                        //三牌判断
                        if ((this.getCardLogicValue(cardDataArr[j]) + lineCount) !== handLogicValue) continue;
                        if ((this.getCardLogicValue(cardDataArr[j + 1]) + lineCount) !== handLogicValue) continue;
                        if ((this.getCardLogicValue(cardDataArr[j + 2]) + lineCount) !== handLogicValue) continue;

                        //增加连数
                        resultCardArr[lineCount * 3] = cardDataArr[j];
                        resultCardArr[lineCount * 3 + 1] = cardDataArr[j + 1];
                        resultCardArr[lineCount * 3 + 2] = cardDataArr[j + 2];
                        lineCount++;

                        //完成判断
                        if (lineCount === turnLineCount) {
                            //构造扑克
                            let leftCardDataArr = cardDataArr.slice();
                            this.removeCard(resultCardArr, leftCardDataArr);

                            //分析扑克
                            let analyseResultLeft = this.analyseCardDataArr(leftCardDataArr);

                            //提取单牌
                            for (let k = 0; k < analyseResultLeft.singleCardData.length; k++) {
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index = analyseResultLeft.singleCardData.length - k - 1;
                                let singleCard = analyseResultLeft.singleCardData[index];
                                resultCardArr.push(singleCard);
                            }
                            //提取对牌
                            for (let k = 0; k < analyseResultLeft.doubleCardData.length; k++) {
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index = (analyseResultLeft.doubleCardData.length - k - 1);
                                let singleCard = analyseResultLeft.doubleCardData[index];
                                resultCardArr.push(singleCard);
                            }
                            //提取三牌
                            for (let k = 0; k < analyseResultLeft.threeCardData.length; k++) {
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index = (analyseResultLeft.threeCardData.length - k - 1);
                                let singleCard = analyseResultLeft.threeCardData[index];
                                resultCardArr.push(singleCard);
                            }
                            //提取四牌
                            for (let k = 0; k < analyseResultLeft.fourCardData.length; k++) {
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index = (analyseResultLeft.fourCardData.length - k - 1);
                                let singleCard = analyseResultLeft.fourCardData[index];
                                resultCardArr.push(singleCard);
                            }
                            //完成判断
                            if (resultCardArr.length === turnCardCount) return resultCardArr;
                        }
                    }
                }

                break;
            }
    }

    //搜索炸弹
    if ((cardCount >= 4)) {
        //变量定义
        let logicValue = 0;
        if (turnOutCardType === gameProto.cardType.BOMB_CARD) logicValue = this.getCardLogicValue(turnCardDataArr[0]);
        //搜索炸弹
        for (let i = 3; i < cardCount; i++) {
            //获取数值
            let handLogicValue = this.getCardLogicValue(cardDataArr[cardCount - i - 1]);
            //构造判断
            if (handLogicValue <= logicValue) continue;
            //炸弹判断
            let j = 1;
            for (j = 1; j < 4; j++) {
                if (this.getCardLogicValue(cardDataArr[cardCount + j - i - 1]) !== handLogicValue) break;
            }
            if (j !== 4) continue;
            //设置结果
            resultCardArr = [];
            resultCardArr[0] = cardDataArr[cardCount - i - 1];
            resultCardArr[1] = cardDataArr[cardCount - i];
            resultCardArr[2] = cardDataArr[cardCount - i + 1];
            resultCardArr[3] = cardDataArr[cardCount - i + 2];
            return resultCardArr;
        }
    }

    // /* 3A炸弹 */
    // if (gameRule.ThreeABomb) {
    //     if (this.getCardValue(cardDataArr[0]) == 0x01 && this.getCardValue(cardDataArr[1]) == 0x01 && this.getCardValue(cardDataArr[2]) == 0x01) {
    //         return [cardDataArr[0], cardDataArr[1], cardDataArr[2]];
    //     }
    // }
    return [];
};

/*
 * 剩下的手牌的牌型
 */
logic.getRestCardsType = function (cardDataArr, gameRule) {
    if (!cardDataArr) {
        return gameProto.cardType.ERROR;
    }
    cardDataArr = cardDataArr.slice();
    logic.sortCardList(cardDataArr);
    let cardCount = cardDataArr.length;
    //简单牌型
    switch (cardCount) {
        case 0: {
            return gameProto.cardType.ERROR;
        }
        case 1: { //单牌
            return gameProto.cardType.SINGLE;
        }
        case 2: { //对牌
            if (this.getCardLogicValue(cardDataArr[0]) === this.getCardLogicValue(cardDataArr[1])) {
                return gameProto.cardType.DOUBLE;
            }
            return gameProto.cardType.ERROR;
        }
    }

    //分析扑克
    let analyseResult = this.analyseCardDataArr(cardDataArr);
    if (!analyseResult) {
        return gameProto.cardType.ERROR;
    }

    // 四牌判断
    if (analyseResult.fourCardData.length > 0) {
        //牌型判断
        if ((analyseResult.fourCardData.length === 4) && (cardCount === 4)) {
            return gameProto.cardType.BOMB_CARD;
        }
        if (analyseResult.fourCardData.length === 4 && cardCount >= 5 && cardCount <= 8) {
            if (cardCount == 6 && gameRule.shuaiWei && gameRule.lastTurn) {
                return gameProto.cardType.FOUR_LINE_TAKE_TWO;
            } else if (cardCount == 7) {
                return gameProto.cardType.FOUR_LINE_TAKE_THREE;
            }
        }
        return gameProto.cardType.ERROR;
    }

    // 三牌判断
    if (analyseResult.threeCardData.length > 0) {
        let threeCount = analyseResult.threeCardData.length / 3;
        let maxLineCount = 1;
        //连牌判断
        if (threeCount > 1) {
            let arr = [];
            for (let i = 0; i < threeCount; ++i) {
                arr.push(this.getCardLogicValue(analyseResult.threeCardData[i * 3]));
            }
            for (let i = 0; i < arr.length; ++i) {
                let count = 1;
                for (let j = i + 1; j < arr.length; ++j) {
                    if (arr[i] == arr[j] + j - i) {
                        ++count;
                    } else if (arr[i] == 15 && arr[j] == 3) {
                        ++count;
                    } else {
                        break;
                    }
                }
                if (count > maxLineCount) {
                    maxLineCount = count;
                }
            }
        }
        //牌形判断
        if (maxLineCount * 3 === cardCount) {
            return gameProto.cardType.THREE_LINE;
        }
        if (maxLineCount * 4 === cardCount && gameRule.shuaiWei && gameRule.lastTurn) {
            return gameProto.cardType.THREE_LINE_TAKE_ONE;
        }
        if (maxLineCount * 5 === cardCount) {
            return gameProto.cardType.THREE_LINE_TAKE_TWO;
        }
        // if (cardCount >= maxLineCount * 3 && cardCount <= maxLineCount * 5) {
        //     return gameProto.cardType.THREE_LINE_TAKE_TWO;
        // }
        return gameProto.cardType.ERROR;
    }

    //两张类型
    if (analyseResult.doubleCardData.length / 2 >= 2) {
        let doubleCount = analyseResult.doubleCardData.length / 2;
        //变量定义
        let singleCard = this.getCardValueArr(analyseResult.doubleCardData);
        //变量定义
        let cardData = singleCard[0];
        let firstLogicValue = cardData;
        //错误过虑
        //if (firstLogicValue > 15) return gameProto.cardType.ERROR;
        //连牌判断
        if (firstLogicValue == 1 && singleCard[singleCard.length - 1] == 13) {
            firstLogicValue = 14;
            for (let i = doubleCount - 1, j = 1; i > 0; i--, j++) {
                let cardData = singleCard[i * 2];
                if (firstLogicValue !== cardData + j)
                    return gameProto.cardType.ERROR;
            }
        } else {
            //连牌判断
            for (let i = 1; i < doubleCount; i++) {
                let cardData = singleCard[i * 2];
                if (firstLogicValue + i !== cardData)
                    return gameProto.cardType.ERROR;
            }
        }
        //二连判断
        if ((doubleCount * 2) === cardCount) return gameProto.cardType.DOUBLE_LINE;
        return gameProto.cardType.ERROR;
    }


    //单张判断
    if ((analyseResult.singleCardData.length >= 3) && (analyseResult.singleCardData.length === cardCount)) {
        let singleCard = this.getCardValueArr(analyseResult.singleCardData);
        //变量定义
        let cardData = singleCard[0];
        let firstLogicValue = cardData;
        //错误过虑
        // if (firstLogicValue>15) return gameProto.cardType.ERROR;
        //A在第一位逆向判断
        if (firstLogicValue == 1 && singleCard[singleCard.length - 1] == 13) {
            firstLogicValue = 14;
            for (let i = singleCard.length - 1, j = 1; i > 0; i--, j++) {
                let cardData = singleCard[i];
                if (firstLogicValue !== cardData + j)
                    return gameProto.cardType.ERROR;
            }
        } else {
            //连牌判断
            for (let i = 1; i < singleCard.length; i++) {
                let cardData = singleCard[i];
                if (firstLogicValue + i !== cardData)
                    return gameProto.cardType.ERROR;
            }
        }
        return gameProto.cardType.SINGLE_LINE;
    }

    return gameProto.cardType.ERROR;
};

/* 
检测一条龙 自然春
* @param cardDataArr 单个玩家手牌数组
* @param gameRule 游戏规则，判断某些特殊牌型
*/
logic.DetectionyiTiaoLong = function (cardDataArr, gameRule) {
    //安全检测
    if (!cardDataArr) return false;
    if (!gameRule.yiTiaoLong) return false;
    //切割一个新的
    cardDataArr = cardDataArr.slice();
    //排序
    cardDataArr = this.getCardValueArr(cardDataArr);
    //获取长度
    let cardCount = cardDataArr.length;
    if (gameRule.yiTiaoLong) { //检测一条龙
        //记录点
        let StraightRecord = 0;
        //循环判断 是不是连续数据
        for (let i = 0; i < cardCount - 1; i++) {
            //获取数值
            let firstLogicValue = this.getCardValue(cardDataArr[i]);
            let nextLogicValue = this.getCardValue(cardDataArr[i + 1]);
            //判断前一张牌+1 对比后一张牌 牌值是否一样 
            if ((firstLogicValue + 1) !== nextLogicValue) {
                StraightRecord = 1;
            }
        }
        //如果10张牌都能来起来 是顺子 返回ture
        if (StraightRecord == 0) return true;
    }
    if (gameRule.ziRanChun) { //检测自然春
        //置零 记录2
        let StraightRecord = 0;
        for (let i = 0; i < cardCount; i++) {
            //获取数值
            let firstLogicValue = this.getCardValue(cardDataArr[i]);
            //牌值==2 记录点+1
            if (firstLogicValue == 2) {
                StraightRecord++;
            }
        }
        //如果有4个2  返回ture
        if (StraightRecord == 4) return true;
        //置零 记录五对
        StraightRecord = 0;
        for (let i = 0; i < cardCount - 1; i++) {
            //获取数值
            let firstLogicValue = this.getCardValue(cardDataArr[i]);
            let nextLogicValue = this.getCardValue(cardDataArr[i + 1]);
            //判断前一张牌 对比后一张牌 牌值是否一样 一样说明是对子
            if (firstLogicValue == nextLogicValue) {
                StraightRecord++;
                i++;
            }

        }
        //如果有5个对子 返回ture
        if (StraightRecord == 5) return true;
    }
    return false;
};