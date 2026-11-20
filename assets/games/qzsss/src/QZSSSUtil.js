const A2345IsMin = true;

const ElectionTypeScore = {
    LT: 11000000000000000,
    WT: 10000000000000000,
    THS: 9000000000000000,
    TZ: 8000000000000000,
    HL: 7000000000000000,
    TH: 6000000000000000,
    SZ: 5000000000000000,
    ST: 4000000000000000,
    LD: 3000000000000000,
    DZ: 2000000000000000,
    WL: 1000000000000000,
};

function clone(object) {
    var o = {};
    if (object instanceof Array) {
        o = [];
    }
    for (var key in object) {
        o[key] = (typeof (object[key]) === "object") && object[key] != null ? clone(object[key]) : object[key];
    }
    return o;
}

function isValid(obj) {
    return obj !== null && obj !== undefined;
}

//获得点数
function idToPoint(id) {
    if (id == 53 || id == 52) return id;
    return id % 13 + 1;
}

//获得点数数组
function idsToPoints(ids) {
    var points = [];
    ids.forEach((id) => {
        points.push(idToPoint(id));
    });
    return points;
}
//获得花色
function idToColor(id) {
    if (id === 52) return 4;
    if (id === 53) return 5;
    return Math.floor(id / 13);
}

function idsToColors(ids) {
    var points = [];
    ids.forEach((id) => {
        points.push(idToColor(id));
    });
    return points;
}
//点数与花色转为id
function pointsToIds(points, color) {
    var ids = [];
    points.forEach((point) => {
        if (point === 14) {
            point = 1;
        }
        ids.push(13 * color + point - 1);
    });
    return ids;
};

/*
 根据点数进行分组
 {
 "point":[id1,id2,id3]
 "point":[id1,id2]
 }
 */
function getGroupByPoint(ids) {
    var group = {};
    ids.forEach((id) => {
        var point = idToPoint(id);
        var arr = group[point];
        if (id !== 53 && id !== 52) {
            if (isValid(arr)) {
                arr.push(id);
            } else {
                group[point] = [];
                group[point].push(id);
            }
        }
    });
    return group;
};

/*
 根据length进行分组
 {
 "point":[id1,id2]
 "point":[id1,id2]
 }
 */
function getGroupByResult(groupByPoker, length) {
    if (length <= 0) return [];

    var result = [];

    for (var prop in groupByPoker) {

        var pointIndexs = groupByPoker[prop];

        while (pointIndexs.length >= length) { //有多的分割多个数组

            var splices = pointIndexs.splice(0, length);

            if (splices.length >= length) result.push(splices);

        }

        //if (pointIndexs.length >= length) result.push(pointIndexs);

    }
    return result.filter((a) => {
        if (a) return true;
    });
};

/*
 根据颜色进行分组
 {
 "color":[id1,id2,id3]
 "color":[id1,id2]
 }
 */
function getGroupByColor(ids) {
    var group = {};
    ids.forEach((id) => {
        var color = idToColor(id);
        var arr = group[color];
        if (id !== 53 && id !== 52) {
            if (isValid(arr) || id == 53 || id == 52) {
                arr.push(id);
            } else {
                group[color] = [];
                group[color].push(id);
            }
        }
    });
    return group;
};

/*
 获取鬼牌[]
 */
function getGroupByPointGui(ids) {
    var group = [];
    ids.forEach(function (id) {
        if (id == 53 || id == 52) {
            group.push(id);
        }
    });
    return group;
}

function isHoldWithA(arr, isID) {
    for (var i = 0; i < arr.length; i++) {
        var point = isID ? idToPoint(arr[i]) : arr[i];
        if (point === 1) {
            return true;
        }
    }
}
//默认升序排列
function sortIDByPoint(id1, id2, isDesc) {
    if (isDesc) {
        //降序
        return idToPoint(id2) - idToPoint(id1);
    } else {
        //升序
        return idToPoint(id1) - idToPoint(id2);
    }
}


//默认升序排列
function sortPointByPoint(point1, point2, isDesc) {
    if (isDesc) {
        //降序
        return point2 - point1;
    } else {
        //升序
        return point1 - point2;
    }
}

function turnOneATo14(points) {
    for (var i = 0; i < points.length; i++) {
        if (points[i] === 1) {
            points[i] = 14;
            return points;
        }
    }
    return points;
}

function turnAllATo14(points) {
    for (var i = 0; i < points.length; i++) {
        if (points[i] === 1) {
            points[i] = 14;
        }
    }
    return points;
}

/*delIds要删除的 toDelIds被删除的*/
function delIds(delIds, toDelIds) {
    for (var i = 0; i < delIds.length; i++) {
        var s = delIds[i];
        var indexs = toDelIds.indexOf(s);
        if (indexs >= 0) toDelIds.splice(indexs, 1);
    }
}

function getNotRepeatOfNum(arr, num) {
    var result = [];
    var newArr = arr.slice(0);
    for (var i = 0; i < newArr.length;) {
        if (result.indexOf(newArr[i]) === -1) {
            result.push(newArr[i]);
            newArr.splice(i, 1);
            if (result.length === num) {
                break;
            }
        } else {
            i++;
        }
    }
    if (result.length < num) {
        return false;
    }
    return {
        result: result,
        theRest: newArr
    }
}

//去重的方法
function dereplication(arr) {
    var result = [];
    arr.forEach(function (a) {
        if (result.indexOf(a) === -1) {
            result.push(a);
        }
    });
    return result;
}

//去重的方法
function dereplicationByPoint(ids) {
    var map = {};
    var result = [];
    ids.forEach(function (id) {
        var point = idToPoint(id);
        if (!isValid(map[point])) {
            map[point] = id;
            result.push(id);
        }
    });
    return result;
}

/*排序从多到少 大到小*/
function _typeCardsSortByScores(ids, guiMin, byColor) {

    var cardsGui = [];
    var newCards = [];

    for (var i = 0; i < ids.length; i++) {
        var number = ids[i];
        if (parseInt(number) >= 52) {
            cardsGui.push(number);
        } else {
            newCards.push(number);
        }
    }
    var scoresHelper = _getCardPointsSameCount(newCards);
    newCards.sort(function (id1, id2) {
        var a1 = idToPoint(id1);
        var a2 = idToPoint(id2);

        var c1 = idToColor(id1);
        var c2 = idToColor(id2);

        var numberOfCard1 = scoresHelper[a1];
        var numberOfCard2 = scoresHelper[a2];
        if (byColor) {
            if (c2 != c1) return c2 - c1;
        } else {
            if (numberOfCard2 != numberOfCard1) return numberOfCard2 - numberOfCard1;
        }

        if (a1 == 1) a1 = 14;
        if (a2 == 1) a2 = 14;
        var scores1 = a1 + c1 / 10;
        var scores2 = a2 + c2 / 10;
        if (byColor) {
            scores2 = parseInt((a2 >= 10 ? a2 : "0" + a2));
            scores1 = parseInt((a1 >= 10 ? a1 : "0" + a1));
        }
        return scores2 - scores1;
    });

    cardsGui.sort(function (id1, id2) {
        return id2 - id1;
    });
    if (cardsGui.length > 0 && guiMin) {
        newCards = newCards.concat(cardsGui);
    } else {
        newCards = cardsGui.concat(newCards);
    }
    return newCards;
}

/*统计牌的个数*/
function _getCardPointsSameCount(ids) {
    var cardNumbers = {};
    var cards = idsToPoints(ids);
    for (var i in cards) {
        var s = cards[i];
        if (cardNumbers[s]) {
            cardNumbers[s]++;
        } else {
            cardNumbers[s] = 1;
        }

    }
    return cardNumbers;
}

/*有鬼牌的话改变牌的分*/
function _changeCardScors(points) {
    var is14 = true; //是A K Q J 10 ;

    var is1 = true; //是1 2 3 4 5

    points = points.slice();

    points.forEach(function (card) {
        if (card < 10 && card != 1) is14 = false;
    }); //不是A K Q J 10

    points.forEach(function (card) {
        if ((card > 5 && card != 14) && card < 52) is1 = false;
    }); //不是1 2 3 4 5});

    if (points.indexOf(14) == -1) is1 = false; //不是1 2 3 4 5});

    if (is14) { //是A K Q J 10 ;

        points.sort(function (a1, a2) {
            return a2 - a1;
        });

        var num = 14,
            scoresAyy = []; //一副牌的分数

        for (var i = 0; i < 5; i++) {

            scoresAyy.push(num);

            num -= 1;

        }

        for (var j = 0; j < scoresAyy.length; j++) {

            for (var i = 0; i < points.length; i++) {

                var cardScores = points[i];

                if (cardScores == scoresAyy[j] && cardScores < 15) scoresAyy.splice(j, 1); //删除不是鬼牌的分

            }
        }
        for (var j = 0; j < points.length; j++) {
            if (points[j] >= 52) {
                points[j] = scoresAyy.splice(0, 1)[0];
            }
        }
    } else if (is1) { //是1 2 3 4 5

        points.sort(function (a1, a2) {
            return a2 - a1;
        });

        var num = 5,
            scoresAyy = []; //一副牌的分数

        for (var i = 0; i < 5; i++) {

            scoresAyy.push(num);

            num -= 1;
        }

        for (var i = 0; i < points.length; i++) {
            for (var j = 0; j < scoresAyy.length; j++) {
                var cardScores = points[i] == 14 ? 1 : points[i];
                if (cardScores == scoresAyy[j] && cardScores < 15) {
                    scoresAyy.splice(j, 1);
                    break;
                }
            }
        }
        for (var j = 0; j < points.length; j++) {
            if (points[j] >= 52) {
                points[j] = scoresAyy.splice(0, 1)[0];
            }
        }

    } else {
        points.sort(function (a1, a2) {
            return a1 - a2;
        });

        let jokerCard = points.filter(item => item >= 52);
        let normaCard = points.filter(item => item < 52);
        if (jokerCard.length == 1 && normaCard.toString() == [2, 3, 4, 5].toString()) {
            points = [14, 2, 3, 4, 5];
        } else if (jokerCard.length == 2 && (normaCard.toString() == [2, 3, 4].toString() || normaCard.toString() == [2, 3, 5].toString() || normaCard.toString() == [3, 4, 5].toString())) {
            points = [14, 2, 3, 4, 5];
        } else {
            var scoresAyy = []; //用来装鬼牌分数

            for (var i = 0; i < 5; i++) {

                var s = parseInt(points[0]) + i; //最小的牌的分数

                scoresAyy.push(s); //一副牌的分数

            }

            for (var j = 0; j < scoresAyy.length; j++) {

                for (var i = 0; i < points.length; i++) {

                    var cardScores = points[i];

                    if (cardScores == scoresAyy[j] && cardScores < 15) scoresAyy.splice(j, 1); //删除不是鬼牌的分

                }
            }
            for (var j = 0; j < points.length; j++) {
                if (points[j] >= 52) {
                    points[j] = scoresAyy.splice(0, 1)[0];
                }
            } //改变牌的分数
        }

    }

    points.sort(function (a1, a2) {
        return a2 - a1;
    });

    return points;
}

function isKQJAnd123(points) {
    if (!points || !points.length) return false;

    var is14 = true; //是A K Q J 10 ;

    var is1 = true; //是1 2 3 4 5

    points.forEach(function (card) {
        if (card < 10 && card != 1) is14 = false;
    }); //不是A K Q J 10

    points.forEach(function (card) {
        if ((card > 5 && card != 14) && card != 20) is1 = false;
    }); //不是1 2 3 4 5});
    return is14 || is1;
}

//是否为顺子 可检测鬼牌
function isSZGui(pointsA, pointsGui) {
    if (pointsA && pointsA.length) {
        var points = pointsA.filter(function (point) {
            return point <= 51;
        });
    } else {
        return false;
    }
    if (points.length + pointsGui.length !== 5) return false;

    points.sort(function (a1, a2) {
        return a1 - a2;
    });
    var length = points.length - 1;
    var a1point = parseInt(points[length]) /* == 1?14:parseInt(points[length])*/ ;
    var a2point = parseInt(points[0]) /* == 1?14:parseInt(points[0])*/ ;

    var bool = a1point - a2point <= 4 ||
        isKQJAnd123(points);

    if (bool) return true;

    return false;
}


//抽样方法，返回所有的抽样结果
function sampling(arr, num) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        for (var ii = i + 1; ii < arr.length; ii++) {
            result.push([arr[i], arr[ii]])
        }
    }
    return result;
}

function defalutIdsSort(a, b) {
    return (b > 13 ? b % 13 : b) - (a > 13 ? a % 13 : a)
}

function getNotRepeatOfCards(arr, num) {
    var result = [];
    var points = [];
    var newArr = arr.slice(0);
    for (var i = 0; i < newArr.length;) {
        if (points.indexOf((newArr[i] > 13 ? newArr[i] % 13 : newArr[i])) === -1) {
            points.push((newArr[i] > 13 ? newArr[i] % 13 : newArr[i]));
            result.push(newArr[i]);
            newArr.splice(i, 1);
            if (result.length === num) {
                break;
            }
        } else {
            i++;
        }
    }
    if (result.length < num) {
        return false;
    }
    return {
        result: result,
        theRest: newArr
    }
}

/*----------------------------------特殊牌----------------------------------*/
//三同花
function isHoldSTH(groupByColor) {
    for (var i in groupByColor) {
        var length = groupByColor[i].length;
        var remainder = length % 5;
        if (remainder !== 3 && remainder !== 0) {
            return false;
        }
    }

    return true;
}

//是否为顺子
function isSZ(points) {
    var last = null;
    points.sort(sortPointByPoint);
    for (var i = 0; i < points.length; i++) {
        if (last === null) {
            last = points[i];
        } else if (points[i] - last !== 1) {
            return false;
        } else {
            last = points[i];
        }
    }
    return true;
}

//检查是否是三顺子
function checkIsHoldSSZ(points) {
    if (points.length === 0) {
        return true;
    }
    var notRepetPointOf5 = getNotRepeatOfNum(points, 5);
    var notRepetPointOf3 = false;
    var result = false;

    if (notRepetPointOf5) {
        if (isSZ(notRepetPointOf5.result)) {
            result = checkIsHoldSSZ(notRepetPointOf5.theRest);
        } else {
            notRepetPointOf3 = getNotRepeatOfNum(points, 3);
            if (isSZ(notRepetPointOf3.result)) {
                result = checkIsHoldSSZ(notRepetPointOf3.theRest);
            }
        }
    }
    if (result === false) {
        notRepetPointOf3 = getNotRepeatOfNum(points, 3);
        if (notRepetPointOf3 && isSZ(notRepetPointOf3.result)) {
            result = checkIsHoldSSZ(notRepetPointOf3.theRest);
        }
    }
    return result;
}

//三顺子
function isHoldSSZ(points) {
    /*
     var arr = [26,39,14,28,2,29,30,18,45,9,23,50,12];三顺子
     var arr = [12,11,2,40,3,43,44,16,17,31,19,0,7];三顺子
     var arr = [9,22,35,48,23,10,36,49,8,21,34,47,33];不是三顺子
     var arr = [39,1,41,29,30,14,28,42,4,5,18,32,46];三顺子
     */
    points.sort(sortPointByPoint);
    var r = checkIsHoldSSZ(points);
    if (!r && isHoldWithA(points)) {
        turnOneATo14(points);
        r = isHoldSSZ(points);
    }
    //console.log(r)
    return r;
}


//五对三条
function isHoldWDST(groupByPoint) {
    var odd = false;
    for (var i in groupByPoint) {
        if (groupByPoint[i].length % 2 !== 0) {
            if (odd) {
                return false;
            }
            odd = groupByPoint[i].length;
        }
    }
    return odd == 3;
}
//六对半
function isHoldLDB(groupByPoint) {
    var odd = 0;
    for (var i in groupByPoint) {
        if (groupByPoint[i].length % 2 !== 0) {
            if (odd) {
                return false;
            }
            odd++;
        }
    }
    return odd == 1;
}

//四套三条
function isHoldSTST(groupByPoint) {
    var threeTol = 0;
    for (var i in groupByPoint) {
        if (groupByPoint[i].length >= 6) {
            threeTol += 2;
        } else if (groupByPoint[i].length >= 3) {
            threeTol++;
        }
    }
    return threeTol === 4;
}
//三分天下
function isHoldSFTX(groupByPoint) {
    var fourTol = 0;
    for (var i in groupByPoint) {
        if (groupByPoint[i].length >= 4) {
            fourTol++;
        }
    }
    return fourTol === 3;
}
//十二皇族
function isHoldSRHZ(groupByPoint) {
    let totalCont = 0;
    for (var i in groupByPoint) {
        if (groupByPoint[i] >= 10) {
            totalCont += 1;
        }
    }
    return totalCont >= 12 ? true : false;

}
//全大
function isHoldQD(groupByPoint) {
    for (var i in groupByPoint) {
        if (groupByPoint[i] < 9 && groupByPoint[i] !== 1) {
            return false;
        }
    }
    return true;
}
//全小
function isHoldQX(groupByPoint) {
    for (var i in groupByPoint) {
        if (groupByPoint[i] >= 9 || groupByPoint[i] == 1) {
            return false;
        }
    }
    return true;
}
//凑一色
function isHoldCYS(groupByPoint) {
    var color4 = groupByPoint[3] || [];
    var color3 = groupByPoint[2] || [];
    var color2 = groupByPoint[1] || [];
    var color1 = groupByPoint[0] || [];
    var black = color4.concat(color2);
    var red = color3.concat(color1);
    if (black.length == 13 || red.length == 13) {
        return true;
    }
    return false;

}
//一条龙
function isHoldYTL(groupByPoint) {
    for (var i in groupByPoint) {
        if (groupByPoint[i].length > 1) {
            return false;
        }
    }
    return true;
}
//青龙
function isHoldQL(groupByPoint, groupByColor) {
    var isYTL = isHoldYTL(groupByPoint);
    var colorTol = 0;
    if (isYTL) {
        for (var i in groupByColor) {
            colorTol++;
        }
    }
    return isYTL && colorTol === 1;
}
//三同花顺
function isHoldSTHS(groupByPoint, groupByColor) {
    //var arr = [15,35,16,17,26,32,33,34,14,36,37,38,31];
    var isSTH = isHoldSTH(groupByColor);
    if (!isSTH) {
        return false;
    }
    for (var i in groupByColor) {
        var points = idsToPoints(groupByColor[i]);
        var rs = isHoldSSZ(points);
        if (!rs) {
            return false;
        }
    }
    return true;
}

//全黑一点红
function isHoldQHEIDH(groupByPoint) {
    var color4 = groupByPoint[3] || [];
    var color3 = groupByPoint[2] || [];
    var color2 = groupByPoint[1] || [];
    var color1 = groupByPoint[0] || [];
    var black = color4.concat(color2);
    var red = color3.concat(color1);
    if (black.length == 12 || red.length == 1) {
        return true;
    }
    return false;

}

//全红一点黑
function isHoldQHONGDH(groupByPoint) {
    var color4 = groupByPoint[3] || [];
    var color3 = groupByPoint[2] || [];
    var color2 = groupByPoint[1] || [];
    var color1 = groupByPoint[0] || [];
    var black = color4.concat(color2);
    var red = color3.concat(color1);
    if (black.length == 1 || red.length == 12) {
        return true;
    }
    return false;
}

class GameUtil {

    init(rule) {
        this.gameRule = rule;
    };

    getGameRule() {
        return this.gameRule
    };

    getJokerCount() {
        if (!this.gameRule) {
            this.gameRule = {}
        }
        if (this.gameRule.jokerType == 0) {
            return 0
        }
        return this.gameRule.jokerCount
    };

    getTypeNameAndScore(ids) {
        var score = this.getElectionScore(ids.slice());
        for (var i in ElectionTypeScore) {
            if (ElectionTypeScore[i] / ElectionTypeScore.WL === parseInt(score / ElectionTypeScore.WL)) {
                return {
                    score: score,
                    name: i.toLowerCase(),
                    ids: ids
                }
            }
        }
    };

    //获得点数
    idToPoint(id) {
        if (id == 53 || id == 52) return id;
        return id % 13 + 1;
    }

    /**获取普通牌型 */
    getAllHoldTypeWithNormal(ids) {
        if (!ids || !ids.length) {
            return;
        }
        var groupByPoint = getGroupByPoint(ids);
        var groupByColor = getGroupByColor(ids);
        var points = idsToPoints(ids);
        var pointsGui = getGroupByPointGui(ids);
        return {
            liuTong: this.isHoldLT(groupByPoint, pointsGui),
            wutong: this.isHoldWT(groupByPoint, pointsGui),
            tonghuashun: this.isHoldTHS(groupByColor, pointsGui),
            tiezhi: this.isHoldTZ(groupByPoint, pointsGui),
            hulu: this.isHoldHL(groupByPoint, pointsGui),
            tonghua: this.isHoldTH(groupByColor, pointsGui),
            shunzi: this.isHoldSZ(points, pointsGui),
            santiao: this.isHoldST(groupByPoint, pointsGui),
            liangdui: this.isHoldLD(groupByPoint, pointsGui),
            duizi: this.isHoldDZ(groupByPoint, pointsGui),
        };
    }

    /**获取特殊牌型 */
    getAllHoldTypeWithSpecial(ids, typeArr) {
        var groupByPoint = getGroupByPoint(ids);
        var groupByColor = getGroupByColor(ids);
        var points = idsToPoints(ids);
        var pointsGui = getGroupByPointGui(ids);
        var types = {
            qinglong: false,
            yitiaolong: false,
            shierhuangzu: false,
            santonghuashun: false,
            sanfentianxia: false,
            quanda: false,
            quanxiao: false,
            couyise: false,
            quanheiyidianhong: false,
            quanhongyidianhei: false,
            sitaosantiao: false,
            wuduisantiao: false,
            liuduiban: false,
            sanshunzi: false,
            santonghua: false
        };
        if (pointsGui.length > 0) {
            return types;
        }
        if (typeArr.qinglong && isHoldQL(groupByPoint, groupByColor)) {
            types.qinglong = true;
            return types;
        } else if (typeArr.yitiaolong && isHoldYTL(groupByPoint)) {
            types.yitiaolong = true;
            return types;
        } else if (typeArr.shierhuangzu && isHoldSRHZ(points)) {
            types.shierhuangzu = true;
            return types;
        } else if (typeArr.santonghuashun && isHoldSTHS(groupByPoint, groupByColor)) {
            types.santonghuashun = true;
            return types;
        } else if (typeArr.sanfentianxia && isHoldSFTX(groupByPoint)) {
            types.sanfentianxia = true;
            return types;
        } else if (typeArr.quanda && isHoldQD(points)) {
            types.quanda = true;
            return types;
        } else if (typeArr.quanxiao && isHoldQX(points)) {
            types.quanxiao = true;
            return types;
        } else if (typeArr.couyise && isHoldCYS(groupByColor)) {
            types.couyise = true;
            return types;

        } else if (typeArr.quanheiyidianhong && isHoldQHEIDH(groupByColor)) {
            types.quanheiyidianhong = true;
            return types;

        } else if (typeArr.quanhongyidianhei && isHoldQHONGDH(groupByColor)) {
            types.quanhongyidianhei = true;
            return types;

        } else if (typeArr.sitaosantiao && isHoldSTST(groupByPoint)) {
            types.sitaosantiao = true;
            return types;
        } else if (typeArr.wuduisantiao && isHoldWDST(groupByPoint)) {
            types.wuduisantiao = true;
            return types;
        } else if (typeArr.liuduiban && isHoldLDB(groupByPoint)) {
            types.liuduiban = true;
            return types;
        } else if (typeArr.sanshunzi && isHoldSSZ(points)) {
            types.sanshunzi = true;
            return types;
        } else if (typeArr.santonghua && isHoldSTH(groupByColor)) {
            types.santonghua = true;
            return types;
        }
        return types;
    };

    sortIDByPointAndColor(id1, id2, isDesc) {
        if (isDesc) {
            var rs1 = this.idToPoint(id2) - this.idToPoint(id1);
            rs1 = rs1 === 0 ? this.idToColor(id2) - this.idToColor(id1) : rs1;
            return rs1;
        } else {
            var rs2 = this.idToPoint(id1) - this.idToPoint(id2);
            rs2 = rs2 === 0 ? this.idToColor(id1) - this.idToColor(id2) : rs2;
            return rs2;
        }
    };

    /**获取头道炸弹的摆牌类型 */
    getTouBoomType(ids) {
        let getPoint1 = (id) => {
            let p = idToPoint(id)
            if (p == 1) p = 14
            return p
        }

        let getTz = (idList, count) => {
            let groupByPoint = getGroupByPoint(idList);
            let pointsGui = getGroupByPointGui(idList);
            let tz = this.getAnLTorWTorTZ(2, groupByPoint, null, pointsGui, true)
            let paixu = tz.filter(list => list.length <= count)
            if (paixu.length == 0) {
                return []
            }
            paixu.sort((tz1, tz2) => {
                let a = getPoint1(tz1[2])
                let b = getPoint1(tz2[2])
                return a - b
            })
            return paixu
        }

        let newids = ids.slice()
        let touArr = getTz(newids, 3)
        let resArr = []
        for (let i = 0; i < touArr.length; i++) {
            const t1 = touArr[i];
            let nids = _typeCardsSortByScores(newids.slice());
            delIds(t1, nids)
            let groupByColor = getGroupByColor(nids)
            let pointsGui = getGroupByPointGui(nids);
            let groupByPoint = getGroupByPoint(nids);
            let ths = this.getAnTHS(groupByColor, null, pointsGui, true)
            let wt = this.getAnLTorWTorTZ(1, groupByPoint, null, pointsGui, true)
            let lt = this.getAnLTorWTorTZ(0, groupByPoint, null, pointsGui, true)
            let tz = getTz(nids, 5)
            let wei = ths.concat(wt).concat(lt).concat(tz)
            wei.sort((arr1, arr2) => {
                return this.getElectionScore(arr2) - this.getElectionScore(arr1);
            })
            for (let j = 0; j < wei.length; j++) {
                var cardsWei = wei[j];
                var newIds = _typeCardsSortByScores(nids.slice());
                delIds(cardsWei, newIds); //去重
                let gbc = getGroupByColor(newIds)
                let pg = getGroupByPointGui(newIds);
                let gbp = getGroupByPoint(newIds);
                let ths = this.getAnTHS(gbc, null, pg, true)
                let wt = this.getAnLTorWTorTZ(1, gbp, null, pg, true)
                let lt = this.getAnLTorWTorTZ(0, gbp, null, pg, true)
                let tz = getTz(newIds, 5)
                var cardsZhongArrAy = ths.concat(wt).concat(lt).concat(tz)
                if (cardsZhongArrAy.length == 0) {
                    continue;
                }
                cardsZhongArrAy.sort((arr1, arr2) => {
                    return this.getElectionScore(arr2) - this.getElectionScore(arr1);
                })
                var cardsZhong = [];
                var max = 0;
                for (let k = 0; k < cardsZhongArrAy.length; ++k) {
                    let scoreZhong = cardsZhongArrAy[k];
                    /*找出最大的牌并且没有倒水的*/
                    let z = this.getElectionScore(scoreZhong.slice());
                    if (max < z) {
                        max = z;
                        cardsZhong = scoreZhong;
                        //break;
                    }
                }
                if (cardsZhong.length > 0) {
                    resArr.push([cardsWei, cardsZhong, t1])
                }
            }
        }
        if (resArr.length > 0) {
            let checkJokerCount = (checkIds) => {
                let jcount = 0
                for (let i = 0; i < checkIds.length; i++) {
                    const id = checkIds[i];
                    if (id == 53 || id == 53) {
                        jcount++
                    }
                }
                return jcount
            }
            resArr.sort((c1, c2) => {
                let s1 = this.getElectionScore(c1[0])
                let s2 = this.getElectionScore(c2[0])
                if (s2 == s1) {
                    let jc1 = checkJokerCount(c1[2])
                    let jc2 = checkJokerCount(c2[2])
                    return jc1 - jc2
                }
                return s2 - s1
            })
            return resArr[0]
        }
        return []
    }

    /**获取头道三条的摆牌类型 */
    getTouSanTiaoType(ids) {
        let getPoint1 = (id) => {
            let p = idToPoint(id)
            if (p == 1) p = 14
            return p
        }

        let getSanTiao = (idList) => {
            let groupByPoint = getGroupByPoint(idList);
            let pointsGui = getGroupByPointGui(idList);
            let st = this.getAnLTorWTorTZ(3, groupByPoint, null, pointsGui, true)
            if (st.length == 0) {
                return []
            }
            st.sort((st1, st2) => {
                let a = getPoint1(st1[2])
                let b = getPoint1(st2[2])
                return b - a
            })
            return st
        }

        let newids = ids.slice()
        let st = getSanTiao(newids, 3)
        if (st.length == 0) {
            return []
        }
        let resArr = []
        for (let index = 0; index < st.length; index++) {
            let cardsTou = st[index]
            let newids2 = _typeCardsSortByScores(newids.slice());
            delIds(cardsTou, newids2); //去重
            let wei = this.autoSelectCards(newids2.slice(), true).sort((arr1, arr2) => {
                return this.getElectionScore(arr2) - this.getElectionScore(arr1);
            });
            if (wei.length == 0) {
                continue;
            }
            let touScore = this.getElectionScore(cardsTou)
            for (let i = 0; i < wei.length; i++) {
                var cardsWei = wei[i];
                let weiScore = this.getElectionScore(cardsWei)
                if (weiScore < touScore) {
                    break;
                }
                var newIds = _typeCardsSortByScores(newids2.slice());
                /*从剩下的牌找出中道*/
                delIds(cardsWei, newIds); //去重
                var zhong = this.autoSelectCards(newIds.slice(), true)
                if (zhong.length == 0) {
                    continue;
                }
                zhong.sort((arr1, arr2) => {
                    return this.getElectionScore(arr2) - this.getElectionScore(arr1);
                });
                var cardsZhong = zhong.find(list => {
                    let s = this.getElectionScore(list)
                    return s < weiScore && s > touScore
                })

                if (cardsZhong && cardsZhong.length > 0) {
                    resArr.push([cardsWei, cardsZhong, cardsTou])
                }
            }
        }
        if (resArr.length > 0) {
            resArr.sort((c1, c2) => {
                let s1 = this.getElectionScore(c1[0])
                let s2 = this.getElectionScore(c2[0])
                return s2 - s1
            })
            return resArr[0]
        }
        return []
    }

    /**获取头道对子的摆牌类型 */
    getTouDuiZiType(ids) {
        let getPoint = (id) => {
            let p = idToPoint(id)
            if (p == 1) p = 14
            return p
        }
        let getDuiZi = (idList) => {
            let groupByPoint = getGroupByPoint(idList);
            let dz = []
            for (const point in groupByPoint) {
                if (Object.hasOwnProperty.call(groupByPoint, point)) {
                    const list = groupByPoint[point];
                    if (list.length == 2) {
                        dz.push(list)
                    }
                }
            }
            if (dz.length == 0) {
                return []
            }
            dz.sort((arr1, arr2) => {
                let a1 = getPoint(arr1[0])
                let a2 = getPoint(arr2[0])
                return a2 - a1
            });
            return dz
        }

        let newids = ids.slice()
        let dz = getDuiZi(newids, 3)
        if (dz.length == 0) {
            return []
        }
        let resArr = []
        for (let index = 0; index < dz.length; index++) {
            let cardsTou = dz[index]
            let newids2 = _typeCardsSortByScores(newids.slice());
            delIds(cardsTou, newids2); //去重
            let wei = this.autoSelectCards(newids2.slice(), true).sort((arr1, arr2) => {
                return this.getElectionScore(arr2) - this.getElectionScore(arr1);
            });
            if (wei.length == 0) {
                continue;
            }
            let touScore = this.getElectionScore(cardsTou)
            for (let i = 0; i < wei.length; i++) {
                var cardsWei = wei[i];
                let weiScore = this.getElectionScore(cardsWei)
                if (weiScore < touScore) {
                    break;
                }
                var newIds = _typeCardsSortByScores(newids2.slice());
                /*从剩下的牌找出中道*/
                delIds(cardsWei, newIds); //去重
                var zhong = this.autoSelectCards(newIds.slice(), true)
                if (zhong.length == 0) {
                    continue;
                }
                zhong.sort((arr1, arr2) => {
                    return this.getElectionScore(arr2) - this.getElectionScore(arr1);
                });
                var cardsZhong = zhong.find(list => {
                    let s = this.getElectionScore(list)
                    return s < weiScore && s > touScore
                })

                if (cardsZhong && cardsZhong.length > 0) {
                    resArr.push([cardsWei, cardsZhong, cardsTou])
                }
            }
        }
        if (resArr.length > 0) {
            let rate = 1000000000000000
            let tmp = []
            if (resArr.length == 1) {
                tmp.push(resArr[0])
            } else {
                resArr.sort((c1, c2) => {
                    let s1 = this.getElectionScore(c1[0])
                    let s2 = this.getElectionScore(c2[0])
                    if (parseInt(s2 / rate) == parseInt(s1 / rate)) {
                        s1 = this.getElectionScore(c1[2])
                        s2 = this.getElectionScore(c2[2])
                    }
                    return s2 - s1
                })
                tmp.push(resArr[0])
                resArr.sort((c1, c2) => {
                    let s1 = this.getElectionScore(c1[2])
                    let s2 = this.getElectionScore(c2[2])
                    return s2 - s1
                })
                tmp.push(resArr[0])
            }
            return tmp
        }
        return []
    }

    /**获取所有摆牌类型 */
    getGroupAllPokerType(ids) {
        //ids = [38,11,36,36,23,10,21,46,19,31,40,14,1];
        if (!ids || !ids.length || ids.length != 13) return;
        var length = 20;
        /*找出尾道*/
        var wei = this.autoSelectCards(ids.slice(), true).sort((arr1, arr2) => {
            return this.getElectionScore(arr2) - this.getElectionScore(arr1);
        });
        wei = this.reptAnSort(wei, 3).slice(0, length); /*去重排序*/
        var allTypeCards = [];
        /*找出中尾两道*/
        for (var i = 0; i < wei.length; i++) {
            var cardsWei = wei[i];
            var newIds = _typeCardsSortByScores(ids.slice());
            /*从剩下的牌找出中道*/
            delIds(cardsWei, newIds); //去重
            var cardsZhongArrAy = this.autoSelectCards(newIds.slice(), true).sort((arr1, arr2) => {
                return this.getElectionScore(arr2) - this.getElectionScore(arr1);
            });

            var cardsZhong = newIds.slice(0, 5) || [];
            var max = 0;
            for (var j = 0; j < cardsZhongArrAy.length; ++j) {
                var scoreZhong = cardsZhongArrAy[j];
                /*找出最大的牌并且没有倒水的*/
                var z = this.getElectionScore(scoreZhong.slice());
                if (max < z) {
                    max = z;
                    cardsZhong = scoreZhong;
                    //break;
                }
            }

            /*从剩下的牌找出头道*/
            delIds(cardsZhong, newIds);
            var cardsTouArrAy = this.autoSelectCards(newIds.slice(), true).sort((arr1, arr2) => {
                return this.getElectionScore(arr2) - this.getElectionScore(arr1);
            });
            //console.log(newIds)
            var cardsTou = newIds.slice(0, 3) || [];
            for (var j = 0; j < cardsTouArrAy.length; ++j) {
                var scoreTou = cardsTouArrAy[j];
                /*找出最大的牌并且没有倒水的*/
                if (scoreTou.length <= 3 && this.getElectionScore(cardsZhong) > this.getElectionScore(scoreTou.slice())) {
                    cardsTou = scoreTou;
                    break
                }
            }

            var arrays = [];
            arrays.push(cardsWei);
            arrays.push(cardsZhong);
            arrays.push(cardsTou);
            allTypeCards.push(arrays);
        }

        /*整合头中尾三道*/
        var newId1s = ids.slice();
        var newW = this.autoSelectCards(newId1s, false, false, true) || [];
        delIds(newW, newId1s); //去重
        var newZ = this.autoSelectCards(newId1s, false, false, true) || [];
        delIds(newZ, newId1s); //去重
        var newT = this.autoSelectCards(newId1s, false, false, true) || [];
        allTypeCards.push([newW, newZ, newT]);

        //if(allTypeCards.length >= 0){
        var arr = [];
        var newIds = _typeCardsSortByScores(ids.slice());
        arr.push(newIds.slice(0, 5));
        arr.push(newIds.slice(5, 10));
        arr.push(newIds.slice(10, 13));
        allTypeCards.push(arr);
        //}

        /**新增获取头道炸弹 */
        let boom = this.getTouBoomType(ids)
        if (boom && boom.length > 0) {
            allTypeCards.push(boom)
        }
        /**新增获取头道三条 */
        let st = this.getTouSanTiaoType(ids)
        if (st && st.length > 0) {
            allTypeCards.push(st)
        }
        /**新增获取头道最大对子 */
        let dz = this.getTouDuiZiType(ids)
        if (dz && dz.length > 0) {
            allTypeCards.push(dz[0])
            if (dz[1]) {
                allTypeCards.push(dz[1])
            }
        }

        /*//补全*/
        for (var i = 0; i < allTypeCards.length; i++) {
            var newIds = ids.slice()
            var typeCards = allTypeCards[i];
            delIds(typeCards[0], newIds); //去重
            delIds(typeCards[1], newIds);
            delIds(typeCards[2], newIds);
            newIds.sort(function (id1, id2) {
                var a1 = idToPoint(id1) == 1 ? 14 : idToPoint(id1);
                var a2 = idToPoint(id2) == 1 ? 14 : idToPoint(id2);
                return a2 - a1;
            });
            while (newIds && newIds.length && newIds.length >= 1 && typeCards[0].length < 5) {
                typeCards[0] = typeCards[0].concat(newIds.pop());
            }
            while (newIds && newIds.length && newIds.length >= 1 && typeCards[1].length < 5) {
                typeCards[1] = typeCards[1].concat(newIds.pop());
            }
            while (newIds && newIds.length && newIds.length >= 1 && typeCards[2].length < 3) {
                typeCards[2] = typeCards[2].concat(newIds.pop());
            }
            /*尾中倒水的话掉个位置*/
            if (this.getElectionScore(typeCards[0]) < this.getElectionScore(typeCards[1])) {
                var tmp = typeCards[0];
                typeCards[0] = typeCards[1];
                typeCards[1] = tmp;
            }
            /*头中倒水的话删了*/
            if (this.getElectionScore(typeCards[1]) < this.getElectionScore(typeCards[2])) {
                typeCards[0] = [];
                typeCards[1] = [];
                typeCards[2] = [];
            }
            typeCards[0] = typeCards[0] || [];
            typeCards[1] = typeCards[1] || [];
            typeCards[2] = typeCards[2] || [];
        }

        var newAllTypeCards = [];
        var namesArrAy = [];
        for (var i = 0; i < allTypeCards.length; i++) {
            var typeCards = allTypeCards[i];
            if (typeCards[0].length == 5 && typeCards[1].length == 5 && typeCards[2].length == 3) {
                var newTypeCards = [];
                newTypeCards[0] = this.getTypeNameAndScore(_typeCardsSortByScores(typeCards[0].slice()));
                newTypeCards[1] = this.getTypeNameAndScore(_typeCardsSortByScores(typeCards[1].slice()));
                newTypeCards[2] = this.getTypeNameAndScore(_typeCardsSortByScores(typeCards[2].slice()));

                /*去重复类型的*/
                var names = newTypeCards[0].name + newTypeCards[1].name + newTypeCards[2].name;
                let idx = namesArrAy.lastIndexOf(names)
                if (idx == -1) {
                    namesArrAy.push(names);
                    newAllTypeCards.push(newTypeCards);
                } else {
                    let typCards = newAllTypeCards[idx]
                    let touNames = ["dz", "st", "tz"] //头道是对子三条铁支时候取分数大的
                    if (touNames.includes(typCards[2].name) && newTypeCards[2].score > typCards[2].score &&
                        (newTypeCards[0].score > typCards[0].score ||
                            newTypeCards[0].name == typCards[0].name && newTypeCards[1].name == typCards[1].name)) {
                        newAllTypeCards.splice(idx, 1, newTypeCards)
                    } else if (touNames.includes(typCards[2].name) && newTypeCards[2].score > typCards[2].score) {
                        newAllTypeCards.push(newTypeCards);
                        namesArrAy.push(names);
                    }
                }
            }
        }

        let rate = 10000000
        let str = 0
        let sortHandle = (a1, a2) => {
            var b0 = parseInt((a2[0].score) / rate) + str
            var b1 = parseInt((a2[1].score) / rate) + str
            var b2 = parseInt((a2[2].score) / rate) + str

            var s0 = parseInt((a1[0].score) / rate) + str
            var s1 = parseInt((a1[1].score) / rate) + str
            var s2 = parseInt((a1[2].score) / rate) + str

            var s = parseInt(s0 + s1 + s2);
            var b = parseInt(b0 + b1 + b2);
            return b - s;
        }
        /*排序*/
        // newAllTypeCards.sort(sortHandle);

        let checkName = ["tz", "ths", "wt", "lt"]
        let check1 = ["wt", "lt"]
        let check2 = ["hl", "th", "sz", "st", "ld", "dz"]
        for (let i = 0; i < newAllTypeCards.length; i++) {
            if (newAllTypeCards.length <= 1) {
                break;
            }
            let isCanDel = false
            const info = newAllTypeCards[i];
            if (info[2].name == "st") {
                let jokerCount = 0
                info[2].ids.forEach(id => {
                    if (id == 52 || id == 53) {
                        jokerCount++
                    }
                });
                //硬鬼玩法 头道2鬼及以上 中道必须为顺子及以上
                if (info[1].name == "st" && this.gameRule.jokerType == 1) {
                    if (jokerCount >= 2) {
                        isCanDel = true
                    }
                }
                if (!isCanDel) {
                    if (!checkName.includes(info[1].name)) {
                        isCanDel = true
                    } else if (jokerCount == 1) {
                        /**如果头道里面有王 检测其他有不有头道对子尾道五同六同的牌 */
                        isCanDel = newAllTypeCards.some(cardInfo => check1.includes(cardInfo[0].name) &&
                            cardInfo[2].name == "dz")
                    } else if (jokerCount == 2) {
                        isCanDel = newAllTypeCards.some(cardInfo => check1.includes(cardInfo[0].name) &&
                            cardInfo[2].name != "st")
                    }
                }
            } else if (info[2].name == "tz" && info[0].name == "tz") {
                /**如果有其他中道5同6同尾道6同的牌 */
                isCanDel = newAllTypeCards.some(cardInfo => cardInfo[0].name = "lt" &&
                    check1.includes(cardInfo[1].name))
            } else if (info[2].name == "wl" && info[1].name == "ld") {
                /**查找有不有对子对子葫芦的牌型 */
                isCanDel = newAllTypeCards.some(cardInfo => cardInfo[2].name == "dz" && cardInfo[1].name == "dz" && cardInfo[0].name == info[0].name)
            }
            if (isCanDel) {
                newAllTypeCards.splice(i, 1)
                i--
            }
        }

        let tZan = newAllTypeCards.filter(info => info[2].name == "tz")
        let tSan = newAllTypeCards.filter(info => info[2].name == "st")
        let tDuiWu = newAllTypeCards.filter(info => info[2].name == "dz" || info[2].name == "wl")
        rate = 1000000000000000
        str = ""
        tZan.sort(sortHandle);
        tSan.sort(sortHandle);
        tDuiWu.sort(sortHandle);

        let resArr = tZan.concat(tSan).concat(tDuiWu)

        let getPoint = (id) => {
            let p = idToPoint(id)
            if (p == 1) p = 14
            return p
        }
        let checkInfo = resArr[0]
        if ((checkInfo[2].name == "wl" || checkInfo[2].name == "dz") &&
            check2.includes(checkInfo[0].name)) {
            resArr.sort((c1, c2) => {
                if (c2[0].name == c1[0].name) {
                    return c2[2].score - c1[2].score
                }
                return c2[0].score - c1[0].score
            })
            checkInfo = resArr[0]

            if (checkInfo[2].name == "wl" || getPoint(checkInfo[2].ids[0]) < 11) {
                if (resArr.some(info => info[2].name == "dz")) {
                    resArr.sort((c1, c2) => {
                        return c2[2].score - c1[2].score
                    })
                    checkInfo = resArr[0]
                }
            }

            if (checkInfo[2].name == "dz" && checkInfo[1].name == "st" && checkInfo[0].score >= ElectionTypeScore.HL) {

            } else if (checkInfo[2].name == "dz" && getPoint(checkInfo[2].ids[0]) < 11) {
                resArr.sort(sortHandle);
                checkInfo = resArr[0]
            }
        }

        if (checkInfo[2].name == "wl") {
            if (checkInfo[1].name == "hl") { //中道是葫芦
                let hl = checkInfo[1].ids.slice()
                let gbp = getGroupByPoint(hl)
                let maxDz = []
                let maxPoint = 0
                for (const point in gbp) {
                    if (Object.hasOwnProperty.call(gbp, point)) {
                        let list = gbp[point];
                        if (parseInt(point) > maxPoint && list.length == 2) {
                            maxDz = list
                            maxPoint = parseInt(point)
                        }
                    }
                }
                if (maxDz.length == 2) {
                    let i1 = hl.indexOf(maxDz[0])
                    let i2 = hl.lastIndexOf(maxDz[1])
                    checkInfo[1].ids[i1] = checkInfo[2].ids[1]
                    checkInfo[1].ids[i2] = checkInfo[2].ids[2]
                    checkInfo[2].ids[1] = hl[i1]
                    checkInfo[2].ids[2] = hl[i2]
                }

            } else if (checkInfo[1].name == "ld") {
                let wl = checkInfo[2].ids.slice()
                let points = idsToPoints(wl)
                if (!points.includes(idToPoint(checkInfo[1].ids[2])) &&
                    !points.includes(idToPoint(checkInfo[1].ids[3]))) { //防止把头道换成3条
                    checkInfo[2].ids[1] = checkInfo[1].ids[2]
                    checkInfo[2].ids[2] = checkInfo[1].ids[3]
                    checkInfo[1].ids[2] = wl[1]
                    checkInfo[1].ids[3] = wl[2]
                }
            }
        }
        // let check2 = ["hl", "th", "sz", "st", "ld", "dz"]
        // let check3 = ["ld", "dz", "wl"]
        // if (check2.includes(checkInfo[0].name) && checkInfo[2].name == "wl" && check3.includes(checkInfo[1].name)) {
        //     resArr.sort((c1, c2) => {
        //         if (c2[0].name == c1[0].name) {
        //             return c2[2].score - c1[2].score
        //         }
        //         return c2[0].score - c1[0].score
        //     })
        //     checkInfo = resArr[0]
        //     if (getPoint(checkInfo[2].ids[0]) < 11) { //特殊处理
        //         resArr.sort((c1, c2) => {
        //             return c2[2].score - c1[2].score
        //         })
        //         checkInfo = resArr[0]
        //     }
        // }
        // if (checkInfo[2].name == "dz" && !(checkInfo[2].ids.includes(52) || checkInfo[2].ids.includes(53))) {
        //     let dz2 = checkInfo[2].ids.slice()
        //     let dzpoint2 = getPoint(dz2[0])
        //     if (checkInfo[1].name == "ld" && checkInfo[0].name != "ld") { //只中道是两对
        //         let ldpoint = getPoint(checkInfo[1].ids[0])
        //         if (ldpoint == getPoint(dz2[2])) { //防止把头道换成三条
        //             ldpoint = getPoint(checkInfo[1].ids[3])
        //         }
        //         if (dzpoint2 < ldpoint && ldpoint != getPoint(dz2[2])) { //防止把头道换成三条
        //             checkInfo[2].ids[0] = checkInfo[1].ids[0]
        //             checkInfo[2].ids[1] = checkInfo[1].ids[1]
        //             checkInfo[1].ids[0] = dz2[0]
        //             checkInfo[1].ids[1] = dz2[1]
        //         }
        //     } else if (checkInfo[0].name == "hl" && checkInfo[1].name == "hl") {
        //         let dzpoint0 = getPoint(checkInfo[0].ids[4])
        //         if (dzpoint2 < dzpoint0) {
        //             checkInfo[2].ids[0] = checkInfo[0].ids[3]
        //             checkInfo[2].ids[1] = checkInfo[0].ids[4]
        //             checkInfo[0].ids[3] = dz2[0]
        //             checkInfo[0].ids[4] = dz2[1]
        //             dzpoint0 = dzpoint2
        //         }
        //         let dzpoint1 = getPoint(checkInfo[1].ids[4])
        //         if (dzpoint1 > dzpoint0) {
        //             let dz1 = checkInfo[1].ids.slice()
        //             checkInfo[1].ids[3] = checkInfo[0].ids[3]
        //             checkInfo[1].ids[4] = checkInfo[0].ids[4]
        //             checkInfo[0].ids[3] = dz1[3]
        //             checkInfo[0].ids[4] = dz1[4]
        //         }
        //     } else if (checkInfo[1].name == "hl") {
        //         let dzpoint1 = getPoint(checkInfo[1].ids[4])
        //         if (dzpoint2 < dzpoint1) {
        //             checkInfo[2].ids[0] = checkInfo[1].ids[3]
        //             checkInfo[2].ids[1] = checkInfo[1].ids[4]
        //             checkInfo[1].ids[3] = dz2[0]
        //             checkInfo[1].ids[4] = dz2[1]
        //         }
        //     } else if (checkInfo[0].name == "hl") {
        //         let dzpoint0 = getPoint(checkInfo[0].ids[4])
        //         if (dzpoint2 < dzpoint0) {
        //             checkInfo[2].ids[0] = checkInfo[0].ids[3]
        //             checkInfo[2].ids[1] = checkInfo[0].ids[4]
        //             checkInfo[0].ids[3] = dz2[0]
        //             checkInfo[0].ids[4] = dz2[1]
        //         }
        //     }
        // } else if (checkInfo[2].name == "wl") {
        //     /**找第二个是不是头道是对子，是的话就把两个换个位置 */
        //     // let info2 = resArr.find(cards => cards[2].score >= checkInfo[2].score && cards[0].score >= checkInfo[0].score)
        //     let info2 = null

        //     let check4 = ["dz", "st", "tz"]
        //     for (let i = 1; i < resArr.length; i++) {
        //         let cards = resArr[i];
        //         let sc0 = checkInfo[0].score
        //         let sc2 = checkInfo[2].score
        //         if (info2) {
        //             sc0 = info2[0].score
        //             sc2 = info2[2].score
        //         }
        //         if (check2.includes(checkInfo[0].name) && cards[2].score > checkInfo[2].score) {
        //             let p = getPoint(cards[2].ids[0])
        //             if (p >= 12 && check4.includes(cards[2].name)) { //特殊处理，如果头道对子是Q以上，不管尾道大小
        //                 info2 = cards
        //                 break
        //             }
        //         }

        //         if (cards[2].score > sc2 && cards[0].score >= sc0) {
        //             info2 = cards
        //         }

        //     }
        //     if (info2) {
        //         let tou2 = info2[2].ids.slice()
        //         let zhong2 = info2[1].ids.slice()
        //         let wei2 = info2[0].ids.slice()
        //         info2[2].ids = checkInfo[2].ids.slice()
        //         info2[1].ids = checkInfo[1].ids.slice()
        //         info2[0].ids = checkInfo[0].ids.slice()
        //         checkInfo[2].ids = tou2
        //         checkInfo[1].ids = zhong2
        //         checkInfo[0].ids = wei2
        //     } else
        //     if (checkInfo[1].name == "hl") { //中道是葫芦
        //         let hl = checkInfo[1].ids.slice()
        //         checkInfo[1].ids[3] = checkInfo[2].ids[1]
        //         checkInfo[1].ids[4] = checkInfo[2].ids[2]
        //         checkInfo[2].ids[1] = hl[3]
        //         checkInfo[2].ids[2] = hl[4]
        //     } else if (checkInfo[1].name == "ld") {
        //         let wl = checkInfo[2].ids.slice()
        //         let points = idsToPoints(wl)
        //         if (!points.includes(idToPoint(checkInfo[1].ids[2])) &&
        //             !points.includes(idToPoint(checkInfo[1].ids[3]))) { //防止把头道换成3条
        //             checkInfo[2].ids[1] = checkInfo[1].ids[2]
        //             checkInfo[2].ids[2] = checkInfo[1].ids[3]
        //             checkInfo[1].ids[2] = wl[1]
        //             checkInfo[1].ids[3] = wl[2]
        //         }
        //     }
        // }
        return resArr.slice(0, 7)
    };

    //根据名字获得一组牌
    getElectionByName(ids, name, lastElection) {
        if (!ids || ids.length === 0) {
            return [];
        }
        var groupByPoint = getGroupByPoint(ids);
        var groupByColor = getGroupByColor(ids);
        var points = idsToPoints(ids);
        var pointsGui = getGroupByPointGui(ids);
        var groupByPointSZ = ids.slice();
        delIds(pointsGui, groupByPointSZ); //去重
        if (!lastElection || lastElection.length === 0) {
            lastElection = null;
        }
        if (name === "liuTong") {
            return this.getAnLTorWTorTZ(0, groupByPoint, lastElection, pointsGui)
        } else if (name === "wutong") {
            return this.getAnLTorWTorTZ(1, groupByPoint, lastElection, pointsGui)
        } else if (name === "tonghuashun") {
            return this.getAnTHS(groupByColor, lastElection, pointsGui);
        } else if (name === "tiezhi") {
            return this.getAnLTorWTorTZ(2, groupByPoint, lastElection, pointsGui)
        } else if (name === "hulu") {
            return this.getAnHL(groupByPoint, lastElection, pointsGui);
        } else if (name === "tonghua") {
            return this.getAnSameCount(groupByColor, lastElection, pointsGui, 5);
        } else if (name === "shunzi") {
            return this.getAnSZ(groupByPointSZ, lastElection, pointsGui);
        } else if (name === "santiao") {
            return this.getAnLTorWTorTZ(3, groupByPoint, lastElection, pointsGui)
        } else if (name === "liangdui") {
            return this.getAnLD(groupByPoint, lastElection, pointsGui);
        } else if (name === "duizi") {
            return this.getAnSameCount(groupByPoint, lastElection, pointsGui, 2)
        }
    }
    //获得组合的类型的得分
    getElectionTypeScore(ids, groupByPoint, groupByColor, points, pointsGui) {
        if (this.isHoldLT(groupByPoint, pointsGui)) {
            return ElectionTypeScore.LT;
        } else if (this.isHoldWT(groupByPoint, pointsGui)) {
            return ElectionTypeScore.WT;
        } else if (this.isHoldTHS(groupByColor, pointsGui)) {
            return ElectionTypeScore.THS;
        } else if (this.isHoldTZ(groupByPoint, pointsGui)) {
            return ElectionTypeScore.TZ;
        } else if (this.isHoldHL(groupByPoint, pointsGui)) {
            return ElectionTypeScore.HL;
        } else if (this.isHoldTH(groupByColor, pointsGui)) {
            return ElectionTypeScore.TH;
        } else if (this.isHoldSZ(points, pointsGui)) {
            return ElectionTypeScore.SZ;
        } else if (this.isHoldST(groupByPoint, pointsGui)) {
            return ElectionTypeScore.ST;
        } else if (this.isHoldLD(groupByPoint, pointsGui)) {
            return ElectionTypeScore.LD;
        } else if (this.isHoldDZ(groupByPoint, pointsGui)) {
            return ElectionTypeScore.DZ;
        }
        return ElectionTypeScore.WL;
    };
    //获得组合的得分，即类型分+牌大小
    getElectionScore(idList) {
        if (!idList || !idList.length || idList.length <= 0) return -1;
        let ids = idList.slice();
        ids = _typeCardsSortByScores(ids, true);

        var groupByPoint = getGroupByPoint(ids);
        var groupByColor = getGroupByColor(ids);
        var points = idsToPoints(ids);
        var pointsGui = getGroupByPointGui(ids);
        var typeScore = this.getElectionTypeScore(ids, groupByPoint, groupByColor, points, pointsGui);

        let jokerCount = this.getJokerCount()
        let maxId = -1 //最大牌值对应的id
        if (jokerCount > 0 && (typeScore == ElectionTypeScore.TZ || typeScore == ElectionTypeScore.WT) && pointsGui.length > 0) {
            /**有王的铁支和五同要特殊计算 */
            let maxPoint = -1 //牌的最大值
            const keys = Object.keys(groupByPoint)
            for (let i = 0; i < keys.length; i++) {
                const point = parseInt(keys[i])
                const cids = groupByPoint[point];
                if (point > maxPoint) {
                    if (typeScore == ElectionTypeScore.TZ) {
                        if (!this.checkJokerRule(point) && (cids.length + pointsGui.length == 4) ||
                            this.checkJokerRule(point) && (cids.length + pointsGui.length == 3)) { //判断是不是可以升级的牌值
                            if (maxPoint != 1 && maxPoint < point) { //1是A是最大的
                                maxPoint = point
                                maxId = cids[0]
                            }
                        }
                    } else if (typeScore == ElectionTypeScore.WT) {
                        if (this.checkJokerRule(point) && (cids.length + pointsGui.length == 4) ||
                            !this.checkJokerRule(point) && (cids.length + pointsGui.length == 5)) {
                            if (maxPoint != 1 && maxPoint < point) { //1是A是最大的
                                maxPoint = point
                                maxId = cids[0]
                            }
                        }
                    }
                }
            }

            if (maxId != -1) {
                let maxNoTi = -1
                let maxNoTiId = -1
                for (let i = 0; i < keys.length; i++) {
                    const point = parseInt(keys[i])
                    const idList = groupByPoint[point];
                    if (point != maxPoint && point > maxNoTi) {
                        maxNoTi = point
                        if (point == 1) {
                            maxNoTi = 14
                        }
                        maxNoTiId = idList[0]
                    }
                }
                if (typeScore == ElectionTypeScore.WT) {
                    if (ids.length == 4) {
                        ids.push(maxId)
                    }
                    if (pointsGui.length == 3) {
                        for (let i = 0; i < ids.length; i++) {
                            const id = ids[i];
                            if (id == 52 || id == 53) {
                                ids[i] = maxId
                                break
                            }
                        }
                    }
                } else { //如果是铁支，要留下最大的不能替换的牌，把其他的牌替换成maxid
                    if (ids.length == 3) { //凑5张
                        ids.push(maxId)
                        ids.push(1)
                    }
                    if (maxNoTiId != -1) {
                        for (let i = 0; i < ids.length; i++) {
                            const id = ids[i];
                            if (id != maxNoTiId) {
                                ids[i] = maxId
                            }
                        }
                    }
                }
                /**重新给points赋值 */
                points = idsToPoints(ids);
                groupByColor = getGroupByColor(ids);
            }
        }
        if (ids.length == 4) {
            if (typeScore == ElectionTypeScore.TZ) {
                ids.push(1)
                points = idsToPoints(ids)
            }
            if (typeScore == ElectionTypeScore.WT) {
                ids.push(ids[0])
                points = idsToPoints(ids)
            }
        }

        var totalValue = "";
        var totalColor = "";
        ids.forEach(function (id) {
            totalColor += "0";
        });

        /**计算花色分 只比最大那张牌的花色 */
        totalColor = totalColor.slice(0, -1)
        let color = idToColor(ids[0])
        if (maxId != -1) {
            color = idToColor(maxId)
        }
        totalColor = color + totalColor

        if (isHoldWithA(points)) points = turnAllATo14(points.slice());

        if ((typeScore == ElectionTypeScore.THS || typeScore == ElectionTypeScore.SZ) && pointsGui.length > 0) {
            points = _changeCardScors(points);
        }

        var max = 0;
        var maxValue = 1;
        var scoresHelper = _getCardPointsSameCount(ids.slice());
        for (var i in scoresHelper) {
            if (parseInt(i) > 14) continue;
            var p = parseInt(scoresHelper[i]);
            if (p > maxValue) maxValue = p;
        }
        for (var i in scoresHelper) {
            var p = parseInt(i) == 1 ? 14 : parseInt(i);
            if (maxValue == parseInt(scoresHelper[i]) && p < 50 && max < p) {
                max = p;
            }
        }

        if (max != 0) points.sort(function (a1s, a2s) {
            var a1 = a1s;
            var a2 = a2s;
            if (a1 > 50) a1 = max;
            if (a2 > 50) a2 = max;
            var numberOfCard1 = scoresHelper[a1 == 14 ? 1 : a1];
            var numberOfCard2 = scoresHelper[a2 == 14 ? 1 : a2];
            if (numberOfCard2 != numberOfCard1) return numberOfCard2 - numberOfCard1;
            if (a1 == 1) a1 = 14;
            if (a2 == 1) a2 = 14;
            return a2 - a1;
        });

        for (var i = 0; i < points.length; i++) {
            var p = (points[i] >= 10 ? "" + points[i] : "0" + points[i]);
            if (p == 1) p = 14;
            if (p > 15) p = (max >= 10 ? "" + max : "0" + max);
            totalValue += p;
        }

        if ((typeScore == ElectionTypeScore.TH)) {
            var b52 = scoresHelper["52"] ? scoresHelper["52"] : 0;
            var b53 = scoresHelper["53"] ? scoresHelper["53"] : 0;
            if (b52) delete scoresHelper["52"];
            if (b53) delete scoresHelper["53"];
            b52 += b53;
            var objKeys = Object.keys(scoresHelper);

            objKeys = objKeys.sort(function (a, b) {
                var a1 = parseInt(a);
                var b1 = parseInt(b);
                return (b1 == 1 ? 14 : b1) - (a1 == 1 ? 14 : a1);
            });
            var totalCont = "";
            totalValue = "";
            for (var i = 0; i < objKeys.length; i++) {
                var v = parseInt(scoresHelper[objKeys[i]]);
                var k = parseInt(objKeys[i]) == 1 ? 14 : parseInt(objKeys[i]);
                if (b52) { //王的数量加给最大值
                    v += b52;
                    b52 = false;
                }

                if (v > 1) {
                    if (this.gameRule.tongHuaBiDui) {
                        /**有同花比对 比谁的对子大 */
                        totalCont += `${20+k}`
                        if (v == 3) {
                            totalCont += `${20+k}`
                        }
                    } else {
                        totalValue += (k >= 10 ? k : "0" + k)
                        if (v == 3) {
                            totalValue += (k >= 10 ? k : "0" + k)
                        }
                    }
                }
                totalValue = totalValue + (k >= 10 ? k : "0" + k);
            }
            totalValue = totalCont + totalValue;
        }
        if (ids.length == 3) {
            if (pointsGui.length == 3) totalValue = "141414";
            totalValue += "0000";
            totalColor += "00";
        }

        return typeScore + parseInt(totalValue + totalColor);
    }

    /**检测鬼牌数量 是否可以升级牌型 */
    checkJokerRule(i) {
        let jokerCount = this.getJokerCount();
        return jokerCount > 0 && i <= (jokerCount + 1) && i > 1 && i <= 9
    };


    //六同
    isHoldLT(groupByPoint, pointsGui = []) {
        if (pointsGui.length >= 5) {
            return true
        }
        for (var i in groupByPoint) {
            if (this.checkJokerRule(i) && groupByPoint[i].length >= 5 - pointsGui.length) {
                return true;
            }
        }
        return false;
    }

    //五同
    isHoldWT(groupByPoint, pointsGui = []) {
        for (var i in groupByPoint) {
            //铁支算五同
            if (this.checkJokerRule(i) && groupByPoint[i].length >= 4 - pointsGui.length) {
                return true;
            } else if (groupByPoint[i].length >= 5 - pointsGui.length) {
                return true;
            }
        }
        return false;
    }
    //同花顺
    isHoldTHS(groupByColor, pointsGui) {
        pointsGui = pointsGui.slice(0, 3)
        for (var i in groupByColor) {
            if (groupByColor[i].length >= 5 - pointsGui.length) {
                var points = idsToPoints(groupByColor[i]);
                points = dereplication(points); //去重，对原数组无影响
                points.sort(sortPointByPoint);
                for (let j = 0; j <= points.length - 5 + pointsGui.length; j++) {
                    if (isSZGui(points.slice(j, j + 5 - pointsGui.length), pointsGui)) {
                        return true;
                    }
                }
                if (isHoldWithA(points)) {
                    points = turnOneATo14(points);
                    points.sort(sortPointByPoint);
                    for (let k = 0; k <= points.length - 5 + pointsGui.length; k++) {
                        if (isSZGui(points.slice(k, k + 5 - pointsGui.length), pointsGui)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    //铁支
    isHoldTZ(groupByPoint, pointsGui = []) {
        var sanTol = 0;
        var fourTol = 0;
        var oneTol = 0;
        for (var i in groupByPoint) {
            if (this.checkJokerRule(i) && groupByPoint[i].length >= 3 - pointsGui.length) {
                sanTol++;
            } else if (!this.checkJokerRule(i) && groupByPoint[i].length >= 4 - pointsGui.length) {
                fourTol++;
            } else {
                oneTol++;
            }
        }
        return (fourTol >= 2) || (fourTol >= 1) || (sanTol >= 1);
    }
    //葫芦
    isHoldHL(groupByPoint, pointsGui = []) {
        var threeTol = 0;
        var twoTol = 0;
        for (var i in groupByPoint) {
            if (!this.checkJokerRule(i) && groupByPoint[i].length >= 3) {
                threeTol++;
            } else if (!(this.checkJokerRule(i) && pointsGui.length > 0) && groupByPoint[i].length >= 2) {
                twoTol++;
            }
        }
        return (threeTol >= 2) || (threeTol >= 1 && twoTol >= 1) || (twoTol >= 2 && pointsGui.length >= 1);
    }
    //同花
    isHoldTH(groupByColor, pointsGui) {
        for (var i in groupByColor) {
            if (groupByColor[i].length >= 5 - pointsGui.length) {
                return true;
            }
        }
        return false;
    }
    //顺子
    isHoldSZ(points, pointsGui = []) { //11s
        points = dereplication(points);
        if (points.length < 2 || points.length + pointsGui.length < 5) {
            return false
        }
        pointsGui = pointsGui.slice(0, 3)
        points.sort(sortPointByPoint);
        for (var k = 0; k <= points.length - 5 + pointsGui.length; k++) {
            if (isSZGui(points.slice(k, k + 5 - pointsGui.length), pointsGui)) {
                return true;
            }
        }
        if (isHoldWithA(points)) {
            points = turnOneATo14(points);
            points.sort(sortPointByPoint);
            for (var k = 0; k <= points.length - 5 + pointsGui.length; k++) {
                if (isSZGui(points.slice(k, k + 5 - pointsGui.length), pointsGui)) {
                    return true;
                }
            }
        }
        return false;
    }
    //三条
    isHoldST(groupByPoint, pointsGui = []) {
        for (const i in groupByPoint) {
            if (!(this.checkJokerRule(i) && groupByPoint[i].length >= 3 - pointsGui.length) &&
                groupByPoint[i].length >= 3 - pointsGui.length) {
                return true
            }
        }
        return false;
    }
    //两对
    isHoldLD(groupByPoint, pointsGui = []) {
        var doubleTol = 0;
        for (var i in groupByPoint) {
            if (groupByPoint[i].length >= 2) {
                doubleTol++;
            }
        }
        return doubleTol >= 2;
    }
    //对子
    isHoldDZ(groupByPoint, pointsGui = []) {
        var lentgh = 2 - pointsGui.length <= 0 ? 1 : 2 - pointsGui.length;
        var length1 = false;
        for (var i in groupByPoint) {
            length1 = true;
            if (groupByPoint[i].length >= lentgh) {
                return true;
            }
        }
        if (pointsGui.length >= 2 && !length1) return true;
        return false;
    };

    getAnSameCount(groupByPoint, lastElection, pointsGui, length, isRetuenAll = false) {
        var result = [];

        for (var t = 0; t < pointsGui.length + 1; t++) {

            var num = length - t == 0 ? 1 : length - t;

            var re = getGroupByResult(clone(groupByPoint), num);

            for (var i = 0; i < re.length; i++) {

                re[i] = re[i].concat(pointsGui.slice(0, length - num));

                re[i].sort(function (a, b) {
                    return b - a;
                });
            }

            result = result.concat(re);
        }
        // console.log("分组组合完成==", result, groupByPoint)
        var resultArrays = this.reptAnSort(result); /*去重排序*/
        // console.log("去重排序后==", resultArrays)
        if (resultArrays.length <= 0 && pointsGui.length >= length) {
            resultArrays.push(pointsGui.slice(0, length));
        }
        if (isRetuenAll) return resultArrays;
        // console.log("====", resultArrays)
        if (!lastElection) {
            return resultArrays[0];
        }
        lastElection.sort(function (a, b) {
            return b - a;
        });
        // console.log("排序", lastElection, resultArrays)
        var lastIndex = -1;
        for (var i = 0; i < resultArrays.length; i++) {
            resultArrays[i].sort(function (a, b) {
                return b - a;
            })
            if (resultArrays[i].toString() === lastElection.toString()) {
                lastIndex = i;
                break;
            }
        }
        return resultArrays[(lastIndex + 1) % resultArrays.length];
    }

    /**获取流通0五同1铁支2三条3*/
    getAnLTorWTorTZ(type, groupByPoint, lastElection, pointsGui, isRetuenAll = false) {
        let result = []
        let res1 = [],
            res2 = []
        if (type == 0) {
            res2 = this.getAnSameCount(groupByPoint, null, pointsGui, 5, true)
        } else if (type == 1) {
            res1 = this.getAnSameCount(groupByPoint, null, pointsGui, 5, true)
            res2 = this.getAnSameCount(groupByPoint, null, pointsGui, 4, true)
        } else if (type == 2) {
            res1 = this.getAnSameCount(groupByPoint, null, pointsGui, 4, true)
            res2 = this.getAnSameCount(groupByPoint, null, pointsGui, 3, true)
        } else if (type == 3) {
            res1 = this.getAnSameCount(groupByPoint, null, pointsGui, 3, true)
        }

        res1.forEach(list => {
            list.sort((a, b) => a - b)
            let i = idToPoint(list[0])
            if (!this.checkJokerRule(i)) {
                result.push(list)
            }
        });
        res2.forEach(list => {
            list.sort((a, b) => a - b)
            let i = idToPoint(list[0])
            if (this.checkJokerRule(i)) {
                result.push(list)
            }
        })

        let resultArrays = this.reptAnSort(result);
        if (isRetuenAll) return resultArrays;
        if (!lastElection) {
            return resultArrays[0];
        }
        var lastIndex = -1;
        for (var i = 0; i < resultArrays.length; i++) {
            if (resultArrays[i].toString() === lastElection.toString()) {
                lastIndex = i;
                break;
            }
        }
        return resultArrays[(lastIndex + 1) % resultArrays.length];
    }

    getAnTHS(groupByColor, lastElection, pointsGui, isRetuenAll) {
        var lastIsTHS = (lastElection === null || lastElection.length !== 5) ? false : this.isHoldTHS(getGroupByColor(lastElection), pointsGui);
        var allTHSMap = {};
        var pointTHS = [];
        var allTHS = [];
        pointsGui = pointsGui.slice(0, 3)
        var length = 5;
        for (var i in groupByColor) {
            for (var q = 0; q < pointsGui.length + 1; q++) {
                var num = length - q;
                if (groupByColor[i].length >= num) {
                    var points = idsToPoints(groupByColor[i]);
                    points = dereplication(points); //去重，对原数组无影响;
                    points.sort(sortPointByPoint);

                    for (var j = 0; j <= points.length - num; j++) {
                        if (isSZGui(points.slice(j, j + num), pointsGui.slice(0, q))) {
                            pointTHS.push(points.slice(j, j + num));
                        }
                    }
                    if (isHoldWithA(points)) {
                        points = turnOneATo14(points);
                        points.sort(sortPointByPoint);
                        for (var k = 0; k <= points.length - num; k++) {
                            if (isSZGui(points.slice(k, k + num), pointsGui.slice(0, q))) {
                                pointTHS.push(points.slice(k, k + num));
                            }
                        }
                    }
                    while (pointTHS.length > 0) {
                        var sz = pointTHS.pop();
                        var ids = pointsToIds(sz, parseInt(i)).concat(pointsGui.slice(0, q));
                        allTHSMap[ids.toString()] = ids;
                    }
                }
            }
        }

        for (var i in allTHSMap) {
            allTHS.push(allTHSMap[i]);
        }
        allTHSMap = null;
        if (allTHS.length === 0) {
            return []
        }

        allTHS = this.reptAnSort(allTHS); /*去重排序*/

        if (isRetuenAll) return allTHS;
        if (!lastIsTHS) {
            return allTHS[0];
        }
        var lastIndex = -1;
        var lastScore = this.getElectionScore(lastElection);
        for (var i = 0; i < allTHS.length; i++) {
            if (lastScore === this.getElectionScore(allTHS[i])) {
                lastIndex = i;
                break;
            }
        }
        return allTHS[(lastIndex + 1) % allTHS.length];
    }

    getAnHL(groupByPoint, lastElection, pointsGui, isRetuenAll = false) {
        var sanTiao = this.getAnLTorWTorTZ(3, groupByPoint, null, [], true); //三条没有带单牌
        var duiZi = []
        for (const i in groupByPoint) {
            if (Object.hasOwnProperty.call(groupByPoint, i)) {
                const list = groupByPoint[i];
                if (list.length >= 2) {
                    duiZi.push(list.slice(0, 2))
                }
            }
        }
        var allHL = [];
        if (duiZi.length >= 1 && sanTiao.length >= 1) {
            sanTiao.forEach(function (i_3) {
                var s = i_3;
                duiZi.forEach(function (i_2) {
                    if (idToPoint(i_2[0]) >= 1 && idToPoint(i_2[1]) <= 51) {
                        if (i_3.indexOf(i_2[0]) == -1 && i_3.indexOf(i_2[1]) == -1) {
                            s = i_3.concat(i_2);
                            allHL.push(s);
                        }
                    }
                });
            });
        } else if (duiZi.length >= 2 && pointsGui.length >= 1) {
            for (var i = 0; i < duiZi.length; i++) {
                for (var j = 1; j < duiZi.length; j++) {
                    if (j == i) break;
                    var a = duiZi[i];
                    var b = duiZi[j];
                    if (!this.checkJokerRule(idToPoint(a[0])) && !this.checkJokerRule(idToPoint(b[0]))) {
                        allHL.push(a.concat(b).concat(pointsGui.slice(0, 1)));
                    }
                }
            }
        }
        if (allHL.length < 1) {
            return []
        }
        allHL = this.reptAnSort(allHL); /*去重排序*/

        if (isRetuenAll) return allHL;
        if (!lastElection) {
            return allHL[0];
        }
        lastElection.sort(function (a, b) {
            return b - a;
        });
        allHL.forEach(function (arr) {
            arr.sort(function (id1, id2) {
                return id2 - id1;
            });
        });
        var lastIndex = -1;
        for (var i = 0; i < allHL.length; i++) {
            if (allHL[i].toString() === lastElection.toString()) {
                lastIndex = i;
                break;
            }
        }
        return allHL[(lastIndex + 1) % allHL.length];
    }

    getAnSZ(ids, lastElection, pointsGui, isRetuenAll) {
        ids = ids.filter(function (id) {
            return id !== 52 || id !== 53;
        });
        ids = dereplicationByPoint(ids);
        if (ids.length < 2 || ids.length + pointsGui.length < 5) {
            return []
        }
        pointsGui = pointsGui.slice(0, 3)
        ids.sort(sortIDByPoint);
        var allSZ = [];
        var length = 5;

        for (var j = 0; j < pointsGui.length + 1; j++) {
            var num = length - j;
            for (var i = 0; i <= ids.length - num; i++) {
                if (isSZGui(idsToPoints(ids.slice(i, i + num)), pointsGui)) {
                    allSZ.push(ids.slice(i, i + num).concat(pointsGui.slice(0, j)));
                }
            }
        }

        if (isHoldWithA(ids, true)) {
            ids.sort(function (id1, id2) {
                var point1 = idToPoint(id1);
                var point2 = idToPoint(id2);
                point1 = point1 === 1 ? 14 : point1;
                point2 = point2 === 1 ? 14 : point2;
                var rs = point1 - point2;
                rs = rs === 0 ? (idToColor(id1) - idToColor(id2)) : rs;
                return rs;
            });
            for (var j = 0; j < pointsGui.length + 1; j++) {
                var num = length - j;
                for (var i = 0; i <= ids.length - num; i++) {
                    var points = idsToPoints(ids.slice(i, i + num));
                    points = turnAllATo14(points);
                    if (isSZGui(points, pointsGui)) {
                        allSZ.push(ids.slice(i, i + num).concat(pointsGui.slice(0, j)));
                    }
                }
            }
        }

        if (allSZ.length === 0) {
            return [];
        }

        allSZ.forEach(function (arr) {
            arr.sort(function (a, b) {
                return b - a;
            });
        });

        var allSZNoRepeat = this.reptAnSort(allSZ); /*去重排序*/

        if (isRetuenAll) return allSZNoRepeat;
        if (!lastElection) {
            return allSZNoRepeat[0];
        }

        var lastIndex = -1;
        for (var i = 0; i < allSZNoRepeat.length; i++) {
            if (allSZNoRepeat[i].toString() === lastElection.toString()) {
                lastIndex = i;
                break;
            }
        }
        return allSZNoRepeat[(lastIndex + 1) % allSZNoRepeat.length];
    }

    getAnLD(groupByPoint, lastElection, pointsGui, isRetuenAll) {
        var lastIsLD = lastElection === null ? false : this.isHoldLD(getGroupByPoint(lastElection));
        var priorityDZ = [];
        var minorDZ = [];
        for (var i in groupByPoint) {
            if (groupByPoint[i].length === 2) {
                priorityDZ.push(groupByPoint[i]);
            } else if (groupByPoint[i].length > 2) {
                minorDZ.push(groupByPoint[i].slice(0, 2));
            }
        }
        if (priorityDZ.length + minorDZ.length < 2) {
            return [];
        }
        priorityDZ.sort(function (arr1, arr2) {
            return idToPoint(arr2[0]) - idToPoint(arr1[0]);
        });
        minorDZ.sort(function (arr1, arr2) {
            return idToPoint(arr2[0]) - idToPoint(arr1[0]);
        });
        var allDZ = priorityDZ.concat(minorDZ);
        var allLDGroup = sampling(allDZ, 2);
        var allLD = [];
        allLDGroup.forEach(function (group) {
            allLD.push(group[0].concat(group[1]));
        });

        allLD = this.reptAnSort(allLD); /*去重排序*/

        if (isRetuenAll) return allLD;
        if (!lastIsLD) {
            return allLD[0];
        }
        allLD.forEach(function (arr) {
            arr.sort(function (a, b) {
                return b - a;
            });
        });
        lastElection.sort(function (a, b) {
            return b - a;
        });
        var lastIndex = -1;
        for (var i = 0; i < allLD.length; i++) {
            if (allLD[i].toString() === lastElection.toString()) {
                lastIndex = i;
                break;
            }
        }
        return allLD[(lastIndex + 1) % allLD.length];
    }

    /*选出分数最大的一组*/
    autoSelectCards(ids, isReturnAll, index, guiMin) {
        if (!ids || ids.length === 0) {
            return [];
        }
        if (!index) index = 0;
        var groupByPoint = getGroupByPoint(ids);
        var groupByColor = getGroupByColor(ids);
        var pointsGui = getGroupByPointGui(ids);
        var groupByPointSZ = ids.slice();
        delIds(pointsGui, groupByPointSZ); //去重

        var findFuncs = [
            this.getAnLTorWTorTZ(0, groupByPoint, null, pointsGui, true),
            this.getAnLTorWTorTZ(1, groupByPoint, null, pointsGui, true),
            this.getAnTHS(groupByColor, null, pointsGui, true),
            this.getAnLTorWTorTZ(2, groupByPoint, null, pointsGui, true),
            this.getAnHL(groupByPoint, null, pointsGui, true),
            this.getAnSameCount(groupByColor, null, pointsGui, 5, true),
            this.getAnSZ(groupByPointSZ, null, pointsGui, true),
            this.getAnLTorWTorTZ(3, groupByPoint, null, pointsGui, true),
            this.getAnLD(groupByPoint, null, pointsGui, true),
            this.getAnSameCount(groupByPoint, null, pointsGui, 2, true),
        ];

        var indexArrays = [];
        for (var i = index; i < findFuncs.length; ++i) {
            var func = findFuncs[i];
            if (func && func.length > 0) {
                indexArrays = indexArrays.concat(func);
                indexArrays = this.reptAnSort(indexArrays); /*去重排序*/
                index = i + 1;
                if (!isReturnAll) break;
            }
        }

        var idsArrAy = [];
        if (indexArrays && indexArrays.length > 0) {

            if (isReturnAll) return indexArrays; //返回全部

            // 找出同类型的牌里的分数最大的牌
            var maxScore = 0;
            indexArrays.forEach((idsArr) => {
                var score = this.getElectionScore(idsArr);
                var scoreStr = score + "";
                //var s1 = scoreStr.indexOf("52");
                //var s2 = scoreStr.indexOf("53");
                if (guiMin /* && (s1 < 5 || s1 < 6)*/ ) {
                    score = parseInt(scoreStr.replace('52', '00'));
                    score = parseInt(scoreStr.replace('53', '00'));
                }
                if (score > maxScore) {
                    maxScore = score;
                    idsArrAy = idsArr;
                }
            });

        }

        return idsArrAy || [];
    }

    /*去重排序*/
    reptAnSort(result, length) {
        var resultJsons = {};
        for (var i = 0; i < result.length; ++i) {
            var func = result[i];
            if (func && func.length > 0) {
                func = _typeCardsSortByScores(func);
                resultJsons[func.toString()] = func;
            }
        }
        var results = [];
        for (var i in resultJsons) {
            results.push(resultJsons[i]);
        }
        results.sort((group1, group2) => {
            return this.getElectionScore(group2) - this.getElectionScore(group1);
        });
        if (length) {
            var countFun = function (names, name) {
                var count = 0;
                for (var f = 0; f < names.length; f++) {
                    if (names[f] == name) count++;
                }
                return count;
            };
            var nameA = [];
            var resultA = [];
            for (var i = 0; i < results.length; ++i) {
                var result1 = results[i];
                var name1 = this.getTypeNameAndScore(result1);
                if (countFun(nameA, name1.name) < length) {
                    nameA.push(name1.name);
                    resultA.push(result1);
                }
            }
            return resultA;
        }
        return results;
    }






    //特殊牌排序
    dealSpecialCard(ids, type) {
        // console.log("类型:",type);
        // console.log("牌",ids);
        if (!ids || !ids.length || ids.length !== 13) return;
        var SpecialTypes = {
            qinglong: this.dealLong(ids), // ok
            yitiaolong: this.dealLong(ids), // ok
            shierhuangzu: this.dealSRHZ(ids), // ok
            santonghuashun: this.dealSTHS(ids, true), // ok
            sanfentianxia: this.dealSFTX(ids), // ok
            quanda: this.dealQDX(ids), // ok
            quanxiao: this.dealQDX(ids), // ok
            couyise: this.dealCYS(ids), // ok
            sitaosantiao: this.dealSTST(ids), // ok
            wuduisantiao: this.dealWDST(ids), // ok
            liuduiban: this.dealLDB(ids), // ok
            sanshunzi: this.dealSsz(ids), // ok
            santonghua: this.dealSTHS(ids, false), // ok
            banda: this.dealQDX(ids, false), // ok.
            banxiao: this.dealQDX(ids, false),
            quanheyidianhong: this.dealCYS(ids),
            quanhongyidianhei: this.dealCYS(ids),
        };
        // console.log(SpecialTypes[type]);
        return SpecialTypes[type];
    }



    // 整理龙的牌型
    dealLong(ids) {
        ids.sort((a, b) => {
            return idToPoint(a) - idToPoint(b)
        });
        // ids.sort(function (a, b) {
        //     return (a > 13 ? a % 13 : a) - (b > 13 ? b % 13 : b);
        // });
        var touArr = ids.slice(0, 3);
        var zhongArr = ids.slice(3, 3 + 5);
        var weiArr = ids.slice(8);
        var tou = this.getTypeNameAndScore(touArr);
        var zhong = this.getTypeNameAndScore(zhongArr);
        var wei = this.getTypeNameAndScore(weiArr);
        return [wei, zhong, tou];
    }

    checkIsSZ(points) {
        for (var i = 0; i < points.length - 1; i++) {
            var first = points[i] > 13 ? points[i] % 13 : points[i];
            var last = points[i + 1] > 13 ? points[i + 1] % 13 : points[i + 1];
            if (Math.abs(first - last) !== 1) {
                return false;
            }
        }
        return true;
    }

    checkIsSSZ(ids, container) {
        var points = ids.slice();
        points.sort(defalutIdsSort);
        var notRepetPointOf5 = getNotRepeatOfCards(points, 5);
        var notRepetPointOf3 = false;
        var result = false;
        if (notRepetPointOf5) {
            if (this.checkIsSZ(notRepetPointOf5.result)) {
                result = this.checkIsSSZ(notRepetPointOf5.theRest, container);
                container.push(notRepetPointOf5.result);
            } else {
                notRepetPointOf3 = getNotRepeatOfCards(points, 3);
                if (this.checkIsSZ(notRepetPointOf3.result)) {
                    container.push(notRepetPointOf3.result);
                    result = this.checkIsSSZ(notRepetPointOf3.theRest, container);
                }
            }
        }
        if (result === false) {
            notRepetPointOf3 = getNotRepeatOfCards(points, 3);
            if (notRepetPointOf3 && this.checkIsSZ(notRepetPointOf3.result, container)) {
                container.push(notRepetPointOf3.result);
                result = true;
            } else {
                container = [];
            }
        }
        return result;

    }

    // 整理三顺子的牌型
    dealSsz(ids) {
        // var points = ids.slice();
        // var points = dereplication(ids.slice());
        var points = ids.slice();
        points.sort(defalutIdsSort);

        var notRepetPointOf5 = getNotRepeatOfCards(points, 5);
        var notRepetPointOf3 = false;
        var result = false;
        var container = [];
        if (notRepetPointOf5) {
            if (this.checkIsSZ(notRepetPointOf5.result)) {
                container.push(notRepetPointOf5.result);
                result = this.checkIsSSZ(notRepetPointOf5.theRest, container);
            } else {
                notRepetPointOf3 = getNotRepeatOfCards(points, 3);
                if (this.checkIsSZ(notRepetPointOf3.result)) {
                    container.push(notRepetPointOf3.result);
                    result = this.checkIsSSZ(notRepetPointOf3.theRest, container);
                }
            }
        }
        if ( /*!container.length*/ result === false) {
            notRepetPointOf3 = getNotRepeatOfCards(points, 3);
            if (notRepetPointOf3 && this.checkIsSZ(notRepetPointOf3.result, container)) {
                container.push(notRepetPointOf3.result);
                result = true;
            } else {
                container = [];
            }
        }

        if (container.length === 3) {
            var specialCards = [];
            for (var i = 0; i < container.length; i++) {
                specialCards.push(this.getTypeNameAndScore(container[i]));
            }
            specialCards.sort(function (a, b) {
                return b.score - a.score;
            });
            return specialCards;
        }
        return null
    }

    // 整理 三同花/三同花顺 的牌型
    dealSTHS(ids, STHS) {
        var groupByColor = getGroupByColor(ids);
        var Arr = [];
        for (var index in groupByColor) {
            if (groupByColor[index].length === 5 || groupByColor[index].length === 3) {
                // 如果是5张牌的这不用管
                var result = this.getTypeNameAndScore(groupByColor[index]);
                Arr.push(result);
            } else {
                var cards = groupByColor[index].slice();
                // 如果是 三同花顺
                if (STHS) {
                    var dereCard = dereplication(cards.slice());
                    dereCard.sort(function (a, b) {
                        return b - a;
                    });
                    var len = 5;
                    for (var i = 0; i + 5 <= dereCard.length; i++) {
                        var shunZiArr = dereCard.slice(i, i + len);
                        shunZiArr.sort(defalutIdsSort);
                        var first = shunZiArr[0];
                        var last = shunZiArr[shunZiArr.length - 1];

                        if (Math.abs((first > 13 ? first % 13 : first) - (last > 13 ? last % 13 : last)) === 4) {
                            var delCards = cards.slice();
                            delIds(shunZiArr, delCards);
                            delCards.sort(defalutIdsSort);
                            var firstDel = delCards[0];
                            var lastDel = delCards[delCards.length - 1];
                            if (Math.abs((firstDel > 13 ? firstDel % 13 : firstDel) - (lastDel > 13 ? lastDel % 13 : lastDel)) === 2) {
                                // if (delCards.toString() == [2, 1, 0].toString()) {
                                //     delCards = [0, 1, 2];
                                // } else if (delCards.toString() == [15, 14, 13].toString()) {
                                //     delCards = [13, 14, 15];
                                // }
                                // else if (delCards.toString() == [28, 27, 26].toString()) {
                                //     delCards = [26, 27, 28];
                                // }
                                // else if (delCards.toString() == [41, 40, 39].toString()) {
                                //     delCards = [39, 40, 41];
                                // }
                                Arr.push(this.getTypeNameAndScore(delCards));
                                Arr.push(this.getTypeNameAndScore(shunZiArr));
                                break;
                            }
                        }
                    }
                } else {
                    cards.sort(defalutIdsSort);
                    var one = cards.slice(0, 5);
                    var other = cards.slice();
                    delIds(one, other);
                    Arr.push(this.getTypeNameAndScore(one));
                    Arr.push(this.getTypeNameAndScore(other));
                }
            }
        }
        if (Arr.length !== 3) {
            return null
        }
        Arr.sort(function (a, b) {
            return b.score - a.score;
        });
        return Arr;
    }

    // 整理全大/全小 的牌型
    dealQDX(ids) {
        var cards = ids.slice();
        cards.sort(defalutIdsSort);
        var touArr = ids.slice(0, 3);
        var zhongArr = ids.slice(3, 3 + 5);
        var weiArr = ids.slice(8);
        var tou = this.getTypeNameAndScore(touArr);
        var zhong = this.getTypeNameAndScore(zhongArr);
        var wei = this.getTypeNameAndScore(weiArr);
        return [wei, zhong, tou];

    }

    // 整理 六对半 牌型
    dealLDB(ids) {
        var cards = ids.slice();
        cards.sort(defalutIdsSort);
        var touArr = ids.slice(0, 3);
        var zhongArr = ids.slice(3, 3 + 5);
        var weiArr = ids.slice(8);
        var tou = this.getTypeNameAndScore(touArr);
        var zhong = this.getTypeNameAndScore(zhongArr);
        var wei = this.getTypeNameAndScore(weiArr);
        return [wei, zhong, tou];
    }

    // 整理 十二皇族 牌型
    dealSRHZ(ids) {
        var cards = ids.slice();
        cards.sort(defalutIdsSort);
        var touArr = ids.slice(0, 3);
        var zhongArr = ids.slice(3, 3 + 5);
        var weiArr = ids.slice(8);
        var tou = this.getTypeNameAndScore(touArr);
        var zhong = this.getTypeNameAndScore(zhongArr);
        var wei = this.getTypeNameAndScore(weiArr);
        return [wei, zhong, tou];
    }

    // 整理 五对三条 牌型
    dealWDST(ids) {
        var cards = ids.slice();
        cards.sort(defalutIdsSort);
        var touArr = ids.slice(0, 3);
        var zhongArr = ids.slice(3, 3 + 5);
        var weiArr = ids.slice(8);
        var tou = this.getTypeNameAndScore(touArr);
        var zhong = this.getTypeNameAndScore(zhongArr);
        var wei = this.getTypeNameAndScore(weiArr);
        return [wei, zhong, tou];

    }

    // 整理四套三条牌型
    dealSTST(ids) {
        var groupByPoint = getGroupByPoint(ids);
        var touArr = [],
            zhongArr = [],
            weiArr = [];
        var touST = false,
            zhongST = false,
            weiST = false;
        var DPArr = [];
        for (var prop in groupByPoint) {
            if (groupByPoint[prop].length === 3 && (!touST || !zhongST || !weiST)) {
                if (!touST) {
                    touArr = touArr.concat(groupByPoint[prop]);
                    touST = true;
                } else if (!zhongST && touST) {
                    zhongArr = zhongArr.concat(groupByPoint[prop]);
                    zhongST = true;
                } else if (zhongST && !weiST) {
                    weiArr = weiArr.concat(groupByPoint[prop]);
                    weiST = true;
                }
            } else {
                DPArr = DPArr.concat(groupByPoint[prop]);
            }
        }
        for (var i = 0; i < DPArr.length; i++) {
            if (zhongArr.length !== 5) {
                zhongArr = zhongArr.concat(DPArr[i])
            } else if (weiArr.length !== 5) {
                weiArr = weiArr.concat(DPArr[i])
            }
        }
        var tou = this.getTypeNameAndScore(touArr);
        var zhong = this.getTypeNameAndScore(zhongArr);
        var wei = this.getTypeNameAndScore(weiArr);
        return [wei, zhong, tou];

    }

    // 整理 凑一色
    dealCYS(ids) {
        var cards = ids.slice();
        cards.sort(defalutIdsSort);
        var touArr = ids.slice(0, 3);
        var zhongArr = ids.slice(3, 3 + 5);
        var weiArr = ids.slice(8);
        var tou = this.getTypeNameAndScore(touArr);
        var zhong = this.getTypeNameAndScore(zhongArr);
        var wei = this.getTypeNameAndScore(weiArr);
        return [wei, zhong, tou];
    }

    // 整理三分天下
    dealSFTX(ids) {
        var cards = ids.slice();
        cards.sort(defalutIdsSort);
        var touArr = ids.slice(0, 3);
        var zhongArr = ids.slice(3, 3 + 5);
        var weiArr = ids.slice(8);
        var tou = this.getTypeNameAndScore(touArr);
        var zhong = this.getTypeNameAndScore(zhongArr);
        var wei = this.getTypeNameAndScore(weiArr);
        return [wei, zhong, tou];
    }
}

module.exports = new GameUtil();