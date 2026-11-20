/*
 * 捞腌菜算法
 */
const gameProto = require('./ApiCx');

class CXLogic {
    constructor() {
        this.cards = [];
        this.baseCards = [
            0x02, 0x04, 0x06, 0x07, 0x08, 0x0A, 0x0C, // 方块2 4 6 7 8 10 Q
            0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, // 梅花 4 5 6 7 8 9 10 J
            0x22, 0x23, 0x24, 0x26, 0x27, 0x28, 0x2A, 0x2C, // 红桃2 3 4 6 7 8 10 Q
            0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, // 黑桃4 5 6 7 8 9 10 J
            0x4F, //大王
        ];

    }
    //获取卡牌
    getExceptCards(allTestCards) {

        let allCards = this.baseCards.slice();
        let testCards = [];
        for (let key in allTestCards) {
            testCards = testCards.concat(allTestCards[key]);
        }
        let newCards = allCards.filter(item => !testCards.includes(item));
        return newCards.slice();
    }


    /*
     * 洗牌
       @pokerCount:牌的数量
     */
    washCards(allTestCards) {

        this.cards = this.getExceptCards(allTestCards);
        for (let i = 0; i < this.cards.length; ++i) {
            let random = Math.floor(Math.random() * this.cards.length);
            let tmp = this.cards[i];
            this.cards[i] = this.cards[random];
            this.cards[random] = tmp;
        }
    }

    getCurCards() {
        return this.cards.slice();
    }

    //判断牌是否在当前的牌库中
    isInCardList(allTestCards, cardData) {

        let curCards = this.getExceptCards(allTestCards);
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

    /*
     * 获取牌的花色
     * @param card 牌id
     * @return Number 花色值
     */
    getCardColor(card) {
        return Math.floor(card / 16);
    }

    /*
     * 获取牌的花色名字
     * @param card Number 牌id
     * @return String 花色
     */
    getCardColorName(card) {
        let colors = ['方块', '草花', '红桃', '黑桃'];
        if (card >= 0x01 && card <= 0x3d) {
            return colors[Math.floor(card / 0x10)];
        }
        return null;
    }

    /*
     * 获取牌的牌面数值
     * @param card Number 牌id
     * @return Number 值
     */
    getCardNumber(card) {
        let Number = card & 0x0f;
        if (card == 0x4F) {
            Number++;
        }
        return Number;
    }

    /*
     * 获取手牌
     * @return Array 手牌
     */
    getCards(count) {
        let cards = [];
        for (let i = 0; i < count; ++i) {
            cards.push(this.cards.pop());
        }
        return cards;
    }


    //获取牌的点数
    getCardsPoint(cards) {
        let point = 0;
        for (let i = 0; i < cards.length; i++) {
            point += this.getCardNumber(cards[i]);
        }
        let dian = point % 10;
        if (dian == 9) {
            dian = 311;
        } else if (dian == 8) {
            dian = 391;
        } else if (dian == 7) {
            dian = 491;
        } else if (dian == 6) {
            dian = 581;
        } else if (dian == 5) {
            dian = 691;
        } else if (dian == 4) {
            dian = 781;
        } else if (dian == 3) {
            dian = 881;
        } else if (dian == 2) {
            dian = 971;
        } else if (dian == 1) {
            dian = 1061;
        } else if (dian == 0) {
            dian = 1110;
        }
        return dian;
    }
    //获取单牌的点数
    /*
     *card 一张牌
     */
    getCardsIndividual(card) {
        //天牌
        let tianpai = [0x0C, 0x2C];
        if (tianpai.indexOf(card) != -1) {
            return 6;
        }
        //地牌
        let dipai = [0x02, 0x22];
        if (dipai.indexOf(card) != -1) {
            return 5;
        }
        //人牌
        let repai = [0x08, 0x28];
        if (repai.indexOf(card) != -1) {
            return 4;
        }
        //和牌
        let hepai = [0x04, 0x24];
        if (hepai.indexOf(card) != -1) {
            return 3;
        }
        //梅十 =板凳= 长三
        let zhongsan = [0x1A, 0x3A, 0x14, 0x34, 0x16, 0x36];
        if (zhongsan.indexOf(card) != -1) {
            return 2;
        }
        //斧头= 苕十 = 猫猫 = 膏药
        let xiayao = [0x1B, 0x3B, 0x0A, 0x2A, 0x06, 0x26, 0x07, 0x27];
        if (xiayao.indexOf(card) != -1) {
            return 1;
        }
        //黑9 = 黑8 = 黑7 = 小5 = 丁丁 = 鬼鬼
        let xiasilan = [0x19, 0x39, 0x18, 0x38, 0x17, 0x37, 0x15, 0x35, 0x23, 0x4F];
        if (xiasilan.indexOf(card) != -1) {
            return 0;
        }
        return 0;
    }
    /*
     * 查询手牌
     * @param cards 手牌数组
     * Array_one 头牌数组
     * Array_two 加牌数组 
     */
    GetCardsindexOf(Array_one = [], Array_two = [], cards = []) {
        if ((Array_one.indexOf(cards[0]) != -1 || Array_one.indexOf(cards[1]) != -1) &&
            (Array_two.indexOf(cards[0]) != -1 || Array_two.indexOf(cards[1]) != -1)) {
            return true;
        }
        return false;
    }
    /*
     * 获取牌型点数
     * @param cards Array 牌
     * @return String 类型
     */
    getCardsTypeCount(Type, isDiJiuWang = false) {
        let typesun = 2000;
        //if (gameProto.cardType.includes(Type)) {
        // 梅十  板凳 长三
        if (Type == gameProto.cardType.MEISHI || Type == gameProto.cardType.BANDENG || Type == gameProto.cardType.CHANGSAN) {
            Type = gameProto.cardType.CHANGSAN;
        }
        // 斧头  苕十 猫猫  膏 药
        if (Type == gameProto.cardType.FUTOU || Type == gameProto.cardType.SHAOSHI || Type == gameProto.cardType.MAOMAO || Type == gameProto.cardType.GAOYAO) {
            Type = gameProto.cardType.GAOYAO;
        }
        // 黑9  黑8 黑7  小5
        if (Type == gameProto.cardType.HEIJIU || Type == gameProto.cardType.HEIBA || Type == gameProto.cardType.HEIQI || Type == gameProto.cardType.XIAOWU) {
            Type = gameProto.cardType.XIAOWU;
        }
        //天红杠 天黑杠
        if (Type == gameProto.cardType.TIANHONGGANG || Type == gameProto.cardType.TIANHEIGANG) {
            Type = gameProto.cardType.TIANHONGGANG;
        }
        //地红杠 地黑杠
        if (Type == gameProto.cardType.DIHONGGANG || Type == gameProto.cardType.DIHEIGANG) {
            Type = gameProto.cardType.DIHONGGANG;
        }
        //梅十 板凳 长三 
        if (Type == gameProto.cardType.MEISHI || Type == gameProto.cardType.BANDENG || Type == gameProto.cardType.CHANGSAN) {
            Type = gameProto.cardType.MEISHI;
        }
        //斧头 苕十 猫猫  膏 药
        if (Type == gameProto.cardType.FUTOU || Type == gameProto.cardType.SHAOSHI || Type == gameProto.cardType.MAOMAO || Type == gameProto.cardType.GAOYAO) {
            Type = gameProto.cardType.FUTOU;
        }
        //梅十九 板五九 丁长九 
        if (Type == gameProto.cardType.MEISHIJIU || Type == gameProto.cardType.BANWUJIU || Type == gameProto.cardType.DINGCHANGJIU) {
            Type = gameProto.cardType.MEISHIJIU;
        }
        //乌龙九 苕十九 丁猫九
        if (Type == gameProto.cardType.WULONGJIU || Type == gameProto.cardType.SHAOSHIJIU || Type == gameProto.cardType.DINGMAOJIU) {
            Type = gameProto.cardType.WULONGJIU;
        }
        //斧七八 苕十八 
        if (Type == gameProto.cardType.FUQIBA || Type == gameProto.cardType.SHAOSHIBA) {
            Type = gameProto.cardType.FUQIBA;
        }
        //梅十七 丁板七 斧长七
        if (Type == gameProto.cardType.MEISHIQI || Type == gameProto.cardType.DINGBANQI || Type == gameProto.cardType.FUCHANGQI) {
            Type = gameProto.cardType.MEISHIQI;
        }
        //斧猫七 苕十七 斧头七
        if (Type == gameProto.cardType.FUMAOQI || Type == gameProto.cardType.SHAOSHIQI || Type == gameProto.cardType.FUTOUQI) {
            Type = gameProto.cardType.FUMAOQI;
        }
        //梅十六 长三六 中三六
        if (Type == gameProto.cardType.MEISHILIU || Type == gameProto.cardType.CHANGSANLIU || Type == gameProto.cardType.ZHONGSANLIU) {
            Type = gameProto.cardType.MEISHILIU;
        }
        //斧五六 苕十六 膏药六
        if (Type == gameProto.cardType.FUWULIU || Type == gameProto.cardType.SHAOSHILIU || Type == gameProto.cardType.GAOYAOLIU) {
            Type = gameProto.cardType.FUWULIU;
        }
        //梅十五 板斧五 长三五  中三五 板凳五
        if (Type == gameProto.cardType.MEISHIWU || Type == gameProto.cardType.BANFUWU || Type == gameProto.cardType.CHANGSANWU || Type == gameProto.cardType.ZHONGSANWU || Type == gameProto.cardType.BANDENGWU) {
            Type = gameProto.cardType.MEISHIWU;
        }
        //苕十五 猫九五 膏药五
        if (Type == gameProto.cardType.SHAOSHIWU || Type == gameProto.cardType.MAOJIUWU || Type == gameProto.cardType.GAOYAOWU) {
            Type = gameProto.cardType.SHAOSHIWU;
        }
        //六九五 七八五
        if (Type == gameProto.cardType.LIUJIUWU || Type == gameProto.cardType.QIBAWU) {
            Type = gameProto.cardType.LIUJIUWU;
        }

        //梅十四 长十四
        if (Type == gameProto.cardType.MEISHISI || Type == gameProto.cardType.CHANGSHISI) {
            Type = gameProto.cardType.MEISHISI;
        }
        //丁斧四 六八四  双花七
        if (Type == gameProto.cardType.DINGFUSI || Type == gameProto.cardType.LIUBASI || Type == gameProto.cardType.SHUANGHUAQI) {
            Type = gameProto.cardType.DINGFUSI;
        }
        //梅十三 四九三 长十三
        if (Type == gameProto.cardType.MEISHISAN || Type == gameProto.cardType.SIJIUSAN || Type == gameProto.cardType.CHANGSHISAN) {
            Type = gameProto.cardType.MEISHISAN;
        }
        //苕十三 六七三  膏药三
        if (Type == gameProto.cardType.SHAOSHISAN || Type == gameProto.cardType.LIUQISAN || Type == gameProto.cardType.GAOYAOSAN) {
            Type = gameProto.cardType.SHAOSHISAN;
        }
        //四八二 长三二 二六二
        if (Type == gameProto.cardType.SIBAER || Type == gameProto.cardType.CHANGSANER || Type == gameProto.cardType.ERLIUER) {
            Type = gameProto.cardType.SIBAER;
        }
        //猫猫二 膏药二
        if (Type == gameProto.cardType.MAOMAOER || Type == gameProto.cardType.GAOYAOER) {
            Type = gameProto.cardType.MAOMAOER;
        }
        //丁九二 五七二
        if (Type == gameProto.cardType.DINGJIUER || Type == gameProto.cardType.WUQIER) {
            Type = gameProto.cardType.DINGJIUER;
        }
        //梅十一 四七一 长三一
        if (Type == gameProto.cardType.MEISHIYI || Type == gameProto.cardType.SIQIYI || Type == gameProto.cardType.CHANGSANYI) {
            Type = gameProto.cardType.MEISHIYI;
        }
        //斧十一 五六一
        if (Type == gameProto.cardType.FUSHIYI || Type == gameProto.cardType.WULIUYI) {
            Type = gameProto.cardType.FUSHIYI;
        }
        //}
        //地九王
        if (isDiJiuWang && Type == gameProto.cardType.DIJIUWANG) {
            Type = gameProto.cardType.TIANJIUWANG + 1;
        }
        return typesun - Type;
    }
    /*
     * 获取2张牌的类型
     * @param cards Array 牌
     * @return String 类型
     */
    getCardsType(cards) {
        //三花特殊牌
        //红10黑10黑J
        let sanhua_type_tou = 0;
        let sanhua_type_zhong = 0;
        let sanhua_type_wei = 0;
        for (let index = 0; index < cards.length; index++) {
            if ([0x1A, 0x3A].includes(cards[index])) {
                sanhua_type_tou++;
            }
            if ([0x0A, 0x2A].includes(cards[index])) {
                sanhua_type_zhong++;
            }
            if ([0x1B, 0x3B].includes(cards[index])) {
                sanhua_type_wei++;
            }
        }
        if (sanhua_type_tou + sanhua_type_zhong + sanhua_type_wei == 3) {
            return gameProto.cardType.SHANHUA;
        }
        //红6黑6大王
        sanhua_type_tou = 0;
        sanhua_type_zhong = 0;
        sanhua_type_wei = 0;
        for (let index = 0; index < cards.length; index++) {
            if ([0x16, 0x36].includes(cards[index])) {
                sanhua_type_tou++;
            }
            if ([0x06, 0x26].includes(cards[index])) {
                sanhua_type_zhong++;
            }
            if ([0x4F].includes(cards[index])) {
                sanhua_type_wei++;
            }
        }
        if (sanhua_type_tou + sanhua_type_zhong + sanhua_type_wei == 3) {
            return gameProto.cardType.SHANHUA;
        }
        if (cards.length != 2) {
            return 0;
        }
        //丁二皇
        if (cards.indexOf(0x4F) != -1 && cards.indexOf(0X23) != -1) {
            return gameProto.cardType.DINGERHUANG;
        }
        //天牌
        if (cards.indexOf(0x0C) != -1 && cards.indexOf(0x2C) != -1) {
            return gameProto.cardType.TIANPAI;
        }
        //地牌
        if (cards.indexOf(0x02) != -1 && cards.indexOf(0x22) != -1) {
            return gameProto.cardType.DIPAI;
        }
        //人牌
        if (cards.indexOf(0x08) != -1 && cards.indexOf(0x28) != -1) {
            return gameProto.cardType.REPAI;
        }
        //和牌
        if (cards.indexOf(0x04) != -1 && cards.indexOf(0x24) != -1) {
            return gameProto.cardType.HEPAI;
        }
        //梅十
        if (cards.indexOf(0x1A) != -1 && cards.indexOf(0x3A) != -1) {
            return gameProto.cardType.MEISHI;
        }
        //板凳
        if (cards.indexOf(0x14) != -1 && cards.indexOf(0x34) != -1) {
            return gameProto.cardType.BANDENG;
        }
        //长三
        if (cards.indexOf(0x16) != -1 && cards.indexOf(0x36) != -1) {
            return gameProto.cardType.CHANGSAN;
        }
        //斧头
        if (cards.indexOf(0x1B) != -1 && cards.indexOf(0x3B) != -1) {
            return gameProto.cardType.FUTOU;
        }
        //苕十
        if (cards.indexOf(0x0A) != -1 && cards.indexOf(0x2A) != -1) {
            return gameProto.cardType.SHAOSHI;
        }
        //猫猫
        if (cards.indexOf(0x06) != -1 && cards.indexOf(0x26) != -1) {
            return gameProto.cardType.MAOMAO;
        }
        //膏药
        if (cards.indexOf(0x07) != -1 && cards.indexOf(0x27) != -1) {
            return gameProto.cardType.GAOYAO;
        }
        //黑9
        if (cards.indexOf(0x19) != -1 && cards.indexOf(0x39) != -1) {
            return gameProto.cardType.HEIJIU;
        }
        //黑8
        if (cards.indexOf(0x18) != -1 && cards.indexOf(0x38) != -1) {
            return gameProto.cardType.HEIBA;
        }
        //黑7
        if (cards.indexOf(0x17) != -1 && cards.indexOf(0x37) != -1) {
            return gameProto.cardType.HEIQI;
        }
        //小5
        if (cards.indexOf(0x15) != -1 && cards.indexOf(0x35) != -1) {
            return gameProto.cardType.XIAOWU;
        }
        //天九王
        let tianjiuwang_type_tian = [0x0C, 0x2C];
        let tianjiuwang_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(tianjiuwang_type_tian, tianjiuwang_type_jia, cards)) {
            return gameProto.cardType.TIANJIUWANG;
        }
        //天红杠
        let tianhonggang_type_tian = [0x0C, 0x2C];
        let tianhonggang_type_jia = [0x08, 0x28];
        if (this.GetCardsindexOf(tianhonggang_type_tian, tianhonggang_type_jia, cards)) {
            return gameProto.cardType.TIANHONGGANG;
        }
        //天黑杠
        let tianheigang_type_tian = [0x0C, 0x2C];
        let tianheigang_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(tianheigang_type_tian, tianheigang_type_jia, cards)) {
            return gameProto.cardType.TIANHEIGANG;
        }
        //地红杠
        let dihonggang_type_tian = [0x02, 0x22];
        let dihonggang_type_jia = [0x08, 0x28];
        if (this.GetCardsindexOf(dihonggang_type_tian, dihonggang_type_jia, cards)) {
            return gameProto.cardType.DIHONGGANG;
        }
        //地黑杠
        let diheigang_type_tian = [0x02, 0x22];
        let diheigang_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(diheigang_type_tian, diheigang_type_jia, cards)) {
            return gameProto.cardType.DIHEIGANG;
        }
        //9点
        //天官九
        let tianguanjiu_type_tian = [0x0C, 0x2C];
        let tianguanjiu_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(tianguanjiu_type_tian, tianguanjiu_type_jia, cards)) {
            return gameProto.cardType.TIANGUANJIU;
        }
        //地官九
        let diguanjiu_type_tian = [0x02, 0x22];
        let diguanjiu_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(diguanjiu_type_tian, diguanjiu_type_jia, cards)) {
            return gameProto.cardType.DIGUANJIU;
        }
        //人官九
        let reguanjiu_type_tian = [0x08, 0x28];
        let reguanjiu_type_jia = [0x1B, 0x3B];
        if (this.GetCardsindexOf(reguanjiu_type_tian, reguanjiu_type_jia, cards)) {
            return gameProto.cardType.REGUANJIU;
        }
        //和官九
        let heguanjiu_type_tian = [0x04, 0x24];
        let heguanjiu_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(heguanjiu_type_tian, heguanjiu_type_jia, cards)) {
            return gameProto.cardType.HEGUANJIU;
        }
        //梅十九
        let meishijiu_type_tian = [0x1A, 0x3A];
        let meishijiu_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(meishijiu_type_tian, meishijiu_type_jia, cards)) {
            return gameProto.cardType.MEISHIJIU;
        }
        //板五九
        let banwujiu_type_tian = [0x14, 0x34];
        let banwujiu_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(banwujiu_type_tian, banwujiu_type_jia, cards)) {
            return gameProto.cardType.BANWUJIU;
        }
        //丁长九
        let dingchangjiu_type_tian = [0x23];
        let dingchangjiu_type_jia = [0x16, 0x36];
        if (this.GetCardsindexOf(dingchangjiu_type_tian, dingchangjiu_type_jia, cards)) {
            return gameProto.cardType.DINGCHANGJIU;
        }
        //乌龙九
        let wulongjiu_type_tian = [0x1B, 0x3B];
        let wulongjiu_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(wulongjiu_type_tian, wulongjiu_type_jia, cards)) {
            return gameProto.cardType.WULONGJIU;
        }
        //苕十九
        let shaoshijiu_type_tian = [0x0A, 0x2A];
        let shaoshijiu_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(shaoshijiu_type_tian, shaoshijiu_type_jia, cards)) {
            return gameProto.cardType.SHAOSHIJIU;
        }
        //丁猫九
        let dingmaojiu_type_tian = [0x23];
        let dingmaojiu_type_jia = [0x06, 0x26];
        if (this.GetCardsindexOf(dingmaojiu_type_tian, dingmaojiu_type_jia, cards)) {
            return gameProto.cardType.DINGMAOJIU;
        }
        //8点
        //天官八
        let tianguangba_type_tian = [0x0C, 0x2C];
        let tianguangba_type_jia = [0x06, 0x26, 0x16, 0x36, 0x4F];
        if (this.GetCardsindexOf(tianguangba_type_tian, tianguangba_type_jia, cards)) {
            return gameProto.cardType.TIANGUANBA;
        }
        //地官八
        let diguanba_type_tian = [0x02, 0x22];
        let diguanba_type_jia = [0x06, 0x26, 0x16, 0x36, 0x4F];
        if (this.GetCardsindexOf(diguanba_type_tian, diguanba_type_jia, cards)) {
            return gameProto.cardType.DIGUANBA;
        }
        //人十八
        let reshiba_type_tian = [0x08, 0x28];
        let reshiba_type_jia = [0x0A, 0x2A, 0x1A, 0x3A];
        if (this.GetCardsindexOf(reshiba_type_tian, reshiba_type_jia, cards)) {
            return gameProto.cardType.RESHIBA;
        }
        //和官八
        let heguanba_type_tian = [0x04, 0x24];
        let heguanba_type_jia = [0x14, 0x34];
        if (this.GetCardsindexOf(heguanba_type_tian, heguanba_type_jia, cards)) {
            return gameProto.cardType.HEGUANBA;
        }
        //梅十八
        let meishiba_type_tian = [0x1A, 0x3A];
        let meishiba_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(meishiba_type_tian, meishiba_type_jia, cards)) {
            return gameProto.cardType.MEISHIBA;
        }
        //斧七八
        let fuqiba_type_tian = [0x1B, 0x3B];
        let fuqiba_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(fuqiba_type_tian, fuqiba_type_jia, cards)) {
            return gameProto.cardType.FUQIBA;
        }
        //苕十八
        let shaoshiba_type_tian = [0x0A, 0x2A];
        let shaoshiba_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(shaoshiba_type_tian, shaoshiba_type_jia, cards)) {
            return gameProto.cardType.SHAOSHIBA;
        }
        //丁五八
        let dingwuba_type_tian = [0x23];
        let dingwuba_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(dingwuba_type_tian, dingwuba_type_jia, cards)) {
            return gameProto.cardType.DINGWUBA;
        }
        //7点
        //天官七
        let tianguanqi_type_tian = [0x0C, 0x2C];
        let tianguanqi_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(tianguanqi_type_tian, tianguanqi_type_jia, cards)) {
            return gameProto.cardType.TIANGUANQI;
        }
        //地官七
        let diguanqi_type_tian = [0x02, 0x22];
        let diguanqi_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(diguanqi_type_tian, diguanqi_type_jia, cards)) {
            return gameProto.cardType.DIGUANQI;
        }
        //苏州七
        let suzhouqi_type_tian = [0x08, 0x28];
        let suzhouqi_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(suzhouqi_type_tian, suzhouqi_type_jia, cards)) {
            return gameProto.cardType.SHUZHOUQI;
        }
        //丁和七
        let dingheqi_type_tian = [0x23];
        let dingheqi_type_jia = [0x04, 0x24];
        if (this.GetCardsindexOf(dingheqi_type_tian, dingheqi_type_jia, cards)) {
            return gameProto.cardType.DINGHEQI;
        }
        //梅十七
        let meiheqi_type_tian = [0x1A, 0x3A];
        let meiheqi_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(meiheqi_type_tian, meiheqi_type_jia, cards)) {
            return gameProto.cardType.MEISHIQI;
        }
        //丁板七
        let dingbanqi_type_tian = [0x23];
        let dingbanq_type_jia = [0x14, 0x34];
        if (this.GetCardsindexOf(dingbanqi_type_tian, dingbanq_type_jia, cards)) {
            return gameProto.cardType.DINGBANQI;
        }
        //斧长七
        let fuchangqi_type_tian = [0x1B, 0x3B];
        let fuchangqi_type_jia = [0x16, 0x36];
        if (this.GetCardsindexOf(fuchangqi_type_tian, fuchangqi_type_jia, cards)) {
            return gameProto.cardType.FUCHANGQI;
        }
        //斧猫七
        let fumaoqi_type_tian = [0x1B, 0x3B];
        let fumaoqi_type_jia = [0x06, 0x26];
        if (this.GetCardsindexOf(fumaoqi_type_tian, fumaoqi_type_jia, cards)) {
            return gameProto.cardType.FUMAOQI;
        }
        //苕十七
        let shaoshiqi_type_tian = [0x0A, 0x2A];
        let shaoshiqi_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(shaoshiqi_type_tian, shaoshiqi_type_jia, cards)) {
            return gameProto.cardType.SHAOSHIQI;
        }
        //王＋ 两个J等于斧头7
        let fitouqi_type_tian = [0x4F];
        let fitouqi_type_jia = [0x1B, 0x3B];
        if (this.GetCardsindexOf(fitouqi_type_tian, fitouqi_type_jia, cards)) {
            return gameProto.cardType.FUTOUQI;
        }
        //非洲七
        let feizhouqi_type_tian = [0x18, 0x38];
        let feizhouqi_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(feizhouqi_type_tian, feizhouqi_type_jia, cards)) {
            return gameProto.cardType.FEIZHOUQI;
        }
        //6点
        //天官六
        let tianguanliu_type_tian = [0x0C, 0x2C];
        let tianguanliu_type_jia = [0x04, 0x24, 0x14, 0x34];
        if (this.GetCardsindexOf(tianguanliu_type_tian, tianguanliu_type_jia, cards)) {
            return gameProto.cardType.TIANGUANLIU;
        }
        //地官六
        let diguanliu_type_tian = [0x02, 0x22];
        let diguanliu_type_jia = [0x04, 0x24, 0x14, 0x34];
        if (this.GetCardsindexOf(diguanliu_type_tian, diguanliu_type_jia, cards)) {
            return gameProto.cardType.DIGUANLIU;
        }
        //元宝六
        let yuanbaoliu_type_tian = [0x08, 0x28];
        let yuanbaoliu_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(yuanbaoliu_type_tian, yuanbaoliu_type_jia, cards)) {
            return gameProto.cardType.YUANBAOLIU;
        }
        //王＋ 两个黑十等于中山六
        let zhongsanliu_type_tian = [0x4F];
        let zhongsanliu_type_jia = [0x1A, 0x3A];
        if (this.GetCardsindexOf(zhongsanliu_type_tian, zhongsanliu_type_jia, cards)) {
            return gameProto.cardType.ZHONGSANLIU;
        }
        //梅十六
        let meishiliu_type_tian = [0x1A, 0x3A];
        let meishiliu_type_jia = [0x06, 0x26, 0x16, 0x36];
        if (this.GetCardsindexOf(meishiliu_type_tian, meishiliu_type_jia, cards)) {
            return gameProto.cardType.MEISHILIU;
        }
        //长三六
        let changsanliu_type_tian = [0x16, 0x36];
        let changsanliu_type_jia = [0x0A, 0x2A];
        if (this.GetCardsindexOf(changsanliu_type_tian, changsanliu_type_jia, cards)) {
            return gameProto.cardType.CHANGSANLIU;
        }
        //斧五六
        let fuwuliu_type_tian = [0x1B, 0x3B];
        let fuwuliu_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(fuwuliu_type_tian, fuwuliu_type_jia, cards)) {
            return gameProto.cardType.FUWULIU;
        }
        //苕十六
        let shaoshiliu_type_tian = [0x0A, 0x2A];
        let shaoshiliu_type_jia = [0x06, 0x26];
        if (this.GetCardsindexOf(shaoshiliu_type_tian, shaoshiliu_type_jia, cards)) {
            return gameProto.cardType.SHAOSHILIU;
        }
        //王＋ 两个红色十 等于苕十六
        shaoshiliu_type_tian = [0x4F];
        shaoshiliu_type_jia = [0x0A, 0x2A];
        if (this.GetCardsindexOf(shaoshiliu_type_tian, shaoshiliu_type_jia, cards)) {
            return gameProto.cardType.SHAOSHILIU;
        }
        //膏药六
        let gaoyaoliu_type_tian = [0x07, 0x27];
        let gaoyaoliu_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(gaoyaoliu_type_tian, gaoyaoliu_type_jia, cards)) {
            return gameProto.cardType.GAOYAOLIU;
        }
        //七九六
        let qijiuliu_type_tian = [0x17, 0x37];
        let qijiuliu_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(qijiuliu_type_tian, qijiuliu_type_jia, cards)) {
            return gameProto.cardType.QIJIULIU;
        }
        //5点
        //天丁五
        let tiandingwu_type_tian = [0x0C, 0x2C];
        let tiandingwu_type_jia = [0x23];
        if (this.GetCardsindexOf(tiandingwu_type_tian, tiandingwu_type_jia, cards)) {
            return gameProto.cardType.TIANDINGWU;
        }
        //地丁五
        let didingwu_type_tian = [0x02, 0x22];
        let didingwu_type_jia = [0x23];
        if (this.GetCardsindexOf(didingwu_type_tian, didingwu_type_jia, cards)) {
            return gameProto.cardType.DIDINGWU;
        }
        //人十五
        let reshiwu_type_tian = [0x08, 0x28];
        let reshiwu_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(reshiwu_type_tian, reshiwu_type_jia, cards)) {
            return gameProto.cardType.RESHIWU;
        }
        //和斧五
        let hefuwu_type_tian = [0x04, 0x24];
        let hefuwu_type_jia = [0x1B, 0x3B];
        if (this.GetCardsindexOf(hefuwu_type_tian, hefuwu_type_jia, cards)) {
            return gameProto.cardType.HEFUWU;
        }
        //梅十五
        let meishiwu_type_tian = [0x1A, 0x3A];
        let meishiwu_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(meishiwu_type_tian, meishiwu_type_jia, cards)) {
            return gameProto.cardType.MEISHIWU;
        }
        //板斧五
        let banfuwu_type_tian = [0x14, 0x34];
        let banfuwu_type_jia = [0x1B, 0x3B];
        if (this.GetCardsindexOf(banfuwu_type_tian, banfuwu_type_jia, cards)) {
            return gameProto.cardType.BANFUWU;
        }
        //长三五
        let changsanwu_type_tian = [0x19, 0x39];
        let changsanwu_type_jia = [0x16, 0x36];
        if (this.GetCardsindexOf(changsanwu_type_tian, changsanwu_type_jia, cards)) {
            return gameProto.cardType.CHANGSANWU;
        }
        //板凳五
        let bandengwu_type_tian = [0x1B, 0x3B];
        let bandengwu_type_jia = [0x14, 0x34];
        if (this.GetCardsindexOf(bandengwu_type_tian, bandengwu_type_jia, cards)) {
            return gameProto.cardType.BANDENGWU;
        }
        // //中山五
        // let zhongsanwu_type_tian = [0x1A, 0x3A];
        // let zhongsanwu_type_jia = [0x15, 0x35];
        // if (this.GetCardsindexOf(zhongsanwu_type_tian, zhongsanwu_type_jia, cards)) {
        //     return gameProto.cardType.ZHONGSANWU;
        // }
        //苕十五
        let shaoshiwu_type_tian = [0x0A, 0x2A];
        let shaoshiwu_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(shaoshiwu_type_tian, shaoshiwu_type_jia, cards)) {
            return gameProto.cardType.SHAOSHIWU;
        }
        //猫九五
        let maojiuwu_type_tian = [0x06, 0x26];
        let maojiuwu_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(maojiuwu_type_tian, maojiuwu_type_jia, cards)) {
            return gameProto.cardType.MAOJIUWU;
        }
        //膏药五
        let gaoyaowu_type_tian = [0x07, 0x27];
        let gaoyaowu_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(gaoyaowu_type_tian, gaoyaowu_type_jia, cards)) {
            return gameProto.cardType.GAOYAOWU;
        }
        //七八五
        let qibawu_type_tian = [0x17, 0x37];
        let qibawu_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(qibawu_type_tian, qibawu_type_jia, cards)) {
            return gameProto.cardType.QIBAWU;
        }
        //六九五
        let liujiuwu_type_tian = [0x4F];
        let liujiuwu_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(liujiuwu_type_tian, liujiuwu_type_jia, cards)) {
            return gameProto.cardType.LIUJIUWU;
        }
        //4点
        //天地公子
        let tiandigongzi_type_tian = [0x0C, 0x2C];
        let tiandigongzi_type_jia = [0x02, 0x22];
        if (this.GetCardsindexOf(tiandigongzi_type_tian, tiandigongzi_type_jia, cards)) {
            return gameProto.cardType.TIANDIGONGZI;
        }
        //人十四
        let reshisi_type_tian = [0x08, 0x28];
        let reshisi_type_jia = [0x06, 0x26, 0x16, 0x36, 0x4F];
        if (this.GetCardsindexOf(reshisi_type_tian, reshisi_type_jia, cards)) {
            return gameProto.cardType.RESHISI;
        }
        //和十四
        let heshisi_type_tian = [0x04, 0x24];
        let heshisi_type_jia = [0x0A, 0x2A, 0x1A, 0x3A];
        if (this.GetCardsindexOf(heshisi_type_tian, heshisi_type_jia, cards)) {
            return gameProto.cardType.HESHISI;
        }
        //梅十四
        let meishisi_type_tian = [0x0A, 0x2A, 0x1A, 0x3A];
        let meishisi_type_jia = [0x14, 0x34];
        if (this.GetCardsindexOf(meishisi_type_tian, meishisi_type_jia, cards)) {
            return gameProto.cardType.MEISHISI;
        }
        //长十四
        let changshisi_type_tian = [0x16, 0x36];
        let changshisi_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(changshisi_type_tian, changshisi_type_jia, cards)) {
            return gameProto.cardType.CHANGSHISI;
        }
        //丁斧四
        let dingfusi_type_tian = [0x23];
        let dingfusi_type_jia = [0x1B, 0x3B];
        if (this.GetCardsindexOf(dingfusi_type_tian, dingfusi_type_jia, cards)) {
            return gameProto.cardType.DINGFUSI;
        }
        //六八四
        let liubasi_type_tian = [0x06, 0x26];
        let liubasi_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(liubasi_type_tian, liubasi_type_jia, cards)) {
            return gameProto.cardType.LIUBASI;
        }
        //双花七
        let shuanghuaqi_type_tian = [0x07, 0x27];
        let shuanghuaqi_type_jia = [0x17, 0x37];
        if (this.GetCardsindexOf(shuanghuaqi_type_tian, shuanghuaqi_type_jia, cards)) {
            return gameProto.cardType.SHUANGHUAQI;
        }
        //五九四
        let wujiusi_type_tian = [0x15, 0x35];
        let wujiusi_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(wujiusi_type_tian, wujiusi_type_jia, cards)) {
            return gameProto.cardType.WUJIUSI;
        }
        //3点
        //天斧三
        let tianfusan_type_tian = [0x0C, 0x2C];
        let tianfusan_type_jia = [0x1B, 0x3B];
        if (this.GetCardsindexOf(tianfusan_type_tian, tianfusan_type_jia, cards)) {
            return gameProto.cardType.TIANFUSAN;
        }
        //地斧三
        let difusan_type_tian = [0x02, 0x22];
        let difusan_type_jia = [0x1B, 0x3B];
        if (this.GetCardsindexOf(difusan_type_tian, difusan_type_jia, cards)) {
            return gameProto.cardType.DIFUSAN;
        }
        //人十三
        let reshisan_type_tian = [0x08, 0x28];
        let reshisan_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(reshisan_type_tian, reshisan_type_jia, cards)) {
            return gameProto.cardType.RESHISAN;
        }
        //和十三
        let heshisan_type_tian = [0x04, 0x24];
        let heshisan_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(heshisan_type_tian, heshisan_type_jia, cards)) {
            return gameProto.cardType.HESHISAN;
        }
        //梅十三
        let meishisan_type_tian = [0x1A, 0x3A];
        let meishisan_type_jia = [0x23];
        if (this.GetCardsindexOf(meishisan_type_tian, meishisan_type_jia, cards)) {
            return gameProto.cardType.MEISHISAN;
        }
        //四九三
        let sijiusan_type_tian = [0x14, 0x34];
        let sijiusan_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(sijiusan_type_tian, sijiusan_type_jia, cards)) {
            return gameProto.cardType.SIJIUSAN;
        }
        //长十三
        let changshisan_type_tian = [0x16, 0x36];
        let changshisan_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(changshisan_type_tian, changshisan_type_jia, cards)) {
            return gameProto.cardType.CHANGSHISAN;
        }
        //王＋ 两个红七等于膏药三
        let gaoyao_type_tian = [0x4F];
        let gaoyao_type_jia = [0x07, 0x27];
        if (this.GetCardsindexOf(gaoyao_type_tian, gaoyao_type_jia, cards)) {
            return gameProto.cardType.GAOYAOSAN;
        }
        //苕十三
        let shaoshisan_type_tian = [0x0A, 0x2A];
        let shaoshisan_type_jia = [0x23];
        if (this.GetCardsindexOf(shaoshisan_type_tian, shaoshisan_type_jia, cards)) {
            return gameProto.cardType.SHAOSHISAN;
        }
        //六七三
        let liuqisan_type_tian = [0x06, 0x26];
        let liuqisan_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(liuqisan_type_tian, liuqisan_type_jia, cards)) {
            return gameProto.cardType.LIUQISAN;
        }
        //五八三
        let wubasan_type_tian = [0x15, 0x35];
        let wubasan_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(wubasan_type_tian, wubasan_type_jia, cards)) {
            return gameProto.cardType.WUBASAN;
        }
        //2点
        //天十二
        let tianshier_type_tian = [0x0C, 0x2C];
        let tianshier_type_jia = [0x0A, 0x2A, 0x1A, 0x3A];
        if (this.GetCardsindexOf(tianshier_type_tian, tianshier_type_jia, cards)) {
            return gameProto.cardType.TIANSHIER;
        }
        //地十二
        let dishier_type_tian = [0x02, 0x22];
        let dishier_type_jia = [0x0A, 0x2A, 0x1A, 0x3A];
        if (this.GetCardsindexOf(dishier_type_tian, dishier_type_jia, cards)) {
            return gameProto.cardType.DISHIER;
        }
        //人十二
        let reshier_type_tian = [0x08, 0x28];
        let reshier_type_jia = [0x04, 0x24];
        if (this.GetCardsindexOf(reshier_type_tian, reshier_type_jia, cards)) {
            return gameProto.cardType.RESHIER;
        }
        //和十二
        let heshier_type_tian = [0x04, 0x24];
        let heshier_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(heshier_type_tian, heshier_type_jia, cards)) {
            return gameProto.cardType.HESHIER;
        }
        //四八二
        let sibaer_type_tian = [0x14, 0x34];
        let sibaer_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(sibaer_type_tian, sibaer_type_jia, cards)) {
            return gameProto.cardType.SIBAER;
        }
        //王 + 两黑六， 等于长三二
        let zhongsaner_type_tian = [0x4F];
        let zhongsaner_type_jia = [0x16, 0x36];
        if (this.GetCardsindexOf(zhongsaner_type_tian, zhongsaner_type_jia, cards)) {
            return gameProto.cardType.CHANGSANER;
        }
        //二六二
        let erliuer_type_tian = [0x16, 0x36];
        let erliuer_type_jia = [0x06, 0x06];
        if (this.GetCardsindexOf(erliuer_type_tian, erliuer_type_jia, cards)) {
            return gameProto.cardType.ERLIUER;
        }
        //王＋两个红六等于猫猫二
        let maomaoer_type_tian = [0x4F];
        let maomaoer_type_jia = [0x06, 0x26];
        if (this.GetCardsindexOf(maomaoer_type_tian, maomaoer_type_jia, cards)) {
            return gameProto.cardType.MAOMAOER;
        }
        //膏药二
        let gaoyaoer_type_tian = [0x07, 0x27];
        let gaoyaoer_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(gaoyaoer_type_tian, gaoyaoer_type_jia, cards)) {
            return gameProto.cardType.GAOYAOER;
        }
        //丁九二
        let dingjiuer_type_tian = [0x23];
        let dingjiuer_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(dingjiuer_type_tian, dingjiuer_type_jia, cards)) {
            return gameProto.cardType.DINGJIUER;
        }

        //五七二
        let wuqier_type_tian = [0x15, 0x35];
        let wuqier_type_jia = [0x17, 0x37];
        if (this.GetCardsindexOf(wuqier_type_tian, wuqier_type_jia, cards)) {
            return gameProto.cardType.WUQIER;
        }
        //1点
        //地九王
        let dijiuwang_type_tian = [0x02, 0x22];
        let dijiuwang_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(dijiuwang_type_tian, dijiuwang_type_jia, cards)) {
            return gameProto.cardType.DIJIUWANG;
        }
        //人十一
        let reshiyi_type_tian = [0x08, 0x28];
        let reshiyi_type_jia = [0x23];
        if (this.GetCardsindexOf(reshiyi_type_tian, reshiyi_type_jia, cards)) {
            return gameProto.cardType.RESHIYI;
        }
        //和十一
        let heshiyi_type_tian = [0x04, 0x24];
        let heshiyi_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(heshiyi_type_tian, heshiyi_type_jia, cards)) {
            return gameProto.cardType.HESHIYI;
        }
        //梅十一
        let meishiyi_type_tian = [0x1A, 0x3A];
        let meishiyi_type_jia = [0x1B, 0x3B];
        if (this.GetCardsindexOf(meishiyi_type_tian, meishiyi_type_jia, cards)) {
            return gameProto.cardType.MEISHIYI;
        }
        //四七一
        let siqiyi_type_tian = [0x14, 0x34];
        let siqiyi_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(siqiyi_type_tian, siqiyi_type_jia, cards)) {
            return gameProto.cardType.SIQIYI;
        }
        //长三一
        let changsanyi_type_tian = [0x16, 0x36];
        let changsanyi_type_jia = [0x15, 0x35];
        if (this.GetCardsindexOf(changsanyi_type_tian, changsanyi_type_jia, cards)) {
            return gameProto.cardType.CHANGSANYI;
        }
        //斧十一
        let fushiyi_type_tian = [0x1B, 0x3B];
        let fushiyi_type_jia = [0x0A, 0x2A];
        if (this.GetCardsindexOf(fushiyi_type_tian, fushiyi_type_jia, cards)) {
            return gameProto.cardType.FUSHIYI;
        }
        //五六一
        let wuliuyi_type_tian = [0x15, 0x35];
        let wuliuyi_type_jia = [0x06, 0x26];
        if (this.GetCardsindexOf(wuliuyi_type_tian, wuliuyi_type_jia, cards)) {
            return gameProto.cardType.WULIUYI;
        }
        //丁八一
        let dingbayi_type_tian = [0x23];
        let dingbayi_type_jia = [0x18, 0x38];
        if (this.GetCardsindexOf(dingbayi_type_tian, dingbayi_type_jia, cards)) {
            return gameProto.cardType.DINGBAYI;
        }
        //0点
        //四六皱
        let siliuzhou_type_tian = [0x04, 0x24, 0x14, 0x34];
        let siliuzhou_type_jia = [0x06, 0x26, 0x16, 0x36];
        if (this.GetCardsindexOf(siliuzhou_type_tian, siliuzhou_type_jia, cards)) {
            return gameProto.cardType.SILIUZHOU;
        }
        //四六皱
        siliuzhou_type_tian = [0x04, 0x24];
        siliuzhou_type_jia = [0x4F];
        if (this.GetCardsindexOf(siliuzhou_type_tian, siliuzhou_type_jia, cards)) {
            return gameProto.cardType.SILIUZHOU;
        }
        //双花十
        let shuanghuashi_type_tian = [0x1A, 0x3A];
        let shuanghuashi_type_jia = [0x0A, 0x2A];
        if (this.GetCardsindexOf(shuanghuashi_type_tian, shuanghuashi_type_jia, cards)) {
            return gameProto.cardType.SHUANGHUASHI;
        }
        //斧九皱
        let fujiuzhou_type_tian = [0x1B, 0x3B];
        let fujiuzhou_type_jia = [0x19, 0x39];
        if (this.GetCardsindexOf(fujiuzhou_type_tian, fujiuzhou_type_jia, cards)) {
            return gameProto.cardType.FUJIUZHOU;
        }
        //丁七皱
        let dingqizhou_type_tian = [0x23];
        let dingqizhou_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.GetCardsindexOf(dingqizhou_type_tian, dingqizhou_type_jia, cards)) {
            return gameProto.cardType.DINGQIZHOU;
        }

        return this.getCardsPoint(cards);
    }

    /*
     * 比较两幅牌的大小，0和，1cards1大，-1cards2大
     * @param cards1 Array 牌1
     * @param cards2 Array 牌2
     * @return Number 结果
     */
    compareCards(cards1, cards2, drawType) {

        //牌1点数
        let point1 = this.getCardsPoint(cards1);
        //牌2点数
        let point2 = this.getCardsPoint(cards2);
        if (point1 != point2) {
            //点数不相同
            return point1 - point2;
        } else {
            //如果点数相同
            if (drawType == gameProto.drawType.NONEWIN) {
                //平局
                return 0;
            } else if (drawType == gameProto.drawType.BANKERWIN) {
                //同点庄家赢
                return 1;

            } else if (drawType == gameProto.drawType.COLORWIN) {
                //同点比花色
                let sort_fun = (a, b) => {
                    return b - a;
                };
                let result = 0;
                for (let i = 0; i < cards1.length; i++) {
                    if (cards1[i] && cards2[i]) {

                        if (cards1[i] > cards2[i]) {
                            result = 1;
                            break;
                        } else if (cards1[i] < cards2[i]) {
                            result = -1;
                            break;
                        } else {
                            continue;
                        }
                    } else {
                        break;
                    }
                }
                return result;
            }
        }
    }
}

module.exports = new CXLogic();