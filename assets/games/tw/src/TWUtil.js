const A2345IsMin = true;

const ElectionTypeScore = {
    WT: 10000000000000000,
    THS: 9000000000000000,
    TZ: 8000000000000000,
    HL: 7000000000000000,
    TH: 6000000000000000,
    SZ: 5000000000000000,
    ST: 4000000000000000,
    LD: 3000000000000000,
    DZ: 2000000000000000,
    WL: 1000000000000000
};

exports._typeCardsSortByScores = _typeCardsSortByScores;

exports.delIds = delIds;

exports._fp = _fp;

exports.idToPoint = idToPoint;

exports.getGroupAllPokerType = getGroupAllPokerType;

exports.getAllHoldTypeWithNormal = getAllHoldType;

exports.getAllHoldTypeWithSpecial = getSpecialType;

exports.sortIDByPointAndColor = sortIDByPointAndColor;

exports.getElectionByName = getElectionByName;

exports.getElectionScore = getElectionScore;

exports.getTypeNameAndScore = getTypeNameAndScore;

exports.isWL = function (score) {
    return parseInt(score / ElectionTypeScore.WL) === 1;
};

exports.isDZ = function (score) {
    return parseInt(score / ElectionTypeScore.DZ) === 1;
};

exports.isLD = function (score) {
    return parseInt(score / ElectionTypeScore.LD) === 1;
};
exports.isST = function (score) {
    return parseInt(score / ElectionTypeScore.ST) === 1;
};

exports.isHL = function (score) {
    return parseInt(score / ElectionTypeScore.HL) === 1;
};

exports.isTZ = function (score) {
    return parseInt(score / ElectionTypeScore.TZ) === 1;
};

exports.isTHS = function (score) {
    return parseInt(score / ElectionTypeScore.THS) === 1;
};

exports.isWT = function (score) {
    return parseInt(score / ElectionTypeScore.WT) === 1;
};

exports._changeGuiCard = function (type, ids) {
    var gui = getGroupByPointGui(ids);
    var result = [];
    if (gui.length == 0) {
        return;
    } else if (gui.length == ids.length) {
        gui.forEach(function (id) {
            result.push(39);
        });
        return result;
    }
    var maxPoint = 0;
    var maxValue = 1;
    var scoresHelper = _getCardPointsSameCount(ids.slice());
    for (var i in scoresHelper) {
        if (parseInt(i) > 14) continue;
        var p = parseInt(scoresHelper[i]);
        if (p > maxValue) maxValue = p;
    }
    for (var i in scoresHelper) {
        var p = parseInt(i) == 1 ? 14 : parseInt(i);
        if (maxValue == parseInt(scoresHelper[i]) && p < 52 && maxPoint < p) {
            maxPoint = p;
        }
    }
    var maxColor = ids.filter(function (id) {
        return idToPoint(id) == (maxPoint == 14 ? 1 : maxPoint);
    }).map(function (id) {
        return idToColor(id);
    }).sort(function (a, b) {
        return b - a;
    })[0];
    if (type == "sz" || type == "ths") {
        var points = idsToPoints(ids);
        if (isHoldWithA(points)) points = turnAllATo14(points.slice());
        var cPoints = _changeCardScors(points);
        points.forEach(function (point) {
            var index = cPoints.indexOf(point);
            if (index != -1) {
                cPoints.splice(index, 1);
            }
        });
        result = pointsToIds(cPoints, maxColor);
    } else {
        var result1 = pointsToIds([maxPoint], maxColor)[0];
        gui.forEach(function (id) {
            result.push(result1);
        });
    }
    return result;
};
//var ids = [52, 39, 51, 50, 49]
//var ids = [52, 45, 45, 45, 42];
//var type = "ths";
//console.log(exports._changeGuiCard(type,ids));
exports.getClassicType = function (aScore, bScore, type) {
    var extra = 0;
    if (type == "tou") {
        if (isST(aScore) || isST(bScore)) {
            extra = 2
        }
    }
    if (type == "zhong") {
        if (isWT(aScore) || isWT(bScore)) {
            extra = 13
        } else if (isTHS(aScore) || isTHS(bScore)) {
            extra = 9
        } else if (isTZ(aScore) || isTZ(bScore)) {
            extra = 7
        } else if (isHL(aScore) || isHL(bScore)) {
            extra = 1
        }
    }
    if (type == "wei") {
        if (isWT(aScore) || isWT(bScore)) {
            extra = 6
        } else if (isTHS(aScore) || isTHS(bScore)) {
            extra = 4
        } else if (isTZ(aScore) || isTZ(bScore)) {
            extra = 3
        }
    }
    return extra;
}

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

function getTypeNameAndScore(ids) {
    var score = exports.getElectionScore(ids.slice());
    for (var i in ElectionTypeScore) {
        if (ElectionTypeScore[i] / ElectionTypeScore.WL === parseInt(score / ElectionTypeScore.WL)) {
            return {
                score: score,
                name: i.toLowerCase(),
                ids: ids
            }
        }
    }
}
//获得点数
function idToPoint(id) {
    if (id == 53 || id == 52) return id;
    return id % 13 + 1;
}

function idsCount(ids) {
    ids.sort(function (a, b) {
        return b - a;
    });
    var total = 0;
    ids.forEach(function (id) {
        total += id;
    });
}
//获得点数数组
function idsToPoints(ids) {
    var points = [];
    ids.forEach(function (id) {
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

//获得点数数组
function idsToColors(ids) {
    var points = [];
    ids.forEach(function (id) {
        points.push(idToColor(id));
    });
    return points;
}
//点数与花色转为id
function pointsToIds(points, color) {
    var ids = [];
    points.forEach(function (point) {
        if (point === 14) {
            point = 1;
        }
        ids.push(13 * color + point - 1);
    });
    return ids;
}
//获取点数统计
function getPointCountMap(ids) {
    /*
     * {
     *   "point":个数
     * }
     */
    var map = {};
    ids.forEach(function (id) {
        var point = idToPoint(id);
        var count = map[point];
        count = isValid(count) ? count + 1 : 1;
        map[point] = count;
    });
    return map;
}
//获取花色统计
function getColorCountMap(ids) {
    /*
     *{
     *   "color":个数
     * }
     */
    var map = {};
    ids.forEach(function (id) {
        var color = idToColor(id);
        var count = map[color];
        count = isValid(count) ? count + 1 : 1;
        map[color] = count;
    });
    return map;
}

function getGroupByPoint(ids) {
    /*
     根据点数进行分组
     {
     "point":[id1,id2,id3]
     "point":[id1,id2]
     }
     */
    var group = {};
    ids.forEach(function (id) {
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
}

function getGroupByResult(groupByPoker, length) {
    /*
     根据length进行分组
     {
     "point":[id1,id2]
     "point":[id1,id2]
     }
     */
    if (length <= 0) return [];

    var result = [];

    for (var prop in groupByPoker) {

        var pointIndexs = groupByPoker[prop];

        let idx = 0
        while (pointIndexs.length >= length + idx) {
            var splices = pointIndexs.slice(idx, length + idx);
            idx++
            if (splices.length >= length) result.push(splices);
        }

        // while (pointIndexs.length >= length) { //有多的分割多个数组

        //     var splices = pointIndexs.splice(0, length);

        //     if (splices.length >= length) result.push(splices);

        // }

        //if (pointIndexs.length >= length) result.push(pointIndexs);

    }
    return result.filter(function (a) {
        if (a) return true;
    });
}

function getGroupByColor(ids) {
    /*
     根据颜色进行分组
     {
     "color":[id1,id2,id3]
     "color":[id1,id2]
     }
     */
    var group = {};
    ids.forEach(function (id) {
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
}

function getGroupByPointGui(ids) {
    /*
     获取鬼牌[]
     */
    var group = [];
    ids.forEach(function (id) {
        if (id == 53 || id == 52) {
            group.push(id);
        }
    });
    return group;
}

function getAllHoldType(ids) {
    if (!ids || !ids.length) {
        return;
    }
    var groupByPoint = getGroupByPoint(ids);
    var groupByColor = getGroupByColor(ids);
    var points = idsToPoints(ids);
    var pointsGui = getGroupByPointGui(ids);
    return {
        wutong: isHoldWT(groupByPoint, pointsGui),
        tonghuashun: isHoldTHS(groupByColor, pointsGui),
        tiezhi: isHoldTZ(groupByPoint, pointsGui),
        hulu: isHoldHL(groupByPoint, pointsGui),
        tonghua: isHoldTH(groupByColor, pointsGui),
        shunzi: isHoldSZ(points, pointsGui),
        santiao: isHoldST(groupByPoint, pointsGui),
        liangdui: isHoldLD(groupByPoint, pointsGui),
        duizi: isHoldDZ(groupByPoint, pointsGui)
    };
}

//var ids = [7,13*3,13*3,10+13*3,10+13,5+13*2,5+13*3,7+13*3,2+13*3,2+13,2+13*3,6,6+13];
//console.log(getSpecialType(ids));
function getSpecialType(ids, typeArr) {
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
function sortIDByColor(id1, id2, isDesc) {
    if (isDesc) {
        //降序
        return idToColor(id2) - idToColor(id1);
    } else {
        //升序
        return idToColor(id1) - idToColor(id2);
    }
}

function sortIDByPointAndColor(id1, id2, isDesc) {
    if (isDesc) {
        var rs1 = idToPoint(id2) - idToPoint(id1);
        rs1 = rs1 === 0 ? idToColor(id2) - idToColor(id1) : rs1;
        return rs1;
    } else {
        var rs2 = idToPoint(id1) - idToPoint(id2);
        rs2 = rs2 === 0 ? idToColor(id1) - idToColor(id2) : rs2;
        return rs2;
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

//半大
function isHoldBANDA() {}

//半小
function isHoldBANXIAO() {}


/*--------------------------------------普通牌型-------------------------------------*/
//五同
function isHoldWT(groupByPoint, pointsGui) {
    if (pointsGui.length >= 5) {
        return true
    }
    for (var i in groupByPoint) {
        if (groupByPoint[i].length >= 5 - pointsGui.length) {
            return true;
        }
    }
    return false;
}
//同花顺
function isHoldTHS(groupByColor, pointsGui) {
    pointsGui = pointsGui.slice(0, 3)
    for (var i in groupByColor) {
        if (groupByColor[i].length > 1 && groupByColor[i].length >= 5 - pointsGui.length) {
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
function isHoldTZ(groupByPoint, pointsGui) {
    var fourTol = false;
    var oneTol = false;
    for (var i in groupByPoint) {
        if (groupByPoint[i].length >= 4 - pointsGui.length) {
            fourTol++;
        } else {
            oneTol++;
        }
    }
    return (fourTol >= 2) || (fourTol >= 1 && oneTol >= 1);
}
//葫芦
function isHoldHL(groupByPoint, pointsGui) {
    var threeTol = 0;
    var twoTol = 0;
    for (var i in groupByPoint) {
        if (groupByPoint[i].length >= 3) {
            threeTol++;
        } else if (groupByPoint[i].length >= 2) {
            twoTol++;
        }
    }
    return (threeTol >= 2) || (threeTol >= 1 && twoTol >= 1) || (twoTol >= 2 && pointsGui.length >= 1);
}
//同花
function isHoldTH(groupByColor, pointsGui) {
    for (var i in groupByColor) {
        if (groupByColor[i].length >= 5 - pointsGui.length) {
            return true;
        }
    }
    return false;
}
//顺子
function isHoldSZ(points, pointsGui) { //11s
    points = dereplication(points);
    if (points.length < 2 || points.length + pointsGui.length < 5) {
        return false
    }
    pointsGui = pointsGui.slice(0, 3)
    points.sort(sortPointByPoint);
    for (let k = 0; k <= points.length - 5 + pointsGui.length; k++) {
        if (isSZGui(points.slice(k, k + 5 - pointsGui.length), pointsGui)) {
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
    return false;
}
//三条
function isHoldST(groupByPoint, pointsGui) {
    //console.log(groupByPoint)
    //console.log(pointsGui)
    var length = false;
    for (var i in groupByPoint) {
        length = true;
        if (groupByPoint[i].length >= 3 - pointsGui.length) return true;
    }
    if (pointsGui.length == 3 && !length) return true;
    return false;
}
//两对
function isHoldLD(groupByPoint, pointsGui) {
    var doubleTol = 0;
    for (var i in groupByPoint) {
        if (groupByPoint[i].length >= 2) {
            doubleTol++;
        }
    }
    return doubleTol >= 2;
}
//对子
function isHoldDZ(groupByPoint, pointsGui) {
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
    if (pointsA && pointsA.length > 1) {
        var points = pointsA.filter(function (point) {
            return point <= 51;
        });
    } else {
        return false;
    }
    if (points.length + pointsGui.length < 5) return false;

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

function getNotRepeat(arr) {
    var result = [];
    var newArr = [];
    for (var i = 0; i < arr.length; i++) {
        if (result.indexOf(arr[i]) === -1) {
            result.push(arr[i]);
        } else {
            newArr.push(arr[i]);
        }
    }
    return {
        result: result,
        theRest: newArr
    };
}

function isValid(obj) {
    return obj !== null && obj !== undefined;
}

function getAnWT(groupByPoint, lastElection, pointsGui, length, isRetuenAll) {
    var result = [];
    var lastIsST = lastElection === null ? false : isHoldST(getGroupByPoint(lastElection), pointsGui);

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
    // console.log("分组组合完成==", result)
    var resultArrays = reptAnSort(result); /*去重排序*/
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

function getAnTHS(groupByColor, lastElection, pointsGui, isRetuenAll) {
    // var lastIsTHS = (lastElection === null || lastElection.length !== 5) ? false : isHoldTHS(getGroupByColor(lastElection), pointsGui);
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
        return;
    }

    allTHS = reptAnSort(allTHS); /*去重排序*/

    if (isRetuenAll) return allTHS;
    if (!lastElection) {
        return allTHS[0];
    }
    var lastIndex = -1;
    // var lastScore = getElectionScore(lastElection);
    for (var i = 0; i < allTHS.length; i++) {
        if (allTHS[i].toString() === lastElection.toString()) {
            lastIndex = i;
            break;
        }
    }
    return allTHS[(lastIndex + 1) % allTHS.length];
}

function getAnHL(groupByPoint, lastElection, pointsGui, isRetuenAll) {
    var lastIsHL = (lastElection === null || lastElection.length !== 5) ? false : isHoldHL(getGroupByPoint(lastElection), pointsGui);

    var sanTiao = getAnWT(groupByPoint, lastElection, [], 3, true); //三条没有带单牌
    var duiZi = getAnWT(groupByPoint, lastElection, [], 2, true); //对子没有带单牌

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
                allHL.push(a.concat(b).concat(pointsGui.slice(0, 1)));
            }
        }
    } else if (sanTiao.length >= 2 && pointsGui.length >= 1) {
        for (var i = 0; i < duiZi.length; i++) {
            for (var j = 1; j < duiZi.length; j++) {
                if (j == i) break;
                var a = duiZi[i].slice(0, 2);
                var b = duiZi[j].slice(0, 2);
                allHL.push(a.concat(b).concat(pointsGui.slice(0, 1)));
            }
        }
    }
    if (allHL.length < 1) {
        return;
    }
    allHL = reptAnSort(allHL); /*去重排序*/

    if (isRetuenAll) return allHL;
    if (!lastIsHL) {
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

function getAnSZ(ids, lastElection, pointsGui, isRetuenAll) {
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

    var allSZNoRepeat = reptAnSort(allSZ); /*去重排序*/

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

function getAnLD(groupByPoint, lastElection, pointsGui, isRetuenAll) {
    var lastIsLD = lastElection === null ? false : isHoldLD(getGroupByPoint(lastElection));
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
    //var allOne = [];
    //var lengthOf5 = [];
    //for(var i in groupByPoint) {
    //    if(groupByPoint[i].length === 1) {
    //        allOne.push(groupByPoint[i][0]);
    //    }
    //}
    //allOne.sort(function (a,b) {
    //    var pointA = idToPoint(a);
    //    var pointB = idToPoint(b);
    //    pointA = pointA===1?14:pointA;
    //    pointB = pointB===1?14:pointB;
    //    return pointA-pointB;
    //});
    //if(allOne.length > 0) {
    //    for(var i=0 ; i<allLD.length ; i++) {
    //        allLD[i].push(allOne[0]);
    //        lengthOf5.push(allLD[i]);
    //    }
    //}
    //if(lengthOf5.length > 0) {
    //    allLD = lengthOf5;
    //}
    allLD = reptAnSort(allLD); /*去重排序*/

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

/*去重排序*/
function reptAnSort(result, length) {
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
    results.sort(function (group1, group2) {
        return getElectionScore(group2) - getElectionScore(group1);
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
            var name1 = getTypeNameAndScore(result1);
            if (countFun(nameA, name1.name) < length) {
                nameA.push(name1.name);
                resultA.push(result1);
            }
        }
        return resultA;
    }
    return results;
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
//根据名字获得一组牌
function getElectionByName(ids, name, lastElection) {
    if (!ids || ids.length === 0) {
        return [];
    }
    var groupByPoint = getGroupByPoint(ids);
    var groupByColor = getGroupByColor(ids);
    // console.log("花色==", groupByColor)
    var points = idsToPoints(ids);
    var pointsGui = getGroupByPointGui(ids);
    var groupByPointSZ = ids.slice();
    delIds(pointsGui, groupByPointSZ); //去重
    if (!lastElection || lastElection.length === 0) {
        lastElection = null;
    }
    // console.log(name, groupByColor, lastElection)
    if (name === "wutong") {
        return getAnWT(groupByPoint, lastElection, pointsGui, 5);
    } else if (name === "tonghuashun") {
        return getAnTHS(groupByColor, lastElection, pointsGui);
    } else if (name === "sitiao") {
        return getAnWT(groupByPoint, lastElection, pointsGui, 4);
    } else if (name === "hulu") {
        return getAnHL(groupByPoint, lastElection, pointsGui);
    } else if (name === "tonghua") {
        return getAnWT(groupByColor, lastElection, pointsGui, 5);
    } else if (name === "shunzi") {
        return getAnSZ(groupByPointSZ, lastElection, pointsGui);
    } else if (name === "santiao") {
        return getAnWT(groupByPoint, lastElection, pointsGui, 3);
    } else if (name === "liangdui") {
        return getAnLD(groupByPoint, lastElection, pointsGui);
    } else if (name === "duizi") {
        return getAnWT(groupByPoint, lastElection, pointsGui, 2);
    }
}
//获得组合的类型的得分
function getElectionTypeScore(ids, groupByPoint, groupByColor, points, pointsGui) {
    if (isHoldWT(groupByPoint, pointsGui)) {
        return ElectionTypeScore.WT;
    } else if (isHoldTHS(groupByColor, pointsGui)) {
        return ElectionTypeScore.THS;
    } else if (isHoldTZ(groupByPoint, pointsGui)) {
        return ElectionTypeScore.TZ;
    } else if (isHoldHL(groupByPoint, pointsGui)) {
        return ElectionTypeScore.HL;
    } else if (isHoldTH(groupByColor, pointsGui)) {
        return ElectionTypeScore.TH;
    } else if (isHoldSZ(points, pointsGui)) {
        return ElectionTypeScore.SZ;
    } else if (isHoldST(groupByPoint, pointsGui)) {
        return ElectionTypeScore.ST;
    } else if (isHoldLD(groupByPoint, pointsGui)) {
        return ElectionTypeScore.LD;
    } else if (isHoldDZ(groupByPoint, pointsGui)) {
        return ElectionTypeScore.DZ;
    }
    return ElectionTypeScore.WL;
}
//获得组合的得分，即类型分+牌大小
function getElectionScore(ids) {
    if (!ids || !ids.length || ids.length <= 0) return -1;
    ids = ids.slice();
    ids = _typeCardsSortByScores(ids, true);

    var groupByPoint = getGroupByPoint(ids);
    var groupByColor = getGroupByColor(ids);
    var points = idsToPoints(ids);
    var pointsGui = getGroupByPointGui(ids);
    var typeScore = getElectionTypeScore(ids, groupByPoint, groupByColor, points, pointsGui);
    var totalValue = "";
    var totalColor = "";
    ids.forEach(function (id) {
        totalColor += "0";
    });
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
            var a1 = scoresHelper[a];
            var b1 = scoresHelper[b];
            if (a1 != b1) return b1 - a1;
            return (parseInt(b) == 1 ? 14 : parseInt(b)) - (parseInt(a) == 1 ? 14 : parseInt(a));
        }); //这里写所需要的规则
        var totalCont = "";
        totalValue = "";
        for (var i = 0; i < objKeys.length; i++) {
            var v = parseInt(scoresHelper[objKeys[i]]);
            var k = parseInt(objKeys[i]) == 1 ? 14 : parseInt(objKeys[i]);
            if (b52) {
                v += b52;
                b52 = false;
            }
            if (v == 3) {
                totalCont = "3000";
            } else if (v == 2) {
                totalCont += "20";
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
function _changeCardScors(p) {
    var is14 = true; //是A K Q J 10 ;
    var is1 = true; //是1 2 3 4 5
    let points = p.slice();

    points.forEach(card => {
        if (points.length == 5) {
            if (card < 10 && card != 1) is14 = false;
            if ((card > 5 && card != 14) && card < 52) is1 = false;
        } else if (points.length == 3) {
            if (card < 12 && card != 1) is14 = false;
            if ((card > 3 && card != 14) && card < 52) is1 = false;
        }
    });

    if (is14) {
        if (points.length == 3) {
            points = [14, 13, 12]
        } else
            points = [14, 13, 12, 11, 10]
    } else if (is1) {
        if (points.length == 3) {
            points = [14, 2, 3]
        } else
            points = [14, 2, 3, 4, 5]
    } else {
        points.sort(function (a1, a2) {
            return a1 - a2;
        });

        var scoresAyy = [];
        for (var i = 0; i < points.length; i++) {
            var s = parseInt(points[0]) + i; //最小的牌的分数
            scoresAyy.push(s); //一副牌的分数
        }

        points = scoresAyy
    }

    points.sort(function (a1, a2) {
        return a2 - a1;
    });

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
/*选出分数最大的一组*/
function autoSelectCards(ids, isReturnAll, index, guiMin) {
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
        getAnWT(groupByPoint, null, pointsGui, 5, true),
        getAnTHS(groupByColor, null, pointsGui, true),
        getAnWT(groupByPoint, null, pointsGui, 4, true),
        getAnHL(groupByPoint, null, pointsGui, true),
        getAnWT(groupByColor, null, pointsGui, 5, true),
        getAnSZ(groupByPointSZ, null, pointsGui, true),
        getAnWT(groupByPoint, null, pointsGui, 3, true),
        getAnLD(groupByPoint, null, pointsGui, true),
        getAnWT(groupByPoint, null, pointsGui, 2, true),
    ];

    var indexArrays = [];
    for (var i = index; i < findFuncs.length; ++i) {
        var func = findFuncs[i];
        if (func && func.length > 0) {
            indexArrays = indexArrays.concat(func);
            indexArrays = reptAnSort(indexArrays); /*去重排序*/
            index = i + 1;
            if (!isReturnAll) break;
        }
    }

    var idsArrAy = [];
    if (indexArrays && indexArrays.length > 0) {

        if (isReturnAll) return indexArrays; //返回全部

        // 找出同类型的牌里的分数最大的牌
        var maxScore = 0;
        indexArrays.forEach(function (idsArr) {
            var score = getElectionScore(idsArr);
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

function getGroupAllPokerType(ids) {
    //ids = [38,11,36,36,23,10,21,46,19,31,40,14,1];
    if (!ids || !ids.length || ids.length != 13) return;
    var length = 20;
    /*找出头道*/
    var tou = {};
    var zhong = {};
    var wei = autoSelectCards(ids.slice(), true).sort(function (arr1, arr2) {
        return getElectionScore(arr2) - getElectionScore(arr1);
    });
    wei = reptAnSort(wei, 3).slice(0, length); /*去重排序*/
    var allTypeCards = [];
    /*找出中尾两道*/
    for (var i = 0; i < wei.length; i++) {
        var cardsWei = wei[i];
        var newIds = _typeCardsSortByScores(ids.slice());
        /*从剩下的牌找出中道*/
        delIds(cardsWei, newIds); //去重
        var cardsZhongArrAy = autoSelectCards(newIds.slice(), true).sort(function (arr1, arr2) {
            return getElectionScore(arr2) - getElectionScore(arr1);
        });

        var cardsZhong = newIds.slice(0, 5) || [];
        var max = 0;
        for (var j = 0; j < cardsZhongArrAy.length; ++j) {
            var scoreZhong = cardsZhongArrAy[j];
            /*找出最大的牌并且没有倒水的*/
            var z = getElectionScore(scoreZhong.slice());
            if (max < z) {
                max = z;
                cardsZhong = scoreZhong;
                //break;
            }
        }

        /*从剩下的牌找出头道*/
        delIds(cardsZhong, newIds);
        var cardsTouArrAy = autoSelectCards(newIds.slice(), true).sort(function (arr1, arr2) {
            return getElectionScore(arr2) - getElectionScore(arr1);
        });
        //console.log(newIds)
        var cardsTou = newIds.slice(0, 3) || [];
        for (var j = 0; j < cardsTouArrAy.length; ++j) {
            var scoreTou = cardsTouArrAy[j];
            /*找出最大的牌并且没有倒水的*/
            if (getElectionScore(cardsZhong) > getElectionScore(scoreTou.slice())) {
                cardsTou = scoreTou;
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
    var newW = autoSelectCards(newId1s, false, false, true) || [];
    delIds(newW, newId1s); //去重
    var newZ = autoSelectCards(newId1s, false, false, true) || [];
    delIds(newZ, newId1s); //去重
    var newT = autoSelectCards(newId1s, false, false, true) || [];
    allTypeCards.push([newW, newZ, newT]);

    //if(allTypeCards.length >= 0){
    var arr = [];
    var newIds = _typeCardsSortByScores(ids.slice());
    arr.push(newIds.slice(0, 5));
    arr.push(newIds.slice(5, 10));
    arr.push(newIds.slice(10, 13));
    allTypeCards.push(arr);
    //}
    /*//补全*/
    for (var i = 0; i < allTypeCards.length; i++) {
        var newIds = ids.slice().sort(function (id1, id2) {
            var a1 = idToPoint(id1) == 1 ? 14 : idToPoint(id1);
            var a2 = idToPoint(id2) == 1 ? 14 : idToPoint(id2);
            return a1 - a2;
        });
        var typeCards = allTypeCards[i];
        delIds(typeCards[0], newIds); //去重
        delIds(typeCards[1], newIds);
        delIds(typeCards[2], newIds);
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
        if (getElectionScore(typeCards[0]) < getElectionScore(typeCards[1])) {
            var tmp = typeCards[0];
            typeCards[0] = typeCards[1];
            typeCards[1] = tmp;
        }
        /*头中倒水的话删了*/
        if (getElectionScore(typeCards[1]) < getElectionScore(typeCards[2])) {
            typeCards[0] = [];
            typeCards[1] = [];
            typeCards[2] = [];
        }
        typeCards[0] = typeCards[0] || [];
        typeCards[1] = typeCards[1] || [];
        typeCards[2] = typeCards[2] || [];

        //if(typeCards[0].length !== 5 || typeCards[1].length !== 5 || typeCards[2].length !== 3){
        //    allTypeCards.splice(i,1);
        //}
    }

    var newAllTypeCards = [];
    var namesArrAy = [];
    for (var i = 0; i < allTypeCards.length; i++) {
        var typeCards = allTypeCards[i];
        if (typeCards[0].length == 5 && typeCards[1].length == 5 && typeCards[2].length == 3) {
            var newTypeCards = [];
            newTypeCards[0] = getTypeNameAndScore(_typeCardsSortByScores(typeCards[0].slice()));
            newTypeCards[1] = getTypeNameAndScore(_typeCardsSortByScores(typeCards[1].slice()));
            newTypeCards[2] = getTypeNameAndScore(_typeCardsSortByScores(typeCards[2].slice()));

            /*去重复类型的*/
            var names = newTypeCards[0].name + newTypeCards[1].name + newTypeCards[2].name;
            if (namesArrAy.indexOf(names) == -1) {
                namesArrAy.push(names);
                newAllTypeCards.push(newTypeCards);
            }
        }
    }
    /*排序*/
    newAllTypeCards.sort(function (a1, a2) {
        var b0 = parseInt((a2[0].score) / 1000000000000000) + "";
        var b1 = parseInt((a2[1].score) / 1000000000000000) + "";
        var b2 = parseInt((a2[2].score) / 1000000000000000) + "";

        var s0 = parseInt((a1[0].score) / 1000000000000000) + "";
        var s1 = parseInt((a1[1].score) / 1000000000000000) + "";
        var s2 = parseInt((a1[2].score) / 1000000000000000) + "";

        var s = parseInt(s0 + s1 + s2);
        var b = parseInt(b0 + b1 + b2);
        return b - s;
    });
    return newAllTypeCards.slice(0, 7);
}

//特殊牌排序
exports.dealSpecialCard = function (ids, type) {
    // console.log("类型:",type);
    // console.log("牌",ids);
    if (!ids || !ids.length || ids.length !== 13) return;
    var SpecialTypes = {
        qinglong: dealLong(ids), // ok
        yitiaolong: dealLong(ids), // ok
        shierhuangzu: dealSRHZ(ids), // ok
        santonghuashun: dealSTHS(ids, true), // ok
        sanfentianxia: dealSFTX(ids), // ok
        quanda: dealQDX(ids), // ok
        quanxiao: dealQDX(ids), // ok
        couyise: dealCYS(ids), // ok
        sitaosantiao: dealSTST(ids), // ok
        wuduisantiao: dealWDST(ids), // ok
        liuduiban: dealLDB(ids), // ok
        sanshunzi: dealSsz(ids), // ok
        santonghua: dealSTHS(ids, false), // ok
        banda: dealQDX(ids, false), // ok.
        banxiao: dealQDX(ids, false),
        quanheyidianhong: dealCYS(ids),
        quanhongyidianhei: dealCYS(ids),
    };
    // console.log(SpecialTypes[type]);
    return SpecialTypes[type];
}

function defalutIdsSort(a, b) {
    return (b > 13 ? b % 13 : b) - (a > 13 ? a % 13 : a)
}

// 整理龙的牌型
function dealLong(ids) {


    ids.sort((a, b) => {
        return idToPoint(a) - idToPoint(b)
    });
    // ids.sort(function (a, b) {
    //     return (a > 13 ? a % 13 : a) - (b > 13 ? b % 13 : b);
    // });
    var touArr = ids.slice(0, 3);
    var zhongArr = ids.slice(3, 3 + 5);
    var weiArr = ids.slice(8);
    var tou = getTypeNameAndScore(touArr);
    var zhong = getTypeNameAndScore(zhongArr);
    var wei = getTypeNameAndScore(weiArr);
    return [wei, zhong, tou];
}

function checkIsSZ(points) {
    for (var i = 0; i < points.length - 1; i++) {
        var first = points[i] > 13 ? points[i] % 13 : points[i];
        var last = points[i + 1] > 13 ? points[i + 1] % 13 : points[i + 1];
        if (Math.abs(first - last) !== 1) {
            return false;
        }
    }
    return true;
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

function checkIsSSZ(ids, container) {
    var points = ids.slice();
    points.sort(defalutIdsSort);
    var notRepetPointOf5 = getNotRepeatOfCards(points, 5);
    var notRepetPointOf3 = false;
    var result = false;
    if (notRepetPointOf5) {
        if (checkIsSZ(notRepetPointOf5.result)) {
            result = checkIsSSZ(notRepetPointOf5.theRest, container);
            container.push(notRepetPointOf5.result);
        } else {
            notRepetPointOf3 = getNotRepeatOfCards(points, 3);
            if (checkIsSZ(notRepetPointOf3.result)) {
                container.push(notRepetPointOf3.result);
                result = checkIsSSZ(notRepetPointOf3.theRest, container);
            }
        }
    }
    if (result === false) {
        notRepetPointOf3 = getNotRepeatOfCards(points, 3);
        if (notRepetPointOf3 && checkIsSZ(notRepetPointOf3.result, container)) {
            container.push(notRepetPointOf3.result);
            result = true;
        } else {
            container = [];
        }
    }
    return result;

}

// 整理三顺子的牌型
function dealSsz(ids) {
    // var points = ids.slice();
    // var points = dereplication(ids.slice());
    var points = ids.slice();
    points.sort(defalutIdsSort);

    var notRepetPointOf5 = getNotRepeatOfCards(points, 5);
    var notRepetPointOf3 = false;
    var result = false;
    var container = [];
    if (notRepetPointOf5) {
        if (checkIsSZ(notRepetPointOf5.result)) {
            container.push(notRepetPointOf5.result);
            result = checkIsSSZ(notRepetPointOf5.theRest, container);
        } else {
            notRepetPointOf3 = getNotRepeatOfCards(points, 3);
            if (checkIsSZ(notRepetPointOf3.result)) {
                container.push(notRepetPointOf3.result);
                result = checkIsSSZ(notRepetPointOf3.theRest, container);
            }
        }
    }
    if ( /*!container.length*/ result === false) {
        notRepetPointOf3 = getNotRepeatOfCards(points, 3);
        if (notRepetPointOf3 && checkIsSZ(notRepetPointOf3.result, container)) {
            container.push(notRepetPointOf3.result);
            result = true;
        } else {
            container = [];
        }
    }

    if (container.length === 3) {
        var specialCards = [];
        for (var i = 0; i < container.length; i++) {
            specialCards.push(getTypeNameAndScore(container[i]));
        }
        specialCards.sort(function (a, b) {
            return b.score - a.score;
        });
        return specialCards;
    }
    return null
}

// 整理 三同花/三同花顺 的牌型
function dealSTHS(ids, STHS) {
    var groupByColor = getGroupByColor(ids);
    var Arr = [];
    for (var index in groupByColor) {
        if (groupByColor[index].length === 5 || groupByColor[index].length === 3) {
            // 如果是5张牌的这不用管
            var result = getTypeNameAndScore(groupByColor[index]);
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
                            Arr.push(getTypeNameAndScore(delCards));
                            Arr.push(getTypeNameAndScore(shunZiArr));
                            break;
                        }
                    }
                }
            } else {
                cards.sort(defalutIdsSort);
                var one = cards.slice(0, 5);
                var other = cards.slice();
                delIds(one, other);
                Arr.push(getTypeNameAndScore(one));
                Arr.push(getTypeNameAndScore(other));
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
function dealQDX(ids) {
    var cards = ids.slice();
    cards.sort(defalutIdsSort);
    var touArr = ids.slice(0, 3);
    var zhongArr = ids.slice(3, 3 + 5);
    var weiArr = ids.slice(8);
    var tou = getTypeNameAndScore(touArr);
    var zhong = getTypeNameAndScore(zhongArr);
    var wei = getTypeNameAndScore(weiArr);
    return [wei, zhong, tou];

}

// 整理 六对半 牌型
function dealLDB(ids) {
    var cards = ids.slice();
    cards.sort(defalutIdsSort);
    var touArr = ids.slice(0, 3);
    var zhongArr = ids.slice(3, 3 + 5);
    var weiArr = ids.slice(8);
    var tou = getTypeNameAndScore(touArr);
    var zhong = getTypeNameAndScore(zhongArr);
    var wei = getTypeNameAndScore(weiArr);
    return [wei, zhong, tou];
}

// 整理 十二皇族 牌型
function dealSRHZ(ids) {
    var cards = ids.slice();
    cards.sort(defalutIdsSort);
    var touArr = ids.slice(0, 3);
    var zhongArr = ids.slice(3, 3 + 5);
    var weiArr = ids.slice(8);
    var tou = getTypeNameAndScore(touArr);
    var zhong = getTypeNameAndScore(zhongArr);
    var wei = getTypeNameAndScore(weiArr);
    return [wei, zhong, tou];
}

// 整理 五对三条 牌型
function dealWDST(ids) {
    var cards = ids.slice();
    cards.sort(defalutIdsSort);
    var touArr = ids.slice(0, 3);
    var zhongArr = ids.slice(3, 3 + 5);
    var weiArr = ids.slice(8);
    var tou = getTypeNameAndScore(touArr);
    var zhong = getTypeNameAndScore(zhongArr);
    var wei = getTypeNameAndScore(weiArr);
    return [wei, zhong, tou];

}

// 整理四套三条牌型
function dealSTST(ids) {
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
    var tou = getTypeNameAndScore(touArr);
    var zhong = getTypeNameAndScore(zhongArr);
    var wei = getTypeNameAndScore(weiArr);
    return [wei, zhong, tou];

}

// 整理 凑一色
function dealCYS(ids) {
    var cards = ids.slice();
    cards.sort(defalutIdsSort);
    var touArr = ids.slice(0, 3);
    var zhongArr = ids.slice(3, 3 + 5);
    var weiArr = ids.slice(8);
    var tou = getTypeNameAndScore(touArr);
    var zhong = getTypeNameAndScore(zhongArr);
    var wei = getTypeNameAndScore(weiArr);
    return [wei, zhong, tou];
}

// 整理三分天下
function dealSFTX(ids) {
    var cards = ids.slice();
    cards.sort(defalutIdsSort);
    var touArr = ids.slice(0, 3);
    var zhongArr = ids.slice(3, 3 + 5);
    var weiArr = ids.slice(8);
    var tou = getTypeNameAndScore(touArr);
    var zhong = getTypeNameAndScore(zhongArr);
    var wei = getTypeNameAndScore(weiArr);
    return [wei, zhong, tou];
}

//var ids = [4,5,2+3*13,
//    10,8,7+3*13,7+1*13,9+1*13,
//11+2*13,10+2*13,9+2*13,8+2*13,52];
//var cc = {};
//var ids = [1,2,3,
//    4,5,6,7,8,
//    9,10,11,12,13];
//isHoldSSZ(ids)
//console.log(cc)
//var ids = [8+1*13,1+1*13,5+1*13,2+1*13,52];
//var ids = [0+1*13,1+1*13,3,4+3*13,2+3*13,0+2*13,1+3*13,3+3*13,4,53 ,0,0,0];
//var idss = [0+0*13,1+0*13,3+0*13,7,53];
////console.log(getElectionScore(idss)>getElectionScore(ids));
//console.log(getElectionScore(ids));
//console.log(getElectionScore(idss));
//autoSelectCards(ids.slice(),true)
//autoSelectCards(arsdfsdfr,false,false,true));

//------------------------------疯狂场-----------------------------------------------------------
function _getGroupByPoint1(ids, length) {
    /*
     根据点数进行分组
     {
     "point":[id1,id2,id3]
     "point":[id1,id2]
     }
     */
    var group = {};
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
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
        if (arr && length && (arr.length == length)) {
            return arr;
        }
    }
    return [];
}

function _getGroupByColor1(ids, length) {
    /*
     根据颜色进行分组
     {
     "color":[id1,id2,id3]
     "color":[id1,id2]
     }
     */
    var group = {};
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var color = idToColor(id);
        var arr = group[color];
        if (id !== 53 && id !== 52) {
            if (isValid(arr)) {
                arr.push(id);
            } else {
                group[color] = [];
                group[color].push(id);
            }
        }
        if (arr && length && (arr.length == length)) {
            return arr;
        }
    }
    return []
}

function _deleteIds(ids, dIds) {
    for (var i = 0; i < dIds.length; i++) {
        var index = ids.indexOf(dIds[i]);
        if (index != -1) {
            ids.splice(index, 1);
        }
    }
}

function _shuffle(poker) {
    for (var i = 0; i < poker.length; i++) {
        var lastIndex = poker.length - 1 - i;
        var index = Math.floor(Math.random() * lastIndex);
        var t = poker[index];
        poker[index] = poker[lastIndex];
        poker[lastIndex] = t;
    }
}

// 随机
function _sj(ints) {
    ints = parseInt(ints);
    return Math.round(Math.random() * ints) == ints;
}

function _bp(room, ids) {
    for (var i = 0; i < room.players.length; i++) {
        var player = room.players[i];
        if (!player.afterJoin) {
            if (room.players[i].cardData.cards.length < 13 && ids.length > 0) {
                room.players[i].cardData.cards.push(ids.splice(0, 1)[0]);
                _bp(room, ids);
            }
        }
    }
    //console.log("-------2013")
}

function _fp(room, ids) {
    if (!ids || !ids.length) return;
    var result = [];
    var funcs = [
        _dz,
        _st,
        _st,
        _st,
        //_sz,
        _th,
        _hl,
        _tz,
        //_ths,
        _wt,

        _dz,
        _st,
        _sz,
        _th,
        _hl,
        _tz,
        _ths,
        _wt,

        _hl,
        _tz,
        _ths,
    ];
    var specialFuncs = [
        _ssz,
        _sth,
        _ldb,
    ];
    _shuffle(funcs);
    for (var i = 0; i < room.players.length; ++i) {
        //if(!players[i]||!players[i].cardData)return;
        if (room.players[i].afterJoin) continue;
        if (room.players[i].length > 0) continue;
        if (!_sj(23 + room.players.length * 3)) continue;
        _shuffle(specialFuncs);
        var specialIds = specialFuncs[0](ids);
        if (specialIds.length > 0) room.players[i].cardData.cards = specialIds;
    }
    for (var i = 0; i < funcs.length; ++i) {
        var re = [];
        var func = funcs[i];
        var sj = _sj(1);
        re = func(ids, false, sj);
        if (re.length > 1) {
            _shuffle(ids);
            result.push(re);
        }
    }
    for (var i = 0; i < room.players.length; ++i) {
        var player = room.players[i];
        if (player.afterJoin) {
            continue;
        }
        if (player.cardData.cards.length >= 13) {
            continue;
        }
        var a = result.splice(0, 1)[0];
        var b = result.splice(0, 1)[0];
        if (a && b) {
            var nIds = a.concat(b);
            nIds.forEach(function (g) {
                if (player.cardData.cards.length < 13) {
                    player.cardData.cards.push(g);
                } else {
                    ids.push(g);
                }
            });
        } else if (a) {
            player.cardData.cards = a;
        } else if (b) {
            player.cardData.cards = b;
        }
    }
    for (var i = 0; i < result.length; ++i) {
        result[i].forEach(function (a) {
            ids.push(a);
        });
    }
    _shuffle(ids);
    //console.log(ids);
    _bp(room, ids);
}

function xipai(ren, colors, guinum) {
    var fColor = []; //副花色
    var zColor = []; //主花色 只有一个主花色
    var poker = [];
    if (colors.length !== 4) {
        zColor = colors.splice(0, 1);
    }
    if (colors.length == 0) {
        for (var j = 0; j < ren; j++) {
            var color = zColor[0];
            for (var i = 0; i < 13; i++) {
                poker.push(color);
                color++;
            }
        }
    } else {
        if (colors.length === 4) ren++;

        for (var i = 0; i < ren - 1; i++) {
            var index = i % colors.length;
            fColor.push(colors[index]);
        }

        for (var j = 0; j < fColor.length; j++) {
            var color = fColor[j];
            //console.log(color); [0,1,2,3,0]
            for (var i = 0; i < 13; i++) {
                poker.push(color * 13 + i);
                //color++;
            }
        }
        //console.log(fColor);
        //console.log(zColor);

        for (var j = 0; j < zColor.length; j++) {
            var color = zColor[j];
            for (var i = 0; i < 13; i++) {
                poker.push(color * 13 + 1);
                color++;
            }

        }
    }
    var guiC = [52, 53];
    for (var i = 0; i < guinum; i++) {
        var index = i % guiC.length;
        poker.push(guiC[index]);
    }
    return poker;
}

function _dz(ids, isNotDel) {
    var length = 2;
    var result = _getGroupByPoint1(ids, length);
    if (!isNotDel) _deleteIds(ids, result);
    return result;
}

function _st(ids, isNotDel) {
    var length = 3;
    var result = _getGroupByPoint1(ids, length);
    if (!isNotDel) _deleteIds(ids, result);
    return result;
}

function _sz(ids, isNotDel, bysort) {
    var length = 5;
    var newIds = [];
    var points = [];
    for (var i = 0; i < ids.length; i++) {
        var point = idToPoint(ids[i]);
        if (points.indexOf(point) == -1) {
            newIds.push(ids[i]);
            points.push(point);
        }
    }
    if (bysort) {
        newIds.sort(function (a, b) {
            return idToPoint(a) - idToPoint(b);
        });
    } else {
        newIds.sort(function (a, b) {
            return idToPoint(b) - idToPoint(a);
        });
    }
    for (var start = 0;
        (start + length) <= newIds.length; ++start) { //顺子
        var result = newIds.slice(start, start + length);
        if (isSZ(idsToPoints(result))) {
            if (!isNotDel) _deleteIds(ids, result);
            //console.log(idsToPoints(result))
            //console.log(result)
            return result;
        }
    }
    return [];
}

function _th(ids, isNotDel) {
    var length = 5;
    var result = _getGroupByColor1(ids, length);
    if (!isNotDel) _deleteIds(ids, result);
    return result;
}

function _hl(ids, isNotDel) {
    var length = 5;
    var dz = _dz(ids, true);
    _shuffle(ids);
    var st = _st(ids, true);
    var result = dz.concat(st);
    if (result.length == length) {
        var dzP = idToPoint(dz[0]);
        var stP = idToPoint(st[0]);
        if (dzP != stP) {
            if (!isNotDel) _deleteIds(ids, result);
            return result;
        }
    }
    return [];
}

function _tz(ids, isNotDel) {
    var length = 4;
    var result = _getGroupByPoint1(ids, length);
    if (!isNotDel) _deleteIds(ids, result);
    return result;
}

function _ths(ids, isNotDel, bysort) {
    var length = 5;
    var groupByColor = getGroupByColor(ids);
    for (var i in groupByColor) {
        var newIds = groupByColor[i];
        var result = _sz(newIds, true, bysort);
        if (result.length == length) {
            if (!isNotDel) _deleteIds(ids, result);
            //console.log(idsToPoints(result))
            //console.log(result)
            return result;
        }
    }
    return [];
}

function _wt(ids, isNotDel) {
    var length = 5;
    var result = _getGroupByPoint1(ids, length);
    if (!isNotDel) _deleteIds(ids, result);
    return result;
}

function _ssz(ids, isNotDel) {
    var length = 5;
    var sz0, sz1, sz2, result = [];
    if (_sj(5)) {
        sz0 = _ths(ids, isNotDel);
        _shuffle(ids);
        sz1 = _ths(ids, isNotDel, true);
    } else {
        sz0 = _sz(ids, isNotDel);
        _shuffle(ids);
        sz1 = _sz(ids, isNotDel, true);
    }
    _shuffle(ids);
    sz2 = _sz(ids, isNotDel);
    if (sz0.length == length && sz1.length == length && sz2.length == length) {
        result = sz0.concat(sz1).concat(sz2.splice(0, 3));
        sz2.forEach(function (a) {
            ids.push(a);
        });
    } else {
        var nIds = sz0.concat(sz1).concat(sz2);
        nIds.forEach(function (a) {
            ids.push(a);
        });
        result = [];
    }
    return result;
}

function _sth(ids, isNotDel) {
    var length = 5;
    var th0, th1, th2, result = [];
    th0 = _th(ids, isNotDel);
    _shuffle(ids);
    if (_sj(3)) {
        th1 = _ths(ids, isNotDel);
    } else {
        th1 = _th(ids, isNotDel);
    }
    th2 = _th(ids, isNotDel);
    if (th0.length == length && th1.length == length && th2.length == length) {
        result = th0.concat(th1).concat(th2.splice(0, 3));
        th2.forEach(function (a) {
            ids.push(a);
        });
    } else {
        var nIds = th0.concat(th1).concat(th2);
        nIds.forEach(function (a) {
            ids.push(a);
        });
        result = [];
    }
    //console.log(result)
    return result;
}

function _ldb(ids, isNotDel) {
    var length = 2;
    var dz0, dz1, dz2, dz3, dz4, dz5, result = [];

    dz0 = _dz(ids, isNotDel);
    dz1 = _dz(ids, isNotDel);
    _shuffle(ids);
    dz2 = _dz(ids, isNotDel);
    _shuffle(ids);
    dz3 = _dz(ids, isNotDel);
    _shuffle(ids);
    dz4 = _dz(ids, isNotDel);
    _shuffle(ids);
    dz5 = _dz(ids, isNotDel);

    if (dz0.length == length && dz1.length == length && dz2.length == length && dz3.length == length && dz4.length == length && dz5.length == length) {
        result = dz0.concat(dz1).concat(dz2).concat(dz3).concat(dz4).concat(dz5);
    } else {
        var nIds = dz0.concat(dz1).concat(dz2).concat(dz3).concat(dz4).concat(dz5);
        nIds.forEach(function (a) {
            ids.push(a);
        });
        //console.log(nIds)
        //console.log(dz0,dz1,dz2,dz3,dz4,dz5)
        result = [];
    }
    return result;
}

//var ids = [ 8, 47, 11, 50, 16, 42, 1, 40, 32, 19, 49, 36, 7, 6, 5, 4, 3, 39, 26, 0 ];
//ids.sort(function(a,b){return a%13-b%13})
//for(var i=0;i<ids.length;i++){
//    console.log(ids[i]%13);
//}
//var cardArr = getGroupAllPokerType(ids);
//console.log(cardArr);