
const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        leftValue: cc.Sprite,
        leftColor: cc.Sprite,
        rightValue: cc.Sprite,
        rightColor: cc.Sprite,
        bigValue: cc.Sprite
    },

    /*
     * 获取牌的花色
     * @param card 牌id
     * @return Number 花色值
     */
    getCardColor(card) {
        return Math.floor(card / 16);
    },
    /*
     * 获取牌的牌面数值
     * @param card Number 牌id
     * @return Number 值
     */
    getCardNumber(card) {
        return card & 0x0f;
    },

    bind(card) {
        let type = this.getCardColor(card);
        let val = this.getCardNumber(card);
        AssetsManager.loadSpriteFrame({
            path: 'sprite/cuopai/' + card,
            sprite: this.bigValue
        });
        let num = '',
            color = card != 78 && card != 79 ? 'type_' + type : '';
        this.leftColor.spriteFrame = null;
        this.rightColor.spriteFrame = null;
        if (color != '') {
            //显示小花色
            AssetsManager.loadSpriteFrame({
                path: 'sprite/cuopai/' + color,
                sprite: this.leftColor
            });
            AssetsManager.loadSpriteFrame({
                path: 'sprite/cuopai/' + color,
                sprite: this.rightColor
            });
        }
        if (card == 78 || card == 79) {
            num = 'xiao_' + card;
        } else {
            if (type == 1 || type == 3) {
                num = 'xiao_hei_' + val;
            } else {
                num = 'xiao_hong_' + val;
            }
        }
        if (num != '') {
            AssetsManager.loadSpriteFrame({
                path: 'sprite/cuopai/' + num,
                sprite: this.leftValue
            });
            AssetsManager.loadSpriteFrame({
                path: 'sprite/cuopai/' + num,
                sprite: this.rightValue
            });
        }
    },

});