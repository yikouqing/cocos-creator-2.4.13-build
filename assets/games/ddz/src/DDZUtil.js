const BIG_JOKER = 79; //大王
const SMALL_JOKER = 78; //小王
const ApiDdz = require('./ApiDdz');
const DDZModel = require('./DDZModel');
const DDZGameLogic = require('./DDZGameLogic');
const Utils = require('../../../src/utils/Utils');
class GameUtil {

    getOptimizeTips(holdArr, mateArr, funs, outsArr, outsType) {
        let filterType = (cardType) => {
            if (cardType == ApiDdz.cardType.BOMB_CARD
                || cardType == ApiDdz.cardType.WANG_BOMB
                || cardType == ApiDdz.cardType.LAIZI_BOMB
                || cardType == ApiDdz.cardType.CHUN_LAIZI_BOMB) {
                return true
            };
            return false;
        }
        if (outsArr.length && !outsType) outsType = DDZGameLogic.getCardType(Utils.deepCopy(outsArr));
        if (!holdArr.length || !mateArr.length || (outsArr.length && filterType(outsType))) {
            funs(mateArr);
            return mateArr;
        }
        // console.log("提示开始=》holdArr", holdArr, "outsArr", outsArr, "outsType", outsType, "mateArr", mateArr);
        let initList = Utils.deepCopy(holdArr);
        let mateList = Utils.deepCopy(mateArr);
        let outsList = Utils.deepCopy(outsArr);
        let statPoint = (list) => {
            let statObj = {};
            list.forEach((cardID) => {
                let curPoint = DDZGameLogic.getCardLogicValue(cardID);
                if (!statObj[curPoint]) {
                    statObj[curPoint] = [];
                }
                statObj[curPoint].push(cardID);
            })
            return statObj;
        }
        /**点数统计 */
        let allPointObj = statPoint(initList);
        // console.log("点数统计", allPointObj)
        let getPointCardList = (cardID) => {
            if (!cardID) return [];
            let curPoint = DDZGameLogic.getCardLogicValue(cardID);
            return allPointObj[curPoint] || [];
        }
        /**牌型统计 */
        let allTypeObj = {};
        let addTypeObj = (obj) => {
            if (!allTypeObj[obj.type]) {
                allTypeObj[obj.type] = [];
            }
            allTypeObj[obj.type].push(obj);
        }
        /**最长牌型 */
        let maxLenObj = null;
        if (!outsList.length) {
            for (let i = 0; i < mateList.length; i++) {
                let curObj = mateList[i];
                let cardList = curObj.cardList || [];
                if (cardList.length === holdArr.length) {
                    mateList.splice(i, 1);
                    maxLenObj = curObj;
                    break;
                }
            }
        }
        /**返回结果 */
        let runResult = (maxLenObj) => {
            let resultList = [];
            for (const type in allTypeObj) {
                let typeList = allTypeObj[type] || [];
                typeList.forEach((obj) => {
                    resultList.push(obj);
                })
            }
            if (DDZModel.isTwoking(initList.slice())) {//双王防拆
                for (let i = resultList.length; i > 0; i--) {
                    let index = i - 1;
                    let obj = resultList[index];
                    let cardType = obj.type || 0;
                    let cardList = obj.cardList || [];
                    if (cardType != ApiDdz.cardType.WANG_BOMB) {
                        if (cardList.includes(78) || cardList.includes(79)) {
                            resultList.splice(index, 1);
                        }
                    }
                }
            }
            if (!resultList.length) resultList = mateList.slice();
            if (!!maxLenObj) resultList.unshift(maxLenObj);
            funs(resultList);
            return resultList;
        }

        let checkListEachObj = (matcList) => {
            let deleList = [];
            matcList = matcList || [];
            for (let index = 0; index < matcList.length; index++) {
                let curObj = matcList[index];
                let cardType = curObj.type || 0;
                if (!filterType(cardType)) {
                    let cardList = curObj.cardList || [];
                    if (cardType == ApiDdz.cardType.SINGLE
                        || cardType == ApiDdz.cardType.DOUBLE
                        || cardType == ApiDdz.cardType.THREE_LINE) {
                        for (let indeY = 0; indeY < cardList.length; indeY++) {
                            let pointList = getPointCardList(cardList[indeY]);
                            if (pointList.length == 4) {
                                matcList.splice(index, 1);
                                index -= 1;
                                break;
                            } else if (pointList.length > cardType) {
                                matcList.splice(index, 1);
                                deleList.push(curObj);
                                index -= 1;
                                break;
                            }
                        }
                    } else {
                        let statMore = 0, seatFour = 0;
                        let statObj = statPoint(cardList);
                        for (const curPoint in statObj) {
                            let pointList = allPointObj[curPoint] || [];
                            if (cardType == ApiDdz.cardType.THREE_LINE_TAKE_ONE) {
                                if (pointList.length == 4) {
                                    seatFour += 2;
                                } else if (pointList.length > 1) {
                                    statMore += 1;
                                }
                            } else if (cardType == ApiDdz.cardType.THREE_LINE_TAKE_DUI) {
                                if (pointList.length == 4) {
                                    seatFour += 2;
                                } else if (pointList.length > 2) {
                                    statMore += 1;
                                }
                            } else if (cardType == ApiDdz.cardType.FOUR_LINE_TAKE_X) {
                                if (pointList.length == 4) {
                                    seatFour += 1;
                                } else if (pointList.length != 4 && pointList.length > 1) {
                                    statMore += 1;
                                }
                            } else if (cardType == ApiDdz.cardType.FOUR_LINE_TAKE_DUI) {
                                if (pointList.length == 4) {
                                    seatFour += 1;
                                } else if (pointList.length != 4 && pointList.length > 2) {
                                    statMore += 1;
                                }
                            }
                        }
                        if (statMore > 1 || seatFour >= 2) {
                            matcList.splice(index, 1);
                            index -= 1;
                        }
                    }
                }
            }
            matcList.forEach(addTypeObj);
            deleList.forEach(addTypeObj);
        }
        checkListEachObj(Utils.deepCopy(mateList));
        return runResult(maxLenObj);
    }

    getChangeCardList(cardList, cardType) {
        if (DDZModel.isOnlyLaiZi(cardList)) return [];
        let allLaiNum = 0, newList = [], totlObj = {};
        let initList = cardList.slice();
        let saveList = initList.slice();
        let initLen = initList.length;
        for (let i = initLen; i > 0; i--) {
            let index = i - 1, cardID = saveList[index];
            let val = DDZGameLogic.getCardLogicValue(cardID);
            let obj = {
                val: cardID,
                lai: false,
                new: 0,
            };
            if (!totlObj[val]) {
                totlObj[val] = {
                    list: [],
                    lai: false,
                };
            }
            totlObj[val].list.push(cardID);
            if (DDZModel.isLaiZiCard(cardID)) {
                totlObj[val].lai = true;
                saveList.splice(index, 1);
                obj.lai = true;
                allLaiNum += 1;
            }
            newList.push(obj);
        }
        if (!allLaiNum) return [];
        let isPointKing = (list) => { return list.includes(78) || list.includes(79); };
        // console.log("更改前=》cardType", cardType, "laiList", DDZModel.getLaiZi(), "initList", initList)
        // console.log("更改中=》allLaiNum", allLaiNum, "totlObj", totlObj, "saveList", saveList, "newList", newList)
        /**剩余赖子数量 */
        let endLaiNum = allLaiNum, revisePointObj = (curPoint, maxLen) => {
            if (!totlObj[curPoint]) return false;
            let curPointObj = totlObj[curPoint];
            let list = curPointObj.list || [];
            let lackNum = maxLen - list.length;
            if (lackNum > 0) {
                let pushID = 0;//找一个点数相同但list里没有的
                for (let index = 0; index < saveList.length; index++) {
                    const spareID = saveList[index];
                    if (spareID) {
                        let sparePoint = DDZGameLogic.getCardLogicValue(spareID);
                        if (sparePoint == curPoint && list.indexOf(spareID) == -1) {
                            pushID = spareID;
                            break;
                        }
                    }
                }
                if (pushID == 0) pushID = list[0];
                for (let index = 0; index < lackNum; index++) {
                    for (let index = 0; index < newList.length; index++) {
                        let newObj = newList[index];
                        if (newObj.lai && !newObj.new && endLaiNum > 0) {
                            newObj.new = pushID;
                            list.push(pushID);
                            endLaiNum -= 1;
                            break;
                        }
                    }
                }
            } else {
                list.forEach(id => {
                    let havePoint = DDZGameLogic.getCardLogicValue(id);
                    for (let i = saveList.length; i > 0; i--) {
                        let index = i - 1;
                        const spareID = saveList[index];
                        if (spareID) {
                            let sparePoint = DDZGameLogic.getCardLogicValue(spareID);
                            if (sparePoint == havePoint && list.indexOf(spareID) == -1) {
                                saveList.splice(index, 1);
                                break;
                            }
                        }
                    }
                })
            }
        }

        let twiceCheckMend = (cardTypeLen, checkMaxLen) => {
            for (let index = 0; index < allLaiNum; index++) {
                let runPoint = 0, maxLen = 0;
                for (const point in totlObj) {
                    let curObj = totlObj[point];
                    let pointNum = parseInt(point);
                    if (curObj && !curObj.lai) {
                        let list = curObj.list || [];
                        if (isPointKing(list)) continue;
                        if (!checkMaxLen) {
                            if (pointNum > runPoint && list.length < cardTypeLen) {
                                runPoint = pointNum;
                            }
                        } else {
                            if (pointNum > runPoint && list.length < cardTypeLen && list.length >= maxLen) {
                                runPoint = pointNum;
                                maxLen = list.length;
                            }
                        }
                    }
                }
                revisePointObj(runPoint, cardTypeLen);
            }
        }

        let fillHeadAndTail = (minPoint, oneTypeLen, cardTypeLen) => {
            if (!minPoint || !oneTypeLen || !cardTypeLen) return;
            let typeLen = parseInt(initLen / oneTypeLen);
            let maxPoint = 14;
            for (let index = 0; index < typeLen; index++) {
                let curPoint = minPoint + index;
                if (curPoint > maxPoint) {
                    curPoint = minPoint - (curPoint - maxPoint);
                }
                let curObj = totlObj[curPoint];
                if (curObj) {
                    if (!curObj.lai) revisePointObj(curPoint, cardTypeLen);
                } else {
                    let pointVal = curPoint;
                    if (endLaiNum <= 0) break;
                    if (pointVal > 13) pointVal = pointVal - 13;
                    totlObj[curPoint] = { list: [], lai: false };
                    for (let index = 0; index < cardTypeLen; index++) {
                        for (let index = 0; index < newList.length; index++) {
                            const newObj = newList[index];
                            if (newObj.lai && newObj.new == 0) {
                                totlObj[curPoint].list.push(pointVal);
                                newObj.new = pointVal;
                                endLaiNum -= 1;
                                break;
                            }
                        }
                    }
                }
            }
        }

        let checkHeadAndTail = (oneTypeLen) => {
            if (endLaiNum <= 0) return;
            let minPoint = 999;
            for (const point in totlObj) {
                let curObj = totlObj[point];
                let pointNum = parseInt(point);
                if (!curObj.lai && minPoint > pointNum) {
                    minPoint = pointNum;
                }
            }
            if (minPoint != 999) fillHeadAndTail(minPoint, oneTypeLen, oneTypeLen);
        }

        let noCheckPlane = (oneTypeLen) => {
            let isPlane = initList.length > 5;
            if (isPlane) {
                let cardTypeLen = 3;
                for (let index = 0; index < allLaiNum; index++) {
                    let addArr = [];
                    for (const point in totlObj) {
                        let curObj = totlObj[point];
                        if (curObj && !curObj.lai) {
                            let curPointNum = parseInt(point);
                            let nexPointNum = curPointNum + 1;
                            let nexObj = totlObj[nexPointNum];
                            if (nexObj && !nexObj.lai) {
                                let curlist = curObj.list || [];
                                let nexlist = nexObj.list || [];
                                if (isPointKing(curlist) && isPointKing(nexlist)) continue
                                if (nexlist.length != cardTypeLen && allLaiNum >= (cardTypeLen - nexlist.length)) {
                                    addArr.push(nexPointNum)
                                } else if (curlist.length != cardTypeLen && allLaiNum >= (cardTypeLen - curlist.length)) {
                                    addArr.push(curPointNum)
                                }
                            }
                        }
                    }
                    if (addArr.length) {
                        let curPoint = Math.max(...addArr);
                        if (curPoint > 0) revisePointObj(curPoint, cardTypeLen);
                    }
                }

                if (endLaiNum > 0) {
                    let maxPoint = 0, maxLen = 0;
                    for (const point in totlObj) {
                        let curObj = totlObj[point];
                        let pointNum = parseInt(point);
                        if (curObj && !curObj.lai) {
                            let list = curObj.list || [];
                            if (pointNum > maxPoint && list.length >= maxLen) {
                                maxPoint = pointNum;
                                maxLen = list.length;
                            }
                        }
                    }
                    if (maxPoint != 0) fillHeadAndTail(maxPoint, oneTypeLen, cardTypeLen);
                }
            }
            return !isPlane;
        }
        if (cardType == ApiDdz.cardType.SINGLE // 单牌
            || cardType == ApiDdz.cardType.DOUBLE// 对子
            || cardType == ApiDdz.cardType.THREE_LINE//三不带
            || cardType == ApiDdz.cardType.LAIZI_BOMB//癞子炸
        ) {
            if (cardType == ApiDdz.cardType.THREE_LINE && saveList.length > 3) {
                checkHeadAndTail(3);
            } else {
                newList.forEach((obj) => {
                    if (endLaiNum > 0) {
                        if (!saveList.length) {
                            obj.new = 2;//没有变成最大牌
                            endLaiNum -= 1;
                        } else {
                            if (obj.lai) {
                                obj.new = saveList[0];
                                endLaiNum -= 1;
                            }
                        }
                    }
                })
            }
        }
        else if (cardType == ApiDdz.cardType.THREE_LINE_TAKE_ONE) {//三带一
            if (noCheckPlane(4)) twiceCheckMend(3, true);
        }
        else if (cardType == ApiDdz.cardType.THREE_LINE_TAKE_TWO) {//三带二
            if (noCheckPlane(5)) twiceCheckMend(3, true);
        }
        else if (cardType == ApiDdz.cardType.THREE_LINE_TAKE_DUI) {//三带一对
            if (noCheckPlane(5)) twiceCheckMend(3, true);
        }
        else if (cardType == ApiDdz.cardType.FOUR_LINE_TAKE_X) {// 四带X
            if (saveList.length == 2) {
                newList.forEach((obj) => {
                    obj.new = obj.val;
                })
            } else {
                twiceCheckMend(4, true);
                if (endLaiNum > 0) twiceCheckMend(2, true);
            }
        }
        else if (cardType == ApiDdz.cardType.FOUR_LINE_TAKE_DUI) {// 四带两对
            for (let index = 0; index < allLaiNum; index++) {
                let maxPoint = 0, maxLen = 0;
                for (const point in totlObj) {
                    let curObj = totlObj[point];
                    let pointNum = parseInt(point);
                    if (curObj && !curObj.lai) {
                        let list = curObj.list || [];
                        if (pointNum > maxPoint && list.length >= maxLen) {
                            maxPoint = pointNum;
                            maxLen = list.length;
                        }
                    }
                }
                revisePointObj(maxPoint, 4);
            }
            if (endLaiNum > 0) twiceCheckMend(2, true);
        }
        else if (cardType == ApiDdz.cardType.DOUBLE_LINE) {// 对连
            twiceCheckMend(2, true);
            checkHeadAndTail(2);
        }
        else if (cardType == ApiDdz.cardType.SINGLE_LINE) {// 单连
            checkHeadAndTail(1);  // newList = this.changeLaiziToShunzi(initList, DDZModel.getLaiZi())
        }
        newList.forEach((obj) => {
            if (obj.lai) {
                if (!obj.new && endLaiNum) {
                    obj.new = obj.val;
                    endLaiNum -= 1;
                }
            } else {
                obj.new = obj.val;
            }
        })
        newList.sort((a, b) => {
            let pointA = DDZGameLogic.getCardLogicValue(a.new);
            let pointB = DDZGameLogic.getCardLogicValue(b.new);
            return pointA - pointB;
        });
        // console.log("更改后=》endLaiNum", endLaiNum, "totlObj", totlObj, "saveList", saveList, "newList", newList,)
        return newList;
    }

    ///////////////////////////////////////////////////单连部分///////////////////////////////////////////////////////////

    //获得点数
    idToPoint(id) {
        if (id == BIG_JOKER || id == SMALL_JOKER) return id;
        return id % 16;
    }

    //获得点数数组
    idsToPoints(ids) {
        var points = [];
        ids.forEach((id) => {
            points.push(this.idToPoint(id));
        });
        return points;
    }

    isHoldWithA(arr, isID = false) {
        for (var i = 0; i < arr.length; i++) {
            var point = isID ? this.idToPoint(arr[i]) : arr[i];
            if (point === 1 || point === 14) {
                return true;
            }
        }
        return false
    }

    turnAllATo14(points) {
        for (var i = 0; i < points.length; i++) {
            if (points[i] === 1) {
                points[i] = 14;
            }
        }
        return points;
    }

    /*有鬼牌的话改变牌的分*/
    changeCardScors(points) {
        var is14 = true; //是A K Q J 10 ;

        var is1 = true; //是1 2 3 4 5 如果需要12345就把下面的注释代码都放开

        let pointsCopy = points.slice();
        // pointsCopy.forEach(function (card) {
        //     if (card < 10 && card != 1) is14 = false;
        // }); //不是A K Q J 10

        // pointsCopy.forEach(function (card) {
        //     if ((card > 5 && card != 14) && card < SMALL_JOKER) is1 = false;
        // }); //不是1 2 3 4 5});

        // if (pointsCopy.indexOf(14) == -1) is1 = false; //不是1 2 3 4 5});


        if (pointsCopy.indexOf(14) == -1) is14 = false;

        if (is14) { //是A K Q J 10 ;
            pointsCopy.sort(function (a1, a2) {
                return a2 - a1;
            });
            var num = 14,
                scoresAyy = []; //一副牌的分数

            for (var i = 0; i < pointsCopy.length; i++) {
                scoresAyy.push(num);
                num -= 1;
            }

            for (var j = 0; j < scoresAyy.length; j++) {
                for (var i = 0; i < pointsCopy.length; i++) {
                    var cardScores = pointsCopy[i];
                    if (cardScores == scoresAyy[j] && cardScores < 15) scoresAyy.splice(j, 1); //删除不是鬼牌的分
                }
            }
            for (var j = 0; j < pointsCopy.length; j++) {
                if (pointsCopy[j] >= SMALL_JOKER) {
                    pointsCopy[j] = scoresAyy.splice(0, 1)[0];
                }
            }
        }
        // else if (is1) { //是1 2 3 4 5
        //     pointsCopy.sort(function (a1, a2) {
        //         return a2 - a1;
        //     });
        //     var num = 5,
        //         scoresAyy = []; //一副牌的分数
        //     for (var i = 0; i < 5; i++) {
        //         scoresAyy.push(num);
        //         num -= 1;
        //     }
        //     for (var i = 0; i < pointsCopy.length; i++) {
        //         for (var j = 0; j < scoresAyy.length; j++) {
        //             var cardScores = pointsCopy[i] == 14 ? 1 : pointsCopy[i];
        //             if (cardScores == scoresAyy[j] && cardScores < 15) {
        //                 scoresAyy.splice(j, 1);
        //                 break;
        //             }
        //         }
        //     }
        //     for (var j = 0; j < pointsCopy.length; j++) {
        //         if (pointsCopy[j] >= SMALL_JOKER) {
        //             pointsCopy[j] = scoresAyy.splice(0, 1)[0];
        //         }
        //     }
        // } 
        else {
            pointsCopy.sort(function (a1, a2) {
                return a1 - a2;
            });

            let jokerCard = pointsCopy.filter(item => item >= SMALL_JOKER);
            let normaCard = pointsCopy.filter(item => item < SMALL_JOKER);
            // if (jokerCard.length == 1 && normaCard.toString() == [2, 3, 4, 5].toString()) {
            //     pointsCopy = [14, 2, 3, 4, 5];
            // } else if (jokerCard.length == 2 && (normaCard.toString() == [2, 3, 4].toString() || normaCard.toString() == [2, 3, 5].toString() || normaCard.toString() == [3, 4, 5].toString())) {
            //     pointsCopy = [14, 2, 3, 4, 5];
            // } else 
            {
                var scoresAyy = []; //用来装鬼牌分数
                for (var i = 0; i < pointsCopy.length; i++) {
                    var s = parseInt(pointsCopy[0]) + i; //最小的牌的分数
                    scoresAyy.push(s); //一副牌的分数
                }

                for (var j = 0; j < scoresAyy.length; j++) {
                    for (var i = 0; i < pointsCopy.length; i++) {
                        var cardScores = pointsCopy[i];
                        if (cardScores == scoresAyy[j] && cardScores < 15) scoresAyy.splice(j, 1); //删除不是鬼牌的分
                    }
                }
                for (var j = 0; j < pointsCopy.length; j++) {
                    if (pointsCopy[j] >= SMALL_JOKER) {
                        pointsCopy[j] = scoresAyy.splice(0, 1)[0];
                    }
                } //改变牌的分数
            }
        }
        let minNum = pointsCopy[0]
        for (let i = pointsCopy.length - 1; i >= 0; i--) {
            if (pointsCopy[i] > 14) {
                pointsCopy[i] = --minNum
            }
        }
        console.log("顺子数组==", pointsCopy)
        return pointsCopy;
    }

    /**把赖子转换成顺子*/
    changeLaiziToShunzi(ids = [], laizi = []) {
        let cardList = ids.slice();
        if (ids.length == 0 || laizi.length == 0) {
            return ids
        }
        for (let i = 0; i < ids.length; i++) {
            if (laizi.includes(this.idToPoint(ids[i]))) {
                ids[i] = SMALL_JOKER
            }
        }
        let pointList = this.idsToPoints(ids)
        if (this.isHoldWithA(pointList)) {
            pointList = this.turnAllATo14(pointList.slice())
        };
        pointList = this.changeCardScors(pointList);
        for (var i = 0; i < pointList.length; i++) {
            if (pointList[i] === 14) {
                pointList[i] = 1;
            }
        }
        let newList = [];
        for (let i = cardList.length; i > 0; i--) {
            let index = i - 1;
            let carid = cardList[index];
            if (!laizi.includes(this.idToPoint(carid))) {
                let obj = {
                    val: carid,
                    lai: false,
                    new: carid,
                };
                let point = this.idToPoint(carid);
                let pointIndex = pointList.indexOf(point);
                if (pointIndex != -1) {
                    pointList.splice(pointIndex, 1);
                    newList.push(obj);
                }
            }
        }
        pointList.forEach((point) => {
            newList.push({
                val: point,
                lai: true,
                new: point,
            });
        })
        return newList
    }
}

module.exports = new GameUtil();