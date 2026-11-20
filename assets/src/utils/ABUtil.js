let exp = module.exports;
exp.makeXMLHttp = function (args) {
    let {
        timeout,
        url,
        callback
    } = args,
        retInfo = {},
        isValid = true;
    let xhr = new XMLHttpRequest();
    xhr.timeout = Math.ceil((timeout || 6) * 1000);
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 400)) {
            if (!isValid) return;
            isValid = false;
            let data = JSON.parse(xhr.responseText);
            callback(data)
        } else if (xhr.readyState == 4 && xhr.status == 0) {
            if (!isValid) {
                return;
            };
            isValid = false
            callback(null);
        } else if (xhr.readyState == 4) {
            if (!isValid) {
                return;
            };
            isValid = false;
            callback(null);
        }
    };
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.send();
    xhr.ontimeout = () => {
        if (!isValid) return;
        isValid = false;
        callback(null);
    };
    retInfo.abort = () => {
        isValid = false;
        xhr.abort();
    };
    return retInfo;
}

exp.parallelMis = function (callback) {
    let co = 0,
        ret = {};
    co = co + 1;
    let isValid = true;
    let retArgs = {};
    let onFinish = (args) => {
        if (!isValid) {
            return;
        }
        co = co - 1;
        if (args) {
            retArgs = Object.assign(retArgs, args);
        }
        if (co <= 0) {
            if (callback) {
                callback(retArgs);
            }
        }
    }
    ret.onFinish = onFinish;
    ret.addMis = () => {
        co = co + 1;
        return onFinish;
    }
    ret.start = () => {
        onFinish();
    }
    ret.close = () => {
        isValid = false;
    }
    return ret;
}

exp.sequenceMis = function (bundles, all, single) {
    if (bundles.length == 0) {
        all();
        return;
    }
    let co = 0;
    let exec = () => {
        if (co >= bundles.length) {
            all();
            return;
        }
        let bundle = bundles[co];
        let curr = co;
        co = co + 1;
        single(bundle, curr, exec);
    }
    exec();
}

// 对比版本号, -1:本地版本比较旧, 0:相等, 1:本地版本比较新
exp.versionCompare = function (localVer, romoteVer) {
    let verSplit_local = localVer.split('.')
    let verSplit_remote = romoteVer.split('.')
    let localCo = verSplit_local.length;
    let remoteCo = verSplit_remote.length;
    let maxCo = localCo > remoteCo ? localCo : remoteCo;
    let status = 0;
    for (let i = 0; i < maxCo; i++) {
        let n_local = parseInt(verSplit_local[i], 10);
        let n_remote = parseInt(verSplit_remote[i], 10);
        if (i < localCo && i >= remoteCo) {
            status = 1;
            break;
        } else if (i >= localCo && i < remoteCo) {
            status = -1;
            break;
        } else if (n_local > n_remote) {
            status = 1;
            break;
        } else if (n_local < n_remote) {
            status = -1;
            break;
        }
    }
    return status;
}