const ConfigModel = require('../model/ConfigModel');

let utils = module.exports;

let isPrintFlag = false;

utils.log = function (print) {
    if (cc.sys.isBrowser || !!print) return;
    console.log = () => { };
    console.error = () => { };
    console.warn = () => { };
}

/**
 * Check and invoke callback function
 */
utils.invoke = function (cb) {
    if (!!cb && typeof cb === 'function') {
        cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

utils.size = function (obj) {
    if (!obj) {
        return 0;
    }
    let size = 0;
    for (let f in obj) {
        if (obj.hasOwnProperty(f)) {
            size++;
        }
    }
    return size;
};

// print the file name and the line number ~ begin
function getStack() {
    let orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };
    let err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    let stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
}

function getFileName(stack) {
    return stack[1].getFileName();
}

function getLineNumber(stack) {
    return stack[1].getLineNumber();
}

utils.myPrint = function () {
    if (isPrintFlag) {
        let len = arguments.length;
        if (len <= 0) {
            return;
        }
        let stack = getStack();
        let aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
        for (let i = 0; i < len; ++i) {
            aimStr += arguments[i] + ' ';
        }
        console.log('\n' + aimStr);
    }
};
// print the file name and the line number ~ end

utils.getProperties = function (model, fields) {
    let result = {};
    fields.forEach(function (field) {
        if (model.hasOwnProperty(field)) {
            result[field] = model[field];
        }
    });
    return result;
};

utils.setProperties = function (model, properties) {
    for (let prop in properties) {
        model[prop] = properties[prop];
    }
};

utils.multiplyProperties = function (properties, multiplier) {
    let result = {};
    for (let k in properties) {
        result[k] = Math.floor(properties[k] * multiplier);
    }
    return result;
};

utils.addProperties = function (toProps, fromProps) {
    for (let k in fromProps) {
        if (toProps[k]) {
            toProps[k] += fromProps[k];
        } else {
            toProps[k] = fromProps[k];
        }
    }

};

utils.isEmptyObject = function (obj) {
    for (let name in obj) {
        return false;
    }
    return true;
};

utils.getLength = function (obj) {
    let total = 0;
    for (let k in obj) {
        total++;
    }
    return total;
}

utils.getDist = function (fromPos, toPos) {
    let dx = toPos.x - fromPos.x;
    let dy = toPos.y - fromPos.y;
    return Math.sqrt(dx * dx + dy * dy);
};

utils.isPositiveInteger = function (num) {
    let r = /^[1-9][0-9]*$/;
    return r.test(num);
};

utils.ipToInt = function (ip) {
    let parts = ip.split(".");
    if (parts.length != 4) {
        return 0;
    }
    return (parseInt(parts[0], 10) << 24 |
        parseInt(parts[1], 10) << 16 |
        parseInt(parts[2], 10) << 8 |
        parseInt(parts[3], 10)) >>> 0;
};

utils.getRandomNum = function (min, max, int) {
    let range = max - min;
    let rand = Math.random();
    let val = min + Math.round(rand * range);
    if (int) val = parseInt(val);
    return val;
};


utils.userId2Number = function (userId) {
    let hash = 5381,
        i = userId.length;

    while (i)
        hash = (hash * 33) ^ userId.charCodeAt(--i);
    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return Number(hash >>> 0);
};

utils.createJoinRoomID = function (serverID, roomID) {
    let id = parseInt(serverID.split('-')[1]);
    if (!!id) {
        return id * 1000 + roomID;
    }

    return 0;
};

utils.parseJoinRoomID = function (joinRoomID) {
    joinRoomID = parseInt(joinRoomID);
    if (!!joinRoomID) {
        return {
            gameServerID: 'game-' + Math.floor(joinRoomID / 1000),
            roomID: joinRoomID % 1000
        };
    }
    return null;
};

let DAY_MS = 24 * 60 * 60 * 1000;
utils.getIntervalDay = function (time1, time2) {
    return Math.abs((Math.floor(time1 / DAY_MS) - Math.floor(time2 / DAY_MS)));
};

utils.getDayMinimumSeconds = function (params) {
    return DAY_MS;
}

//时间戳转换成日期
Date.prototype.format = function (format) {
    let date = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S+": this.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (let k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length === 1 ?
                date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
};

String.prototype.format = function (args) {
    let result = this;
    if (arguments.length > 0) {
        if (arguments.length === 1 && typeof (args) === "object") {
            for (let key in args) {
                if (args[key] !== undefined) {
                    let reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        } else {
            for (let i = 0; i < arguments.length; i++) {
                if (arguments[i] !== undefined) {
                    let reg = new RegExp("({[" + i + "]})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
};

//生成随机字符串
utils.randomString = function (len) {
    len = len || 16;
    let chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'; /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    let maxPos = chars.length;
    let pwd = '';
    for (i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
};

// 获取单位向量
utils.getUnitVector = function (startPoint, endPoint) {
    let point = cc.v2(0, 0);
    let distance;
    distance = Math.pow((startPoint.x - endPoint.x), 2) + Math.pow((startPoint.y - endPoint.y), 2);
    distance = Math.sqrt(distance);
    if (distance === 0) return point;
    point.x = (endPoint.x - startPoint.x) / distance;
    point.y = (endPoint.y - startPoint.y) / distance;
    return point;
};

utils.stringFormat = function () {
    if (arguments.length === 0)
        return null;
    let str = arguments[0];
    for (let i = 1; i < arguments.length; i++) {
        let re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
        str = str.replace(re, arguments[i]);
    }
    return str;
};

/**
 * 获取字符串的真实长度（一个汉字算两个字符）
 * @param {*} str 
 * @returns 
 */
utils.getCharCount = function (str) {
    let realLength = 0;
    for (let i = 0; i < str.length; ++i) {
        let count = str.charCodeAt(i);
        let char = count >= 0 && count <= 128 ? 1 : 2;
        realLength += char;
    }
    return realLength;
};

utils.formatNumberWithDecimal = function (num, decimal) {
    if (!num || isNaN(num)) return 0;
    decimal = decimal >= 0 ? decimal : 0;
    let scale = Math.pow(10, decimal);
    let rate = num >= 0 ? 1 : -1
    num *= scale;
    num = Math.floor(Math.abs(num));
    num /= scale;
    return num * rate;
};

utils.formatNumberWithSymbol = function (num, decimal) {
    if (!num || isNaN(num)) return 0;
    let abs = Math.abs(num),
        val = 0;
    let unit = '';
    val = num;
    let format = ConfigModel.getData('currencySymbolEnable');
    if (!!format) {
        if (abs >= Math.pow(10, 4) && abs < Math.pow(10, 8)) {
            val = num / Math.pow(10, 4);
            unit = '万';
        } else if (abs >= Math.pow(10, 8)) {
            val = num / Math.pow(10, 8);
            unit = '亿';
        }
    }
    val = this.formatNumberWithDecimal(val, decimal)
    return `${val}${unit}`;
}

utils.deepCopy = function (obj) {
    let result = Array.isArray(obj) ? [] : {};
    if (obj && typeof obj === 'object') {
        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (obj[key] && typeof obj[key] === 'object') {
                    result[key] = this.deepCopy(obj[key]);
                } else {
                    result[key] = obj[key];
                }
            }
        }
    }
    return result;
}

utils.keepNumberPoint = function (num, decimal) {
    let base = 1;
    for (let i = 0; i < decimal; ++i) {
        base *= 10;
    }
    return Math.floor(num * base) / base;
};

// 根据经纬度获取，两点之间的距离
utils.getDistanceByLocation = function (location1, location2) {
    let radLat1 = location1.x * Math.PI / 180.0;
    let radLat2 = location2.x * Math.PI / 180.0;
    let a = radLat1 - radLat2;
    let b = location1.y * Math.PI / 180.0 - location1.y * Math.PI / 180.0;
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137; // EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000;
    return s;
};

var EARTH_RADIUS = 6378.137; //地球半径  
//将用角度表示的角转换为近似相等的用弧度表示的角 java Math.toRadians  
function rad(d) {
    return d * Math.PI / 180.0;
}
/** 
 * 谷歌地图计算两个坐标点的距离 
 * @param lng1  经度1 
 * @param lat1  纬度1 
 * @param lng2  经度2 
 * @param lat2  纬度2 
 * @return 距离（千米） 
 */
utils.getDistance = function (lng1, lat1, lng2, lat2) {
    var radLat1 = rad(lat1);
    var radLat2 = rad(lat2);
    var a = radLat1 - radLat2;
    var b = rad(lng1) - rad(lng2);
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) *
        Math.pow(Math.sin(b / 2), 2)));
    s = s * EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000;
    return s;
}

utils.csvToArray = function (strData, strDelimiter) {
    strDelimiter = (strDelimiter || ",");
    let objPattern = new RegExp(
        (
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );
    let arrData = [
        []
    ];
    let arrMatches = null;
    while (arrMatches = objPattern.exec(strData)) {
        let strMatchedDelimiter = arrMatches[1];
        if (
            strMatchedDelimiter.length &&
            (strMatchedDelimiter !== strDelimiter)
        ) {
            arrData.push([]);
        }
        let strMatchedValue;
        if (arrMatches[2]) {
            strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
            );
        } else {
            strMatchedValue = arrMatches[3];
        }
        arrData[arrData.length - 1].push(strMatchedValue);
    }
    if (arrData.length > 0) {
        arrData.pop();
    }

    let kNames = arrData[0];
    let datas = [];
    for (let k in arrData) {
        if (k == 0) continue;
        let dataIndex = arrData[k];
        let jsData = {};
        for (let ki in dataIndex) {
            let kk = kNames[ki];
            let kv = dataIndex[ki];
            jsData[kk] = kv;
        }
        datas[k - 1] = jsData;
    }
    return datas;
};

utils.stringSecurity = function (val, head = 1, end = 1) {
    if (head < 1) head = 1;
    if (end < 1) end = 1;
    if (!val) return '';
    if (typeof (val) != 'string' && typeof (val) != 'number') return '';
    if (typeof (val) == 'number') val = val.toString();
    let total = val.length;
    if (total == 0) return val;
    if (head + end >= total) return val;
    let star = '*';
    star = star.repeat(4);
    let vals = val.split('');
    let heads = vals.splice(0, head);
    let endIdx = total - end - 1;
    let ends = vals.splice(endIdx, end);
    return `${heads.join('')}${star}${ends.join('')}`;
}

//生成UUID
utils.createUUID = () => {
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
        uuid = [];
    for (let i = 0; i < 4; i++) {
        uuid[i] = chars[0 | Math.random() * 36];
    }
    let uid = uuid.join('');
    uid = Number(Date.now()).toString(36) + uid;
    return uid;
}

utils.objFormat = (data) => {
    if (!data) {
        return {};
    }
    if (typeof (data) === 'object') {
        return data;
    } else if (typeof (data) === 'string') {
        data = JSON.parse(data);
        return data;
    }
    return {};
}

/**
 * 设置RichText 字符串颜色
 * @param colors 颜色代码
 * @param txts 文本
 * @returns 
 */
utils.setRichTextColor = function (colors, txts, jiachu) {
    let str = '<color=' + String(colors) + '>' + String(txts) + '</color>';
    if (jiachu) {
        str = `<b>${str}</b>`
    }
    return str
}

utils.convertNickname = function (nickname) {
    let isNumber = true;
    let newNickname = nickname;
    if (nickname.length > 7) {
        for (let i = 0; i < nickname.length; i++) {
            if (isNaN(nickname[i])) {
                isNumber = false;
            }
        }
        if (isNumber) {
            newNickname = nickname.substring(0, 3) + '****' + nickname.substring(nickname.length - 4, nickname.length);
        }
    }
    return newNickname;
};

utils.createNonceString = function () {
    let strs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']; //随机字符
    let sb = "";
    let length = strs.length;
    for (let i = 0; i < length; i++) {
        let r = Math.random() * length;
        r = Math.ceil(r);
        sb += strs[r - 1];
    }
    return sb;
}

/**
 * 对象 Object和Array的复制/克隆
 * @param {*} data 
 * @returns 
 */
utils.clone = function (data) {
    if (!data) return data;
    return JSON.parse(JSON.stringify(data));
}

/**数组乱序 */
utils.shuffle = function (arr) {
    let i = arr.length
    while (i) {
        let j = Math.floor(Math.random() * i--);
        [arr[j], arr[i]] = [arr[i], arr[j]];
    }
    return arr;
}

utils.getDateFormat = function (time = null) {
    let dateObj = {
        yyyymmdd: '',
        yyyymmddhhmm: '',
        yyyymmddhhmmss: '',
        mmdd: '',
        mmddhhmm: '',
        mmddhhmmss: '',
        hhmmss: '',
        hhmm: '',
        mmss: '',
    };
    time = time || Date.now();
    time = parseInt(time);
    if (isNaN(time)) time = Date.now();
    let date = new Date(time);
    dateObj.yyyymmdd = date.format("yyyy-MM-dd");
    dateObj.yyyymmddhhmm = date.format("yyyy-MM-dd  hh:mm");
    dateObj.yyyymmddhhmmss = date.format("yyyy-MM-dd hh:mm:ss");
    dateObj.mmdd = date.format("MM-dd");
    dateObj.mmddhhmm = date.format("MM-dd hh:mm");
    dateObj.mmddhhmmss = date.format("MM-dd hh:mm:ss");
    dateObj.hhmmss = date.format("hh:mm:ss");
    dateObj.hhmm = date.format("hh:mm");
    dateObj.mmss = date.format("mm:ss");
    return dateObj;
}

//获取指定时间的时间对象
utils.getDayTime = function (index) {
    index = index || 0;
    let obj = {
        yyyymmdd: '',
        gte: '',
        lte: '',
        jte: '',
    }
    let tTime = Date.now() - index * this.getDayMinimumSeconds();
    let aTime = Date.now() - (index - 1) * this.getDayMinimumSeconds();
    let tDate = this.getDateFormat(tTime);
    let aDate = this.getDateFormat(aTime);
    obj.yyyymmdd = tDate.yyyymmdd;
    let gte = `${tDate.yyyymmdd} 00:00:00`;
    let lte = `${tDate.yyyymmdd} 23:59:59`;
    let jte = `${aDate.yyyymmdd} 00:00:00`; //下一天的开始时间
    obj.gte = new Date(gte).getTime();
    obj.lte = new Date(lte).getTime();
    obj.jte = new Date(jte).getTime() - 1;
    return obj;
}

utils.pwdVerify = function (pwd, min, max) {
    // var rule = `(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[^a-zA-Z0-9]).{${min},${max}}`; //密码中必须包含大小写 字母、数字、特称字符
    // var rule = `(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9]).{${min},${max}}`; //密码中必须包含字母（不区分大小写）、数字、特称字符
    // var rule = `(?=.*[0-9])(?=.*[a-zA-Z]).{${min},${max}}`; //密码中必须包含字母（不区分大小写）、数字
    // var regex = new RegExp(rule);
    // return regex.test(pwd);
    min = 1;
    let test = !!pwd && pwd.length <= max && pwd.length >= min;
    return test;
}
/**
 * 结束倒计时，过程时间
 * @param endStamp 结束时间节点时间戳
 * 单位：毫秒
 * 返回时间转换对象
 */
utils.timerToEnd = function (end) {
    let time = {
        leftMini: 0,
        leftSec: 0,
        timeSec: 0,
        timeMin: 0,
        timeHou: 0,
        timeStr: '',
        msStr: '',
        leftSecDouble: ''
    };
    let SEC, HMS, MIN, HOU, MS, DSEC;
    let MSC = Math.floor(end - Date.now());
    MSC = MSC > 0 ? MSC : 0;
    let TIME = Math.floor((end - Date.now()) / 1000);
    TIME = TIME > 0 ? TIME : 0;
    SEC = Math.floor(TIME % 60);
    MIN = Math.floor(TIME / 60);
    if (MIN >= 60) {
        HOU = Math.floor(MIN / 60);
        MIN = Math.floor(MIN % 60);
    } else {
        HOU = 0;
    }
    SEC = SEC < 10 ? '0' + SEC : SEC;
    MIN = MIN < 10 ? '0' + MIN : MIN;
    HOU = HOU < 10 ? '0' + HOU : HOU;
    HMS = HOU + ':' + MIN + ':' + SEC;
    MS = MIN + ':' + SEC;
    DSEC = TIME >= 10 ? TIME.toString() : `0${TIME}`;
    time.leftMini = MSC;
    time.timeStr = HMS;
    time.msStr = MS;
    time.timeSec = SEC;
    time.timeMin = MIN;
    time.timeHou = HOU;
    time.leftSec = TIME;
    time.leftSecDouble = DSEC;
    return time;
}

utils.isNetworkAddress = function (url) {
    if (!url) return false;
    let test = url.indexOf('http://') >= 0 || url.indexOf('https://') >= 0;
    return test;
}

utils.getNickName = function (name) {
    //定义一个表情包正则
    let emojiReg = /[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[\A9|\AE]\u3030|\uA9|\uAE|\u3030/gi;
    return name.replace(emojiReg, "");
}


/**
 * 对对象数组进行去重，基于指定的唯一属性
 * @param {Array} array - 要去重的对象数组
 * @param {string} [uniqueKey] - 用于判断对象是否唯一的属性名
 * @returns {Array} - 去重后的对象数组
 */
utils.uniqueByProperty = function (array, uniqueKey) {
    const seen = {};
    return array.reduce((acc, item) => {
        const key = item[uniqueKey];
        if (!seen[key]) {
            seen[key] = true;
            acc.push(item);
        }
        return acc;
    }, []);
}

/**判断两个数组或者对象是否完全相等 */
utils.deepEqual = function (obj1, obj2) {
    // 首先处理非对象和非数组的情况
    if (obj1 === obj2) {
        return true;
    }

    // 处理对象或数组为 null 的情况
    if (obj1 == null || typeof obj1 !== 'object' ||
        obj2 == null || typeof obj2 !== 'object') {
        return false;
    }

    // 获取对象的类型标签（数组或对象）
    let obj1Type = Object.prototype.toString.call(obj1);
    let obj2Type = Object.prototype.toString.call(obj2);

    // 如果类型不同，直接返回 false
    if (obj1Type !== obj2Type) {
        return false;
    }

    // 处理数组
    if (Array.isArray(obj1)) {
        if (obj1.length !== obj2.length) {
            return false;
        }
        for (let i = 0; i < obj1.length; i++) {
            if (!this.deepEqual(obj1[i], obj2[i])) {
                return false;
            }
        }
        return true;
    }

    // 处理对象
    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);

    // 如果键的数量不同，直接返回 false
    if (keys1.length !== keys2.length) {
        return false;
    }

    // 检查 obj2 是否包含 obj1 的所有键
    for (let key of keys1) {
        if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

utils.numberSecurity = function (str, noSet = false) {
    if (noSet || !str || typeof (str) == 'object') return str;
    str = String(str);
    let length = str.length;
    let star = '***';
    if (length == 0) return star;
    if (length < 5) return str.substr(0, 2) + star;
    return str.substr(0, 2) + star + str.substr(-1, 3);
}
