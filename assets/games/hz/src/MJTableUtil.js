const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

class MJTableUtil {

    constructor(opts) {
        // 普通牌：万，筒，条
        this.keyDic = {};
        this.keyDicWithGhost = {};
        for (let i = 1; i < 9; i++) {
            this.keyDicWithGhost[i] = {};
        }
    }

    init() {
        // 不带鬼
        this.load('Table0', this.keyDic);
        // 带鬼
        for (let i = 1; i < 9; i++) {
            this.load('Table' + i, this.keyDicWithGhost[i]);
        }
    }

    findCards(cards, ghostCount) {
        let key = this.generateKey(cards);
        if (ghostCount > 0) {
            if (this.keyDicWithGhost[ghostCount][key]) {
                return true;
            }
        } else if (this.keyDic[key]) {
            return true;
        }
        return false;
    }

    load(file, dic) {
        setTimeout(() => {
            AssetsManager.loadAsset({
                bundle: Enums.bundleType.HZ,
                path: 'res/json/tbl/' + file,
                aType: cc.JsonAsset
            }, (asset) => {
                // console.log('加载 TBL-2', file, asset.json)
                if (!asset) return;
                for (let item of asset.json.data) {
                    dic[item] = 1;
                }
            });
        }, 0);
    }

    toNumberArray(strKey) {
        let result = [];
        for (let i = 0; i < strKey.length; i++) {
            let temp = strKey.slice(i, i + 1);
            result.push(parseInt(temp));
        }
        return result;
    }

    generateKey(cards) {
        let key = '';
        let dic = ['0', '1', '2', '3', '4']
        for (let i = 0; i < cards.length; i++) {
            key = key + dic[cards[i]];
        }
        return key;
    }

    calTotalCardCount(cards) {
        let count = 0;
        for (let i = 0; i < 9; i++) {
            count += cards[i];
        }
        return count;
    }
}

module.exports = new MJTableUtil();