const CARDID = {
    CARDID_WAN1: 1,
    CARDID_WAN2: 2,
    CARDID_WAN3: 3,
    CARDID_WAN4: 4,
    CARDID_WAN5: 5,
    CARDID_WAN6: 6,
    CARDID_WAN7: 7,
    CARDID_WAN8: 8,
    CARDID_WAN9: 9,
    CARDID_TONG1: 11,
    CARDID_TONG2: 12,
    CARDID_TONG3: 13,
    CARDID_TONG4: 14,
    CARDID_TONG5: 15,
    CARDID_TONG6: 16,
    CARDID_TONG7: 17,
    CARDID_TONG8: 18,
    CARDID_TONG9: 19,
    CARDID_TIAO1: 21,
    CARDID_TIAO2: 22,
    CARDID_TIAO3: 23,
    CARDID_TIAO4: 24,
    CARDID_TIAO5: 25,
    CARDID_TIAO6: 26,
    CARDID_TIAO7: 27,
    CARDID_TIAO8: 28,
    CARDID_TIAO9: 29,
    CARDID_DONG: 31,
    CARDID_NAN: 32,
    CARDID_XI: 33,
    CARDID_BEI: 34,
    CARDID_ZHONG: 35,
    CARDID_FA: 36,
    CARDID_BAI: 37,
    CARDID_CHUN: 41,
    CARDID_XIA: 42,
    CARDID_QIU: 43,
    CARDID_DON: 44,
    CARDID_MEI: 45,
    CARDID_LAN: 46,
    CARDID_ZHU: 47,
    CARDID_JU: 48,
};


class GameLogic {

    constructor() {
        this.cards = []; //麻将列表
        this.tingCards = []; //可以听牌的列表
        this.gameRule = {};
        this.initCards();
    }

    initRule(gameRule) {
        this.gameRule = gameRule;
    }

    //初始化卡牌
    initCards() {

        this.cards = [];
        for (let i = 0; i < 4; i++) {
            //添加万字
            for (let k = CARDID.CARDID_WAN1; k <= CARDID.CARDID_WAN9; k++) {
                this.cards.push(k);
                if (!this.tingCards.includes(k)) {
                    this.tingCards.push(k);
                }
            }
            //添加条子
            for (let k = CARDID.CARDID_TIAO1; k <= CARDID.CARDID_TIAO9; k++) {
                this.cards.push(k);
                if (!this.tingCards.includes(k)) {
                    this.tingCards.push(k);
                }
            }
            //添加筒子
            for (let k = CARDID.CARDID_TONG1; k <= CARDID.CARDID_TONG9; k++) {
                this.cards.push(k);
                if (!this.tingCards.includes(k)) {
                    this.tingCards.push(k);
                }
            }

            //添加红中
            this.cards.push(CARDID.CARDID_ZHONG);
            if (!this.tingCards.includes(CARDID.CARDID_ZHONG)) {
                this.tingCards.push(CARDID.CARDID_ZHONG);
            }
        }

        //洗牌
        for (let i = 0; i < 300; ++i) {
            let index = i % this.cards.length;
            let random1 = Math.floor(Math.random() * this.cards.length);
            let tmp = this.cards[index];
            this.cards[index] = this.cards[random1];
            this.cards[random1] = tmp;
        }
    }

    //获取指定的卡牌
    getSetCard(card) {

        let index = this.cards.indexOf(card);
        if (index == -1) {
            return null;
        } else {
            this.cards.splice(index, 1);
            return card;
        }
    }

    //获取指定数量的卡牌
    getCards(cardCount) {
        let array = [];
        if (this.cards.length >= cardCount) {
            array = this.cards.splice(0, cardCount);
        }
        return array;
    }


    getAllCards() {
        return this.cards;
    }

    //获取剩余卡牌数量
    getRestCardsCount() {
        return this.cards.length;
    }

    /*-----------------------------------胡牌算法-----------------------------------------*/


    //是否可以胡基础牌型
    getCanHu(cards, laiziCount = 0) {

        // 若牌张数不是2、5、8、11、14,17则不能胡  
        if ((cards.length + laiziCount + 1) % 3 != 0) return false;


        if (this.gameRule.isHongZhongHu && laiziCount == 4) {
            return true;
        }

        //判断特殊牌型
        if (this.gameRule.isHasQiDui) {
            let curCards = cards.slice();
            for (let i = 0; i < laiziCount; i++) {
                curCards.push(35);
            }
            let isQiDui = this.isQiDui(curCards);
            if (isQiDui) {
                return true;
            }
        }

        //牌升序排序 
        cards.sort((a, b) => {
            return a - b;
        })

        // 依次删除一对牌做将，其余牌全部成扑则可胡  
        for (let i = 0; i < cards.length; i++) {

            //和上一次是同样的对牌，避免重复计算
            if (i > 0 && cards[i] == cards[i - 1]) continue;

            // 找到对子或是用一张癞子拼出的对子 
            if ((i + 1 < cards.length && cards[i] == cards[i + 1]) || laiziCount > 0) {

                let curCards = cards.slice();
                let curLaizi = laiziCount;
                curCards.splice(i, 1);
                //如果队列里面还有一个对子
                if (curCards[i] == cards[i]) {
                    curCards.splice(i, 1);
                } else {
                    curLaizi--; //没有一对时使用癞子代替
                }

                // 删去对子判断剩下的牌是否成顺子和坎
                if (this.isShunKan(curCards, curLaizi)) {
                    return true;
                }
            }
        }
        if (laiziCount >= 2 && this.isShunKan(cards, laiziCount - 2)) {
            // 两个癞子做将牌特殊判定处理  
            return true;
        }
        return false;
    }

    //是否顺子和坎
    isShunKan(cards, laiziCount) {

        if (cards.length === 0) return true;
        //判断顺子
        for (let first = cards[0] - 2; first <= cards[0]; first++) {

            if (first >= 30) continue; //字牌花牌不能连
            if (first % 10 > 7) continue; // 89不能连牌
            if (laiziCount === 0 && first < cards[0]) continue; //没有癞子的情况 连牌必须是第一张开始

            let shunCount = 0;
            for (let i = 0; i < 3; i++) {
                if (cards.indexOf(first + i) >= 0) {
                    shunCount += 1;
                }
            }

            //找到一个顺子
            if (shunCount === 3 || shunCount + laiziCount >= 3) {

                let curCards = cards.slice();
                let curLaizi = laiziCount;
                for (let i = 0; i < 3; i++) {

                    let deletePos = curCards.indexOf(first + i);
                    if (deletePos >= 0) {
                        curCards.splice(deletePos, 1); //原卡牌踢出顺子数据
                    } else {
                        curLaizi -= 1; //没有的时候使用癞子替换
                    }
                }
                //判断剩下的牌是否成顺坎
                if (this.isShunKan(curCards, curLaizi)) {
                    return true;
                }
            }
        }

        //判断坎
        let keziCard = cards[0];
        let keziCount = (cards.filter(item => item == keziCard)).length;

        if (keziCount === 3 || keziCount + laiziCount >= 3) {

            let curCards = cards.slice();
            let curLaizi = laiziCount;
            for (let i = 0; i < 3; i++) {
                let deletePos = curCards.indexOf(keziCard);
                if (deletePos >= 0) {
                    curCards.splice(deletePos, 1); //原卡牌踢出坎数据
                } else {
                    curLaizi -= 1; //没有的时候使用癞子替换
                }
            }
            if (this.isShunKan(curCards, curLaizi)) {
                return true;
            }
        }
        return false;
    }

    //获取听牌列表
    getTingList(cards, laiziCount = 0) {

        let tingList = [];
        this.tingCards.map(item => {

            let curCards = cards.slice();
            curCards.push(item);
            curCards = curCards.filter(item => item != 35);
            if (this.getCanHu(curCards, laiziCount)) {
                tingList.push({
                    cardID: item,
                    rate: 1
                });
            }
        });
        if (laiziCount == 3 && this.gameRule.isHongZhongHu && !tingList.some(info => info.cardID != 35)) {
            tingList.push({
                cardID: 35,
                rate: 1
            });
        }
        return tingList;
    }

    //是否对对胡
    isDuiDuiHu(cards) {

        let curCards = cards.slice();
        let cardCount = {};
        let duiList = [];
        let kanList = [];
        for (let i = 0; i < curCards.length; i++) {
            let curCard = curCards[i];
            if (!cardCount[curCard]) {
                cardCount[curCard] = 0;
            }
            cardCount[curCard] += 1;
        }

        for (let card in cardCount) {
            if (cardCount[card] == 2) {
                duiList.push(card);
            } else if (cardCount[card] == 3) {
                kanList.push(card);
            } else {
                return false;
            }
        }

        if (duiList.length == 1 && (duiList.length * 2 + kanList.length * 3) == curCards.length) {
            return true;
        } else {
            return false;
        }
    }

    //是否清一色
    isQingYiSe(operateRecords, cards) {

        operateRecords = operateRecords.slice();
        let curCards = cards.filter(item => item != 35);
        let cardTypeList = [];
        curCards.forEach((item) => {
            let cardType = this.getCardType(item);
            if (!cardTypeList.includes(cardType)) {
                cardTypeList.push(cardType)
            }
        });
        if (cardTypeList.length > 1) {
            return false;
        }

        let curOperate = [gameProto.operateType.PENG, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_ZHI];
        //判断是否包含有其他花色的碰杠
        let haveOtherType = operateRecords.some(item => {
            return curOperate.includes(item.operate) && !cardTypeList.includes(this.getCardType(item.card))
        });
        return !haveOtherType;
    }

    //是否七对
    isQiDui(cards) {

        let isQiDui = true;
        if (cards.length != 14) {
            isQiDui = false;
        } else {
            let curCards = cards.filter(item => item != 35);
            let curLaiCount = (cards.filter(item => item == 35)).length;
            let cardTypeList = {};
            curCards.forEach((item) => {
                if (!cardTypeList[item]) {
                    cardTypeList[item] = 0;
                }
                cardTypeList[item] += 1;
            });

            for (let cardType in cardTypeList) {
                if (cardTypeList[cardType] % 2 == 0) continue;
                if (curLaiCount == 0) {
                    isQiDui = false;
                    break;
                } else {
                    curLaiCount -= 1;
                }
            }
        }
        return isQiDui;
    }


    /*-----------------------------------基础工具函数-----------------------------------------*/


    getAllHandCards(operateRecords) {

        let curCards = [];
        let curOperate = [gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_ZHI];
        //杠的卡牌
        let cardList = operateRecords.filter(item => curOperate.includes(item.operate));
        for (let i = 0; i < cardList.length; i++) {
            let curList = cardList[i].plusInfo.cardList;
            curCards = curCards.concat(curList);
        }
        //碰的卡牌
        let pengList = operateRecords.filter(item => {
            return item.operate == gameProto.operateType.PENG && !cardList.some(curItem => {
                return curItem.card == item.card
            })
        });
        for (let i = 0; i < pengList.length; i++) {
            let curList = pengList[i].plusInfo.cardList;
            curCards = curCards.concat(curList);
        }
        return curCards;

    }

    //获取牌值
    getCardNumber(card) {
        return card % 10;
    }

    //获取牌型
    getCardType(card) {

        return Math.floor(card / 10);
    }

    //移除指定卡牌是否能胡
    isHuExceptCards(cards, exceptCards) {

        let curData = exceptCards.slice();
        let allData = cards.slice();
        //移除指定卡牌
        for (let i = 0; i < curData.length; i++) {
            let curIndex = allData.findIndex(item => item == curData[i]);
            if (curIndex >= 0) {
                allData.splice(curIndex, 1);
            }
        }
        let laiCount = (allData.filter(item => item == 35)).length;
        let cardsCount = allData.filter(item => item != 35);
        return this.getCanHu(cardsCount, laiCount);
    }



}


module.exports = new GameLogic();