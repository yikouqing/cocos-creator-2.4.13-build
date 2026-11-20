/*
 * 捞腌菜算法
 */
const ApiDzpk = require('./ApiDzpk');

class DZPKLogic {
    constructor() {
        this.cards = [];
    }

    /*
     * 洗牌
       @pokerCount:牌的数量
     */
    washCards() {
        this.cards = [
            0x02, 0x04, 0x06, 0x07, 0x08, 0x0A, 0x0C, // 方块2 4 6 7 8 10 Q
            0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, // 梅花 4 5 6 7 8 9 10 J
            0x22, 0x23, 0x24, 0x26, 0x27, 0x28, 0x2A, 0x2C, // 红桃2 3 4 6 7 8 10 Q
            0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, // 黑桃4 5 6 7 8 9 10 J
            0x4F, //大王
        ];

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
        let value = card & 0x0f;
        if (card == 0x4F) {
            value++;
        }
        return value;
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
        return point % 10;
    }
    //获取单牌的点数
    /*
     *card 一张牌
     */
    getCardsIndividual(card) {
        let typesun = 2000;
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
    getCardsindexOf(Array_one = [], Array_two = [], cards = []) {
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
    getCardsTypeCount(Type) {
        let typesun = 2000;
        let indexOf = ApiDzpk.cardType.indexOf(Type);
        if (indexOf != -1) {
            //梅十九 板五九 丁长九 
            if (Type == ApiDzpk.cardType.MEISHIJIU || Type == ApiDzpk.cardType.BANWUJIU || Type == ApiDzpk.cardType.DINGCHANGJIU) {
                Type = ApiDzpk.cardType.MEISHIJIU;
            }
            //乌龙九 苕十九 丁猫九
            if (Type == ApiDzpk.cardType.WULONGJIU || Type == ApiDzpk.cardType.SHAOSHIJIU || Type == ApiDzpk.cardType.DINGMAOJIU) {
                Type = ApiDzpk.cardType.WULONGJIU;
            }
            //斧七八 苕十八 
            if (Type == ApiDzpk.cardType.FUQIBA || Type == ApiDzpk.cardType.SHAOSHIBA) {
                Type = ApiDzpk.cardType.FUQIBA;
            }
            //梅十七 丁板七 斧长七
            if (Type == ApiDzpk.cardType.MEISHIQI || Type == ApiDzpk.cardType.DINGBANQI || Type == ApiDzpk.cardType.FUCHANGQI) {
                Type = ApiDzpk.cardType.FUQIBA;
            }
            //斧猫七 苕十七
            if (Type == ApiDzpk.cardType.FUMAOQI || Type == ApiDzpk.cardType.SHAOSHIQI) {
                Type = ApiDzpk.cardType.FUMAOQI;
            }
            //梅十六 长三六
            if (Type == ApiDzpk.cardType.MEISHILIU || Type == ApiDzpk.cardType.CHANGSANLIU) {
                Type = ApiDzpk.cardType.MEISHILIU;
            }
            //斧五六 苕十六 膏药六
            if (Type == ApiDzpk.cardType.FUWULIU || Type == ApiDzpk.cardType.SHAOSHILIU || Type == ApiDzpk.cardType.GAOYAOLIU) {
                Type = ApiDzpk.cardType.FUWULIU;
            }
            //梅十五 板斧五 长三五
            if (Type == ApiDzpk.cardType.MEISHIWU || Type == ApiDzpk.cardType.BANFUWU || Type == ApiDzpk.cardType.CHANGSANWU) {
                Type = ApiDzpk.cardType.MEISHIWU;
            }
            //苕十五 猫九五 膏药五
            if (Type == ApiDzpk.cardType.SHAOSHIWU || Type == ApiDzpk.cardType.MAOJIUWU || Type == ApiDzpk.cardType.GAOYAOWU) {
                Type = ApiDzpk.cardType.SHAOSHIWU;
            }
            //梅十四 长十四
            if (Type == ApiDzpk.cardType.MEISHISI || Type == ApiDzpk.cardType.CHANGSHISI) {
                Type = ApiDzpk.cardType.MEISHISI;
            }
            //丁斧四 六八四  双花七
            if (Type == ApiDzpk.cardType.DINGFUSI || Type == ApiDzpk.cardType.LIUBASI || Type == ApiDzpk.cardType.SHUANGHUAQI) {
                Type = ApiDzpk.cardType.DINGFUSI;
            }
            //梅十三 四九三 长十三
            if (Type == ApiDzpk.cardType.MEISHISAN || Type == ApiDzpk.cardType.SIJIUSAN || Type == ApiDzpk.cardType.CHANGSHISAN) {
                Type = ApiDzpk.cardType.MEISHISAN;
            }
            //苕十三 六七三
            if (Type == ApiDzpk.cardType.SHAOSHISAN || Type == ApiDzpk.cardType.LIUQISAN) {
                Type = ApiDzpk.cardType.SHAOSHISAN;
            }
            //四八二 二六二
            if (Type == ApiDzpk.cardType.SIBAER || Type == ApiDzpk.cardType.ERLIUER) {
                Type = ApiDzpk.cardType.SIBAER;
            }
            //丁九二 五七二
            if (Type == ApiDzpk.cardType.DINGJIUER || Type == ApiDzpk.cardType.WUQIER) {
                Type = ApiDzpk.cardType.DINGJIUER;
            }
            //梅十一 四七一 长三一
            if (Type == ApiDzpk.cardType.MEISHIYI || Type == ApiDzpk.cardType.SIQIYI || Type == ApiDzpk.cardType.CHANGSANYI) {
                Type = ApiDzpk.cardType.MEISHIYI;
            }
            //斧十一 五六一
            if (Type == ApiDzpk.cardType.FUSHIYI || Type == ApiDzpk.cardType.WULIUYI) {
                Type = ApiDzpk.cardType.FUSHIYI;
            }
        }
        return typesun - Type;
    }

    /*
     * 获取2张牌的类型
     * @param cards Array 牌
     * @return String 类型
     */
    getCardsType(cards) {
        if (cards.length != 2) {
            return false;
        }
        //丁二皇
        if (cards.indexOf(0x4F) != -1 && cards.indexOf(0X23) != -1) {
            return ApiDzpk.cardType.DINGERHUANG;
        }
        //天牌
        if (cards.indexOf(0x0C) != -1 && cards.indexOf(0x2C) != -1) {
            return ApiDzpk.cardType.TIANPAI;
        }
        //地牌
        if (cards.indexOf(0x02) != -1 && cards.indexOf(0x22) != -1) {
            return ApiDzpk.cardType.DIPAI;
        }
        //人牌
        if (cards.indexOf(0x08) != -1 && cards.indexOf(0x28) != -1) {
            return ApiDzpk.cardType.REPAI;
        }
        //和牌
        if (cards.indexOf(0x04) != -1 && cards.indexOf(0x24) != -1) {
            return ApiDzpk.cardType.HEPAI;
        }
        //梅十
        if (cards.indexOf(0x1A) != -1 && cards.indexOf(0x3A) != -1) {
            return ApiDzpk.cardType.MEISHI;
        }
        //板凳
        if (cards.indexOf(0x14) != -1 && cards.indexOf(0x34) != -1) {
            return ApiDzpk.cardType.BANDENG;
        }
        //长三
        if (cards.indexOf(0x16) != -1 && cards.indexOf(0x36) != -1) {
            return ApiDzpk.cardType.CHANGSAN;
        }
        //斧头
        if (cards.indexOf(0x1B) != -1 && cards.indexOf(0x3B) != -1) {
            return ApiDzpk.cardType.FUTOU;
        }
        //苕十
        if (cards.indexOf(0x0A) != -1 && cards.indexOf(0x2A) != -1) {
            return ApiDzpk.cardType.SHAOSHI;
        }
        //猫猫
        if (cards.indexOf(0x06) != -1 && cards.indexOf(0x26) != -1) {
            return ApiDzpk.cardType.MAOMAO;
        }
        //膏药
        if (cards.indexOf(0x07) != -1 && cards.indexOf(0x27) != -1) {
            return ApiDzpk.cardType.GAOYAO;
        }
        //黑9
        if (cards.indexOf(0x19) != -1 && cards.indexOf(0x39) != -1) {
            return ApiDzpk.cardType.HEIJIU;
        }
        //黑8
        if (cards.indexOf(0x18) != -1 && cards.indexOf(0x38) != -1) {
            return ApiDzpk.cardType.HEIBA;
        }
        //黑7
        if (cards.indexOf(0x17) != -1 && cards.indexOf(0x37) != -1) {
            return ApiDzpk.cardType.HEIQI;
        }
        //小5
        if (cards.indexOf(0x15) != -1 && cards.indexOf(0x35) != -1) {
            return ApiDzpk.cardType.XIAOWU;
        }
        //天九王
        let tianjiuwang_type_tian = [0x0C, 0x2C];
        let tianjiuwang_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(tianjiuwang_type_tian, tianjiuwang_type_jia, cards)) {
            return ApiDzpk.cardType.TIANJIUWANG;
        }
        //天红杠
        let tianhonggang_type_tian = [0x0C, 0x2C];
        let tianhonggang_type_jia = [0x08, 0x28];
        if (this.getCardsindexOf(tianhonggang_type_tian, tianhonggang_type_jia, cards)) {
            return ApiDzpk.cardType.TIANHONGGANG;
        }
        //天黑杠
        let tianheigang_type_tian = [0x0C, 0x2C];
        let tianheigang_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(tianheigang_type_tian, tianheigang_type_jia, cards)) {
            return ApiDzpk.cardType.TIANHEIGANG;
        }
        //地红杠
        let dihonggang_type_tian = [0x0C, 0x2C];
        let dihonggang_type_jia = [0x08, 0x28];
        if (this.getCardsindexOf(dihonggang_type_tian, dihonggang_type_jia, cards)) {
            return ApiDzpk.cardType.DIHONGGANG;
        }
        //地黑杠
        let diheigang_type_tian = [0x0C, 0x2C];
        let diheigang_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(diheigang_type_tian, diheigang_type_jia, cards)) {
            return ApiDzpk.cardType.DIHEIGANG;
        }
        //9点
        //天官九
        let tianguanjiu_type_tian = [0x0C, 0x2C];
        let tianguanjiu_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(tianguanjiu_type_tian, tianguanjiu_type_jia, cards)) {
            return ApiDzpk.cardType.TIANGUANJIU;
        }
        //地官九
        let diguanjiu_type_tian = [0x02, 0x22];
        let diguanjiu_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(diguanjiu_type_tian, diguanjiu_type_jia, cards)) {
            return ApiDzpk.cardType.DIGUANJIU;
        }
        //人官九
        let reguanjiu_type_tian = [0x08, 0x28];
        let reguanjiu_type_jia = [0x1B, 0x3B];
        if (this.getCardsindexOf(reguanjiu_type_tian, reguanjiu_type_jia, cards)) {
            return ApiDzpk.cardType.REGUANJIU;
        }
        //和官九
        let heguanjiu_type_tian = [0x04, 0x24];
        let heguanjiu_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(heguanjiu_type_tian, heguanjiu_type_jia, cards)) {
            return ApiDzpk.cardType.HEGUANJIU;
        }
        //梅十九
        let meishijiu_type_tian = [0x1A, 0x3A];
        let meishijiu_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(meishijiu_type_tian, meishijiu_type_jia, cards)) {
            return ApiDzpk.cardType.MEISHIJIU;
        }
        //板五九
        let banwujiu_type_tian = [0x14, 0x34];
        let banwujiu_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(banwujiu_type_tian, banwujiu_type_jia, cards)) {
            return ApiDzpk.cardType.BANWUJIU;
        }
        //丁长九
        let dingchangjiu_type_tian = [0x23];
        let dingchangjiu_type_jia = [0x16, 0x36];
        if (this.getCardsindexOf(dingchangjiu_type_tian, dingchangjiu_type_jia, cards)) {
            return ApiDzpk.cardType.DINGCHANGJIU;
        }
        //乌龙九
        let wulongjiu_type_tian = [0x1B, 0x3B];
        let wulongjiu_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(wulongjiu_type_tian, wulongjiu_type_jia, cards)) {
            return ApiDzpk.cardType.WULONGJIU;
        }
        //苕十九
        let shaoshijiu_type_tian = [0x0A, 0x2A];
        let shaoshijiu_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(shaoshijiu_type_tian, shaoshijiu_type_jia, cards)) {
            return ApiDzpk.cardType.SHAOSHIJIU;
        }
        //丁猫九
        let dingmaojiu_type_tian = [0x23];
        let dingmaojiu_type_jia = [0x06, 0x26];
        if (this.getCardsindexOf(dingmaojiu_type_tian, dingmaojiu_type_jia, cards)) {
            return ApiDzpk.cardType.DINGMAOJIU;
        }
        //8点
        //天官八
        let tianguangba_type_tian = [0x0C, 0x2C];
        let tianguangba_type_jia = [0x06, 0x26, 0x16, 0x36, 0x4F];
        if (this.getCardsindexOf(tianguangba_type_tian, tianguangba_type_jia, cards)) {
            return ApiDzpk.cardType.TIANGUANBA;
        }
        //地官八
        let diguanba_type_tian = [0x02, 0x22];
        let diguanba_type_jia = [0x06, 0x26, 0x16, 0x36, 0x4F];
        if (this.getCardsindexOf(diguanba_type_tian, diguanba_type_jia, cards)) {
            return ApiDzpk.cardType.DIGUANBA;
        }
        //人十八
        let reshiba_type_tian = [0x08, 0x28];
        let reshiba_type_jia = [0x0A, 0x2A, 0x1A, 0x3A];
        if (this.getCardsindexOf(reshiba_type_tian, reshiba_type_jia, cards)) {
            return ApiDzpk.cardType.RESHIBA;
        }
        //和官八
        let heguanba_type_tian = [0x04, 0x24];
        let heguanba_type_jia = [0x14, 0x34];
        if (this.getCardsindexOf(heguanba_type_tian, heguanba_type_jia, cards)) {
            return ApiDzpk.cardType.HEGUANBA;
        }
        //梅十八
        let meishiba_type_tian = [0x1A, 0x3A];
        let meishiba_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(meishiba_type_tian, meishiba_type_jia, cards)) {
            return ApiDzpk.cardType.MEISHIBA;
        }
        //斧七八
        let fuqiba_type_tian = [0x1B, 0x3B];
        let fuqiba_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(fuqiba_type_tian, fuqiba_type_jia, cards)) {
            return ApiDzpk.cardType.FUQIBA;
        }
        //苕十八
        let shaoshiba_type_tian = [0x0A, 0x2A];
        let shaoshiba_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(shaoshiba_type_tian, shaoshiba_type_jia, cards)) {
            return ApiDzpk.cardType.SHAOSHIBA;
        }
        //丁五八
        let dingwuba_type_tian = [0x23];
        let dingwuba_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(dingwuba_type_tian, dingwuba_type_jia, cards)) {
            return ApiDzpk.cardType.DINGWUBA;
        }
        //7点
        //天官七
        let tianguanqi_type_tian = [0x0C, 0x2C];
        let tianguanqi_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(tianguanqi_type_tian, tianguanqi_type_jia, cards)) {
            return ApiDzpk.cardType.TIANGUANQI;
        }
        //地官七
        let diguanqi_type_tian = [0x02, 0x22];
        let diguanqi_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(diguanqi_type_tian, diguanqi_type_jia, cards)) {
            return ApiDzpk.cardType.DIGUANQI;
        }
        //苏州七
        let suzhouqi_type_tian = [0x08, 0x28];
        let suzhouqi_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(suzhouqi_type_tian, suzhouqi_type_jia, cards)) {
            return ApiDzpk.cardType.SHUZHOUQI;
        }
        //丁和七
        let dingheqi_type_tian = [0x23];
        let dingheqi_type_jia = [0x04, 0x24];
        if (this.getCardsindexOf(dingheqi_type_tian, dingheqi_type_jia, cards)) {
            return ApiDzpk.cardType.DINGHEQI;
        }
        //梅十七
        let meiheqi_type_tian = [0x1A, 0x3A];
        let meiheqi_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(meiheqi_type_tian, meiheqi_type_jia, cards)) {
            return ApiDzpk.cardType.MEISHIQI;
        }
        //丁板七
        let dingbanqi_type_tian = [0x23];
        let dingbanq_type_jia = [0x14, 0x34];
        if (this.getCardsindexOf(dingbanqi_type_tian, dingbanq_type_jia, cards)) {
            return ApiDzpk.cardType.DINGBANQI;
        }
        //斧长七
        let fuchangqi_type_tian = [0x1B, 0x3B];
        let fuchangqi_type_jia = [0x16, 0x36];
        if (this.getCardsindexOf(fuchangqi_type_tian, fuchangqi_type_jia, cards)) {
            return ApiDzpk.cardType.FUCHANGQI;
        }
        //斧猫七
        let fumaoqi_type_tian = [0x1B, 0x3B];
        let fumaoqi_type_jia = [0x06, 0x26];
        if (this.getCardsindexOf(fumaoqi_type_tian, fumaoqi_type_jia, cards)) {
            return ApiDzpk.cardType.FUMAOQI;
        }
        //苕十七
        let shaoshiqi_type_tian = [0x0A, 0x2A];
        let shaoshiqi_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(shaoshiqi_type_tian, shaoshiqi_type_jia, cards)) {
            return ApiDzpk.cardType.SHAOSHIQI;
        }
        //非洲七
        let feizhouqi_type_tian = [0x18, 0x38];
        let feizhouqi_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(feizhouqi_type_tian, feizhouqi_type_jia, cards)) {
            return ApiDzpk.cardType.FEIZHOUQI;
        }
        //6点
        //天官六
        let tianguanliu_type_tian = [0x0C, 0x2C];
        let tianguanliu_type_jia = [0x04, 0x24, 0x14, 0x34];
        if (this.getCardsindexOf(tianguanliu_type_tian, tianguanliu_type_jia, cards)) {
            return ApiDzpk.cardType.TIANGUANLIU;
        }
        //地官六
        let diguanliu_type_tian = [0x02, 0x22];
        let diguanliu_type_jia = [0x04, 0x24, 0x14, 0x34];
        if (this.getCardsindexOf(diguanliu_type_tian, diguanliu_type_jia, cards)) {
            return ApiDzpk.cardType.DIGUANLIU;
        }
        //元宝六
        let yuanbaoliu_type_tian = [0x08, 0x28];
        let yuanbaoliu_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(yuanbaoliu_type_tian, yuanbaoliu_type_jia, cards)) {
            return ApiDzpk.cardType.YUANBAOLIU;
        }
        //梅十六
        let meishiliu_type_tian = [0x1A, 0x3A];
        let meishiliu_type_jia = [0x06, 0x26, 0x16, 0x36];
        if (this.getCardsindexOf(meishiliu_type_tian, meishiliu_type_jia, cards)) {
            return ApiDzpk.cardType.MEISHILIU;
        }
        //长三六
        let changsanliu_type_tian = [0x16, 0x36];
        let changsanliu_type_jia = [0x0A, 0x2A];
        if (this.getCardsindexOf(changsanliu_type_tian, changsanliu_type_jia, cards)) {
            return ApiDzpk.cardType.CHANGSANLIU;
        }
        //斧五六
        let fuwuliu_type_tian = [0x1B, 0x3B];
        let fuwuliu_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(fuwuliu_type_tian, fuwuliu_type_jia, cards)) {
            return ApiDzpk.cardType.FUWULIU;
        }
        //苕十六
        let shaoshiliu_type_tian = [0x0A, 0x2A];
        let shaoshiliu_type_jia = [0x06, 0x26];
        if (this.getCardsindexOf(shaoshiliu_type_tian, shaoshiliu_type_jia, cards)) {
            return ApiDzpk.cardType.SHAOSHILIU;
        }
        //膏药六
        let gaoyaoliu_type_tian = [0x07, 0x27];
        let gaoyaoliu_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(gaoyaoliu_type_tian, gaoyaoliu_type_jia, cards)) {
            return ApiDzpk.cardType.GAOYAOLIU;
        }
        //七九六
        let qijiuliu_type_tian = [0x17, 0x37];
        let qijiuliu_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(qijiuliu_type_tian, qijiuliu_type_jia, cards)) {
            return ApiDzpk.cardType.QIJIULIU;
        }
        //5点
        //天丁五
        let tiandingwu_type_tian = [0x0C, 0x2C];
        let tiandingwu_type_jia = [0x23];
        if (this.getCardsindexOf(tiandingwu_type_tian, tiandingwu_type_jia, cards)) {
            return ApiDzpk.cardType.TIANDINGWU;
        }
        //地丁五
        let didingwu_type_tian = [0x02, 0x22];
        let didingwu_type_jia = [0x23];
        if (this.getCardsindexOf(didingwu_type_tian, didingwu_type_jia, cards)) {
            return ApiDzpk.cardType.DIDINGWU;
        }
        //人十五
        let reshiwu_type_tian = [0x08, 0x28];
        let reshiwu_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(reshiwu_type_tian, reshiwu_type_jia, cards)) {
            return ApiDzpk.cardType.RESHIWU;
        }
        //和斧五
        let hefuwu_type_tian = [0x04, 0x24];
        let hefuwu_type_jia = [0x1B, 0x3B];
        if (this.getCardsindexOf(hefuwu_type_tian, hefuwu_type_jia, cards)) {
            return ApiDzpk.cardType.HEFUWU;
        }
        //梅十五
        let meishiwu_type_tian = [0x1A, 0x3A];
        let meishiwu_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(meishiwu_type_tian, meishiwu_type_jia, cards)) {
            return ApiDzpk.cardType.MEISHIWU;
        }
        //板斧五
        let banfuwu_type_tian = [0x1A, 0x3A];
        let banfuwu_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(banfuwu_type_tian, banfuwu_type_jia, cards)) {
            return ApiDzpk.cardType.BANFUWU;
        }
        //长三五
        let changsanwu_type_tian = [0x1A, 0x3A];
        let changsanwu_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(changsanwu_type_tian, changsanwu_type_jia, cards)) {
            return ApiDzpk.cardType.CHANGSANWU;
        }
        //苕十五
        let shaoshiwu_type_tian = [0x0A, 0x2A];
        let shaoshiwu_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(shaoshiwu_type_tian, shaoshiwu_type_jia, cards)) {
            return ApiDzpk.cardType.SHAOSHIWU;
        }
        //猫九五
        let maojiuwu_type_tian = [0x06, 0x26];
        let maojiuwu_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(maojiuwu_type_tian, maojiuwu_type_jia, cards)) {
            return ApiDzpk.cardType.MAOJIUWU;
        }
        //膏药五
        let gaoyaowu_type_tian = [0x07, 0x27];
        let gaoyaowu_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(gaoyaowu_type_tian, gaoyaowu_type_jia, cards)) {
            return ApiDzpk.cardType.GAOYAOWU;
        }
        //七八五
        let qibawu_type_tian = [0x17, 0x37];
        let qibawu_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(qibawu_type_tian, qibawu_type_jia, cards)) {
            return ApiDzpk.cardType.QIBAWU;
        }
        //4点
        //天地公子
        let tiandigongzi_type_tian = [0x0C, 0x2C];
        let tiandigongzi_type_jia = [0x02, 0x22];
        if (this.getCardsindexOf(tiandigongzi_type_tian, tiandigongzi_type_jia, cards)) {
            return ApiDzpk.cardType.TIANDIGONGZI;
        }
        //人十四
        let reshisi_type_tian = [0x08, 0x28];
        let reshisi_type_jia = [0x06, 0x26, 0x16, 0x36];
        if (this.getCardsindexOf(reshisi_type_tian, reshisi_type_jia, cards)) {
            return ApiDzpk.cardType.RESHISI;
        }
        //和十四
        let heshisi_type_tian = [0x04, 0x24];
        let heshisi_type_jia = [0x0A, 0x2A, 0x1A, 0x3A];
        if (this.getCardsindexOf(heshisi_type_tian, heshisi_type_jia, cards)) {
            return ApiDzpk.cardType.HESHISI;
        }
        //梅十四
        let meishisi_type_tian = [0x1A, 0x3A];
        let meishisi_type_jia = [0x14, 0x34];
        if (this.getCardsindexOf(meishisi_type_tian, meishisi_type_jia, cards)) {
            return ApiDzpk.cardType.MEISHISI;
        }
        //长十四
        let changshisi_type_tian = [0x16, 0x36];
        let changshisi_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(changshisi_type_tian, changshisi_type_jia, cards)) {
            return ApiDzpk.cardType.CHANGSHISI;
        }
        //丁斧四
        let dingfusi_type_tian = [0x03];
        let dingfusi_type_jia = [0x1B, 0x3B];
        if (this.getCardsindexOf(dingfusi_type_tian, dingfusi_type_jia, cards)) {
            return ApiDzpk.cardType.DINGFUSI;
        }
        //六八四
        let liubasi_type_tian = [0x06, 0x26];
        let liubasi_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(liubasi_type_tian, liubasi_type_jia, cards)) {
            return ApiDzpk.cardType.LIUBASI;
        }
        //双花七
        let shuanghuaqi_type_tian = [0x07, 0x27];
        let shuanghuaqi_type_jia = [0x17, 0x37];
        if (this.getCardsindexOf(shuanghuaqi_type_tian, shuanghuaqi_type_jia, cards)) {
            return ApiDzpk.cardType.SHUANGHUAQI;
        }
        //五九四
        let wujiusi_type_tian = [0x15, 0x35];
        let wujiusi_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(wujiusi_type_tian, wujiusi_type_jia, cards)) {
            return ApiDzpk.cardType.WUJIUSI;
        }
        //3点
        //天斧三
        let tianfusan_type_tian = [0x0C, 0x2C];
        let tianfusan_type_jia = [0x1B, 0x3B];
        if (this.getCardsindexOf(tianfusan_type_tian, tianfusan_type_jia, cards)) {
            return ApiDzpk.cardType.TIANFUSAN;
        }
        //地斧三
        let difusan_type_tian = [0x02, 0x22];
        let difusan_type_jia = [0x1B, 0x3B];
        if (this.getCardsindexOf(difusan_type_tian, difusan_type_jia, cards)) {
            return ApiDzpk.cardType.DIFUSAN;
        }
        //人十三
        let reshisan_type_tian = [0x08, 0x28];
        let reshisan_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(reshisan_type_tian, reshisan_type_jia, cards)) {
            return ApiDzpk.cardType.RESHISAN;
        }
        //和十三
        let heshisan_type_tian = [0x04, 0x24];
        let heshisan_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(heshisan_type_tian, heshisan_type_jia, cards)) {
            return ApiDzpk.cardType.HESHISAN;
        }
        //梅十三
        let meishisan_type_tian = [0x1A, 0x3A];
        let meishisan_type_jia = [0x23];
        if (this.getCardsindexOf(meishisan_type_tian, meishisan_type_jia, cards)) {
            return ApiDzpk.cardType.MEISHISAN;
        }
        //四九三
        let sijiusan_type_tian = [0x14, 0x34];
        let sijiusan_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(sijiusan_type_tian, sijiusan_type_jia, cards)) {
            return ApiDzpk.cardType.SIJIUSAN;
        }
        //长十三
        let changshisan_type_tian = [0x16, 0x36];
        let changshisan_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(changshisan_type_tian, changshisan_type_jia, cards)) {
            return ApiDzpk.cardType.CHANGSHISAN;
        }
        //苕十三
        let shaoshisan_type_tian = [0x0A, 0x2A];
        let shaoshisan_type_jia = [0x23];
        if (this.getCardsindexOf(shaoshisan_type_tian, shaoshisan_type_jia, cards)) {
            return ApiDzpk.cardType.SHAOSHISAN;
        }
        //六七三
        let liuqisan_type_tian = [0x06, 0x26];
        let liuqisan_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(liuqisan_type_tian, liuqisan_type_jia, cards)) {
            return ApiDzpk.cardType.LIUQISAN;
        }
        //五八三
        let wubasan_type_tian = [0x15, 0x35];
        let wubasan_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(wubasan_type_tian, wubasan_type_jia, cards)) {
            return ApiDzpk.cardType.WUBASAN;
        }
        //2点
        //天十二
        let tianshier_type_tian = [0x0C, 0x2C];
        let tianshier_type_jia = [0x0A, 0x2A, 0x1A, 0x3A];
        if (this.getCardsindexOf(tianshier_type_tian, tianshier_type_jia, cards)) {
            return ApiDzpk.cardType.TIANSHIER;
        }
        //地十二
        let dishier_type_tian = [0x02, 0x22];
        let dishier_type_jia = [0x0A, 0x2A, 0x1A, 0x3A];
        if (this.getCardsindexOf(dishier_type_tian, dishier_type_jia, cards)) {
            return ApiDzpk.cardType.DISHIER;
        }
        //人十二
        let reshier_type_tian = [0x08, 0x28];
        let reshier_type_jia = [0x04, 0x24, 0x14, 0x34];
        if (this.getCardsindexOf(reshier_type_tian, reshier_type_jia, cards)) {
            return ApiDzpk.cardType.RESHIER;
        }
        //和十二
        let heshier_type_tian = [0x04, 0x24];
        let heshier_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(heshier_type_tian, heshier_type_jia, cards)) {
            return ApiDzpk.cardType.HESHIER;
        }
        //四八二
        let sibaer_type_tian = [0x14, 0x34];
        let sibaer_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(sibaer_type_tian, sibaer_type_jia, cards)) {
            return ApiDzpk.cardType.SIBAER;
        }
        //二六二
        let erliuer_type_tian = [0x16, 0x36];
        let erliuer_type_jia = [0x06, 0x06];
        if (this.getCardsindexOf(erliuer_type_tian, erliuer_type_jia, cards)) {
            return ApiDzpk.cardType.ERLIUER;
        }
        //膏药二
        let gaoyaoer_type_tian = [0x07, 0x27];
        let gaoyaoer_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(gaoyaoer_type_tian, gaoyaoer_type_jia, cards)) {
            return ApiDzpk.cardType.GAOYAOER;
        }
        //丁九二
        let dingjiuer_type_tian = [0x23];
        let dingjiuer_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(dingjiuer_type_tian, dingjiuer_type_jia, cards)) {
            return ApiDzpk.cardType.DINGJIUER;
        }

        //五七二
        let wuqier_type_tian = [0x15, 0x35];
        let wuqier_type_jia = [0x17, 0x37];
        if (this.getCardsindexOf(wuqier_type_tian, wuqier_type_jia, cards)) {
            return ApiDzpk.cardType.WUQIER;
        }
        //1点
        //地九王
        let dijiuwang_type_tian = [0x02, 0x22];
        let dijiuwang_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(dijiuwang_type_tian, dijiuwang_type_jia, cards)) {
            return ApiDzpk.cardType.DIJIUWANG;
        }
        //人十一
        let reshiyi_type_tian = [0x08, 0x28];
        let reshiyi_type_jia = [0x23];
        if (this.getCardsindexOf(reshiyi_type_tian, reshiyi_type_jia, cards)) {
            return ApiDzpk.cardType.RESHIYI;
        }
        //和十一
        let heshiyi_type_tian = [0x04, 0x24];
        let heshiyi_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(heshiyi_type_tian, heshiyi_type_jia, cards)) {
            return ApiDzpk.cardType.HESHIYI;
        }
        //梅十一
        let meishiyi_type_tian = [0x1A, 0x3A];
        let meishiyi_type_jia = [0x1B, 0x3B];
        if (this.getCardsindexOf(meishiyi_type_tian, meishiyi_type_jia, cards)) {
            return ApiDzpk.cardType.MEISHIYI;
        }
        //四七一
        let siqiyi_type_tian = [0x14, 0x34];
        let siqiyi_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(siqiyi_type_tian, siqiyi_type_jia, cards)) {
            return ApiDzpk.cardType.SIQIYI;
        }
        //长三一
        let changsanyi_type_tian = [0x16, 0x36];
        let changsanyi_type_jia = [0x15, 0x35];
        if (this.getCardsindexOf(changsanyi_type_tian, changsanyi_type_jia, cards)) {
            return ApiDzpk.cardType.CHANGSANYI;
        }
        //斧十一
        let fushiyi_type_tian = [0x1B, 0x3B];
        let fushiyi_type_jia = [0x0A, 0x2A];
        if (this.getCardsindexOf(fushiyi_type_tian, fushiyi_type_jia, cards)) {
            return ApiDzpk.cardType.FUSHIYI;
        }
        //五六一
        let wuliuyi_type_tian = [0x15, 0x35];
        let wuliuyi_type_jia = [0x06, 0x26];
        if (this.getCardsindexOf(wuliuyi_type_tian, wuliuyi_type_jia, cards)) {
            return ApiDzpk.cardType.WULIUYI;
        }
        //丁八一
        let dingbayi_type_tian = [0x23];
        let dingbayi_type_jia = [0x18, 0x38];
        if (this.getCardsindexOf(dingbayi_type_tian, dingbayi_type_jia, cards)) {
            return ApiDzpk.cardType.DINGBAYI;
        }
        //0点
        //四六皱
        let siliuzhou_type_tian = [0x04, 0x24, 0x14, 0x34];
        let siliuzhou_type_jia = [0x06, 0x26, 0x16, 0x36];
        if (this.getCardsindexOf(siliuzhou_type_tian, siliuzhou_type_jia, cards)) {
            return ApiDzpk.cardType.SILIUZHOU;
        }
        //双花十
        let shuanghuashi_type_tian = [0x1A, 0x3A];
        let shuanghuashi_type_jia = [0x0A, 0x2A];
        if (this.getCardsindexOf(shuanghuashi_type_tian, shuanghuashi_type_jia, cards)) {
            return ApiDzpk.cardType.SHUANGHUASHI;
        }
        //斧九皱
        let fujiuzhou_type_tian = [0x1B, 0x3B];
        let fujiuzhou_type_jia = [0x19, 0x39];
        if (this.getCardsindexOf(fujiuzhou_type_tian, fujiuzhou_type_jia, cards)) {
            return ApiDzpk.cardType.FUJIUZHOU;
        }
        //丁七皱
        let dingqizhou_type_tian = [0x23];
        let dingqizhou_type_jia = [0x07, 0x27, 0x17, 0x37];
        if (this.getCardsindexOf(dingqizhou_type_tian, dingqizhou_type_jia, cards)) {
            return ApiDzpk.cardType.DINGQIZHOU;
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
            if (drawType == ApiDzpk.drawType.NONEWIN) {
                //平局
                return 0;
            } else if (drawType == ApiDzpk.drawType.BANKERWIN) {
                //同点庄家赢
                return 1;

            } else if (drawType == ApiDzpk.drawType.COLORWIN) {
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

module.exports = new DZPKLogic()