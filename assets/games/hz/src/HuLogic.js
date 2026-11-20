const MJTableUtil = require('./MJTableUtil');

/**
 * 查表法检查胡牌
 */
class HuLogic {

    constructor(opts) {}

    init() {
        return this;
    }

    checkHu(cardInHandList, ghostList, cardOngoing) {
        let cardList = cardInHandList.slice(0);
        if (cardOngoing != undefined) {
            cardList.push(cardOngoing);
        }

        return this.isHu(cardList, ghostList);
    }

    isHu(cardList, ghostList) {
        // 初始计数
        let cards = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0], // 筒
            [0, 0, 0, 0, 0, 0, 0, 0, 0], // 条
            [0, 0, 0, 0, 0, 0, 0, 0, 0] // 万
        ];
        // 鬼牌总数
        let ghostCount = 0;
        // 计数：统计各牌张数，鬼牌另计在ghostCount上
        for (let card of cardList) {
            if (ghostList.indexOf(card) >= 0) {
                // 是鬼牌
                ghostCount++;
            } else {
                let rank = (card % 10 - 1);
                let type = Math.floor(card / 10);
                cards[type][rank]++;
            }
        }
        // 开始匹配
        //tmpData是一个3维数组，tmpData[0]是手牌中除去鬼牌后的牌，它可能是筒子,万子，条子，或者字牌)
        //tmpData[1] 是鬼牌的个数
        //tmpData[2] 是否有将
        let tmpData = {};
        tmpData[1] = ghostCount;
        tmpData[2] = false;
        //检查每一个牌型是否胡牌；
        for (let i = 0; i < 3; i++) {
            tmpData[0] = cards[i];
            if (!this.checkCards(tmpData, 0)) {
                return false;
            }
        }
        if (!tmpData[2] && tmpData[1] % 3 == 2) {
            return true;
        }
        if (tmpData[2] && tmpData[1] % 3 == 0) {
            return true;
        }
        return false;
    }

    checkCards(tmpData, ghostCount) {
        let totalCardCount = MJTableUtil.calTotalCardCount(tmpData[0]);
        if (totalCardCount == 0) {
            return true;
        }
        //查表，如果表里没有，加一个鬼进去再试试
        if (!MJTableUtil.findCards(tmpData[0], ghostCount)) {
            //递归，每次鬼牌+1,直到鬼牌用尽为止，如果某个牌型把鬼牌用尽都不能胡，那么手牌就不能胡了。
            if (ghostCount < tmpData[1]) {
                return this.checkCards(tmpData, ghostCount + 1);
            } else {
                return false;
            }
        } else { //查表找到了，看看牌型是否使用了将。
            //如果该牌型有将
            if ((totalCardCount + ghostCount) % 3 == 2) {
                //之前没用将，直接标记为已使用将了。
                if (!tmpData[2]) {
                    tmpData[2] = true;
                }
                //如果用将，那么尝试一下再加一个鬼牌进去，看能否胡牌。因为胡牌只能一对将。
                else if (ghostCount < tmpData[1]) {
                    return this.checkCards(tmpData, ghostCount + 1);
                } else { //如果找不到就不能胡
                    return false;
                }
            }
            tmpData[1] = tmpData[1] - ghostCount;
            // console.log('判断', tmpData[0], true, ghostCount, tmpData[1]);
        }
        return true;
    }
}

module.exports = new HuLogic();