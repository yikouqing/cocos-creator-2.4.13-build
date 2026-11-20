/*
 * 麻将算法
 */
const huLogic = require('./HuLogic');

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
	CARDID_ZHONG: 35,
};

class GameLogic {
	constructor() { }

	/*
	 * 能否胡牌
	 */
	canHu(cards, card, qidui = false) {
		if (qidui && this.canHuQidui(cards, card)) {
			return true;
		}
		return huLogic.checkHu(cards, [CARDID.CARDID_ZHONG], card);
	}

	getGhostList() {
		return [CARDID.CARDID_ZHONG]
	}

	/*
	 * 胡七对
	 */
	canHuQidui(cards, card) {
		let cloneCards = cards.slice();
		if (card != null && card != undefined) {
			cloneCards.push(card);
		}
		if (cloneCards.length != 14) {
			return false;
		}
		cloneCards.sort((a, b) => {
			return a - b;
		});
		let isQidui = true;
		while (cloneCards.length > 0 && isQidui) {
			let card = cloneCards.shift();
			if (card == CARDID.CARDID_ZHONG) {
				break;
			} else {
				let index = cloneCards.indexOf(card);
				if (index == -1) {
					index = cloneCards.indexOf(CARDID.CARDID_ZHONG);
				}
				if (index == -1) {
					isQidui = false;
				} else {
					cloneCards.splice(index, 1);
				}
			}
		}
		return isQidui;
	}

	/*
	 * 打出一张牌能否听牌
	 */
	getTingCards(cards, qidui) {
		let tingCards = [];
		for (let i = 0; i < cards.length; ++i) {
			let cloneCards = cards.slice();
			cloneCards.splice(i, 1);
			if (this.canHu(cloneCards, CARDID.CARDID_ZHONG, qidui)) {
				tingCards.push(cards[i]);
			}
		}
		// console.log("打听==", tingCards)
		return tingCards;
	}

	/*
	 * 获取能赢的牌
	 */
	getCanWinCards(cards, qidui) {
		let canWinCards = [];
		for (let key in CARDID) {
			let item = CARDID[key];
			if (this.canHu(cards, item, qidui)) {
				let d = {
					card: item,
					count: 0
				}
				canWinCards.push(d);
			}
		}
		// console.log("听牌==", canWinCards)
		return canWinCards;
	}
}

let instance = null;
module.exports = (() => {
	if (instance == null) {
		instance = new GameLogic();
	}
	return instance;
})();