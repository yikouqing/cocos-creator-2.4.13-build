const ApiCnjj = require('./ApiCnjj');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const CNJJModel = require("./CNJJModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');
cc.Class({
    extends: cc.Component,

    properties: {
        item: cc.Node,
        content: cc.Node,
        btn_close: cc.Node,
        cardPfb: cc.Prefab,
    },

    onLoad() {
        this.btn_close.on("click", () => {
            this.node.destroy()
        }, this)
        this.item.active = false
    },

    start() {
        let data = this.node.nodeParams.resData
        let maiMaList = data.result.filter(info => info.chairID >= CNJJModel.getChairCount())
        this.content.removeAllChildren()
        if (maiMaList && maiMaList.length > 0) {
            maiMaList.forEach(maiMaInfo => {
                let mai = data.result.find(info => info.uid == maiMaInfo.pourInfo.watchUid)
                let item = cc.instantiate(this.item)
                item.x = 0
                item.active = true
                item.parent = this.content

                /**自己的头像和名字 */
                let headSprite = cc.find("head", item).getComponent(cc.Sprite)
                AssetsManager.loadSpriteFrame({
                    path: maiMaInfo.avatar,
                    sprite: headSprite
                });
                cc.find("txt_name", item).getComponent(cc.Label).string = CCUtil.stringClamp(maiMaInfo.nickname, 6, '..');
                /**买马的头像和名字 */
                let headSprite1 = cc.find("head1", item).getComponent(cc.Sprite)
                AssetsManager.loadSpriteFrame({
                    path: mai.avatar,
                    sprite: headSprite1
                });
                cc.find("txt_name1", item).getComponent(cc.Label).string = CCUtil.stringClamp(mai.nickname, 4, '..');

                /**下注 */
                cc.find("txt_bet", item).getComponent(cc.Label).string = Utils.formatNumberWithDecimal(maiMaInfo.pourInfo.score)

                /**买马的牌和牌型 */
                let cardLayout = cc.find("cardLayout", item)
                for (let i = 0; i < mai.cardsList.length; i++) {
                    const cid = mai.cardsList[i];
                    let cardNode = cc.instantiate(this.cardPfb)
                    cardNode.parent = cardLayout
                    let com = cardNode.addComponent("CNJJCard")
                    com.init()
                    com.flower = cid
                }
                let cardTypeSprite = cc.find("cardType", item).getComponent(cc.Sprite)
                let typeStr = ""
                let ctype = mai.cardsType
                if (ctype.type == ApiCnjj.cardType.DANZHANG) {
                    typeStr = ctype.type + "_" + ctype.point
                } else if (ctype.type == ApiCnjj.cardType.DUIZI) {
                    typeStr = "2"
                }
                let url = "res/sprite/cardType/" + typeStr
                AssetsManager.loadSpriteFrame({
                    path: url,
                    sprite: cardTypeSprite,
                    bundle: Enums.bundleType.CNJJ
                })

                /**输赢分数 */
                let score = Utils.formatNumberWithDecimal(maiMaInfo.winScores)
                if (score > 0) {
                    let txt_win = cc.find('txt_win', item).getComponent(cc.Label);
                    txt_win.node.active = true;
                    txt_win.string = '+' + score;
                } else {
                    let txt_lose = cc.find('txt_lose', item).getComponent(cc.Label);
                    txt_lose.node.active = true;
                    txt_lose.string = score;
                }
            });
        }
    },
});