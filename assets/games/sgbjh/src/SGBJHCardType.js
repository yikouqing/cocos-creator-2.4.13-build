const ApiSgbjh = require('./ApiSgbjh');
const SGBJHModel = require('./SGBJHModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        _img_sgtype: null,
        _img_sgnum: null,
        _img_jh: null,
        _txt_sg: null,
        _txt_jh: null,
        _bg: null,
        _node_type: null,
        _node_score: null,
        _pos_type: null,
        _pos_score: null,
        _pos_bg: null,
    },

    init() {
        this.node.active = false
        this._img_sgtype = cc.find("type/img_sgtype", this.node)
        this._img_sgnum = cc.find("type/img_sgnum", this.node)
        this._img_jh = cc.find("type/img_jh", this.node)
        this._bg = cc.find("bg", this.node)
        this._txt_sg = cc.find("score/txt_sg", this.node).getComponent(cc.Label)
        this._txt_jh = cc.find("score/txt_jh", this.node).getComponent(cc.Label)
        this._node_type = cc.find("type", this.node)
        this._node_score = cc.find("score", this.node)
        this._pos_bg = this._bg.getPosition()
        this._img_sgnum.active = false
        this._pos_score = this._node_score.getPosition()
        this._pos_type = this._node_type.getPosition()
        this._txt_jh.string = ""
        this._txt_sg.string = ""
    },

    /**
     * 展示牌型
     * @param types 类型数组，0三公牌型 1金花牌型
     * @param sgnum 三公点数
     * @param isAni 是否需要动画
     */
    showCardType(types, sgnum, chairID, isAni = false) {
        let sgtype = types[0]
        let jhtype = types[1]
        let sgurl = "res/sprite/cardtype/sg/" + sgtype;
        let sgnumurl = "res/sprite/cardtype/sg/1_" + sgnum;
        let jhurl = "res/sprite/cardtype/jh/" + jhtype;

        this._img_sgnum.active = false
        this._img_sgtype.active = false
        /**如果类型小于三公需要显示点数 */
        if (sgtype <= ApiSgbjh.cardsType.SHUANGGONG) {
            let numnode = this._img_sgnum
            if (sgtype === ApiSgbjh.cardsType.ZHENGCHANG) { //只有点数的时候用type节点显示数字
                numnode = this._img_sgtype
                this._img_sgtype.active = true

            } else {
                this._img_sgnum.active = true
            }
            AssetsManager.loadSpriteFrame({
                path: sgnumurl,
                sprite: numnode.getComponent(cc.Sprite),
                bundle: Enums.bundleType.SGBJH
            });
        }
        /**三公类型 */
        if (sgtype !== ApiSgbjh.cardsType.ZHENGCHANG) {
            this._img_sgtype.active = true
            //@ts-ignore
            AssetsManager.loadSpriteFrame({
                path: sgurl,
                sprite: this._img_sgtype.getComponent(cc.Sprite),
                bundle: Enums.bundleType.SGBJH
            });
        }

        /**金花类型 */
        //@ts-ignore
        AssetsManager.loadSpriteFrame({
            path: jhurl,
            sprite: this._img_jh.getComponent(cc.Sprite),
            bundle: Enums.bundleType.SGBJH
        });
        this._img_jh.active = true
        this._node_type.active = true
        this.node.active = true
        /**动画 */
        if (isAni) {
            this._bg.x = this._pos_bg.x - 200
            this._bg.opacity = 0
            this._bg.scale = 0
            cc.tween(this._bg).to(0.2, {
                position: cc.v3(this._pos_bg),
                opacity: 255,
                scale: 1
            }).start()
            this._node_type.scale = 0
            this._node_type.x = this._pos_type.x + 200
            cc.tween(this._node_type).delay(0.1).to(0.2, {
                position: cc.v3(this._pos_type),
                scale: 1
            }).start()

            let user = SGBJHModel.getUserByChairID(chairID);
            let sex = (user.userInfo.sex == 0) ? "nan" : "nv";
            let sgAudioUrl = `res/audio/sg/${sex}/px_`
            /**三公声音 */
            if (sgtype === ApiSgbjh.cardsType.BAOZI) {
                AssetsManager.playEffect({
                    path: sgAudioUrl + "baoZi",
                    bundle: Enums.bundleType.SGBJH
                });
            } else if (sgtype >= ApiSgbjh.cardsType.SANGONG && sgtype <= ApiSgbjh.cardsType.DASANGONG) {
                AssetsManager.playEffect({
                    path: sgAudioUrl + "sanGong",
                    bundle: Enums.bundleType.SGBJH
                });
            } else if (sgtype <= ApiSgbjh.cardsType.SHUANGGONG) {
                AssetsManager.playEffect({
                    path: sgAudioUrl + sgnum,
                    bundle: Enums.bundleType.SGBJH
                });
            } else if (sgtype === ApiSgbjh.cardsType.ZIZHUN) {
                AssetsManager.playEffect({
                    path: sgAudioUrl + "baoSan",
                    bundle: Enums.bundleType.SGBJH
                });
            }
            /**金花声音 */
            this.scheduleOnce(() => {
                //@ts-ignore
                AssetsManager.playEffect({
                    path: `res/audio/jh/${sex}/${jhtype}`,
                    bundle: Enums.bundleType.SGBJH
                });
            }, 0.7)
        } else {
            this._node_type.stopAllActions();
            this._node_type.scale = 1;
            this._node_type.setPosition(this._pos_type);
            this._bg.stopAllActions();
            this._bg.opacity = 255;
            this._bg.scale = 1;
            this._bg.setPosition(this._pos_bg);
        }
    },

    /**
     * 展示输赢分数
     * @param scores 0三公分数  1金花分数
     */
    showScore(scores, isAni = false) {
        this._txt_sg.string = scores[0] >= 0 ? `+${scores[0]}` : scores[0] + ""
        this._txt_jh.string = scores[1] >= 0 ? `+${scores[1]}` : scores[1] + ""
        this._node_score.active = true
        this.node.active = true
        /**动画 */
        if (isAni) {
            this._node_score.opacity = 0
            this._node_score.scale = 0
            this._node_score.y = this._pos_score.y + 100
            cc.tween(this._node_score).to(0.3, {
                position: cc.v3(this._pos_score),
                opacity: 255,
                scale: 1
            }).start()
        } else {
            this._node_score.stopAllActions()
            this._node_score.opacity = 255
            this._node_score.scale = 1
            this._node_score.setPosition(this._pos_score)
        }
    },

    hideSelf() {
        this._txt_jh.string = ""
        this._txt_sg.string = ""
        this._bg.stopAllActions()
        this._bg.setPosition(this._pos_bg)
        this._node_type.stopAllActions()
        this._node_type.setPosition(this._pos_type)
        this._node_score.stopAllActions()
        this._node_score.setPosition(this._pos_score)
        this._img_sgnum.active = false
        this.node.active = false
    }
});