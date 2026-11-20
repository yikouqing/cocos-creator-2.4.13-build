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

    constructor(gameRule) {
        this.cards = []; //麻将列表
        this.tingCards = []; //可以听牌的列表
        this.gameRule = gameRule;
        this.initCards();
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
            //添加字牌 东南西北中发白
            for (let k = CARDID.CARDID_DONG; k <= CARDID.CARDID_BAI; k++) {
                this.cards.push(k);
                if (!this.tingCards.includes(k)) {
                    this.tingCards.push(k);
                }
            }
        }

        //添加花牌
        this.cards.push(CARDID.CARDID_MEI, CARDID.CARDID_LAN, CARDID.CARDID_ZHU, CARDID.CARDID_JU);

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

    getCardColor(card) {
        return Math.floor(card / 10);
    }

    //获取指定数量的卡牌
    getCards(cardCount, isBuHua = false) {
        let array = [];
        if (isBuHua) {
            for (let i = 0; i < this.cards.length; i++) {
                if (this.cards[i] < CARDID.CARDID_DONG) {
                    array.push(this.cards[i])
                }
                if (array.length >= cardCount) {
                    //在数组里面移除当前麻将
                    for (let k = 0; k < array.length; k++) {
                        this.getSetCard(array[k]);
                    }
                    break;
                }
            }
        } else {
            if (this.cards.length >= cardCount) {
                array = this.cards.splice(0, cardCount);
            }
        }
        return array;
    }



    //获取剩余卡牌数量
    getRestCardsCount() {
        return this.cards.length;
    }

    /*-----------------------------------胡牌算法-----------------------------------------*/


    //是否可以胡基础牌型
    getCanHu(cards, laiziCount) {

        // 若牌张数不是2、5、8、11、14,17则不能胡  
        if ((cards.length + laiziCount + 1) % 3 != 0) return false;

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
    getTingList(cards, laiziCount) {
        let tingList = [];
        this.tingCards.map(item => {
            let curCards = cards.slice();
            curCards.push(item);
            if (this.getCanHu(curCards, laiziCount)) {
                tingList.push({
                    cardID: item,
                    rate: 1
                });
            }
        });
        return tingList;
    }
}


module.exports = new GameLogic();