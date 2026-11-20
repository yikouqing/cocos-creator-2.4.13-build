const WXWebUtil = require('./WXWebUtil');
const MessageCallback = require('../utils/MessageCallback');
const AssetsManager = require('../../src/utils/AssetsManager');
const Configs = require('../../src/const/Configs');
const Enums = require('../../src/const/Enums');
const ConfigModel = require('../model/ConfigModel');
const CCUtil = require('./CCUtil');
const Events = require('../const/Events');
const NetworkManager = require('./NetworkManager');
const CacheManager = require('./CacheManager');
const Utils = require('./Utils');
const ApiHall = require('../api/ApiHall');
const UserModel = require('../model/UserModel');

var exp = module.exports;
exp.init = function () {
    if (cc.sys.isBrowser) {
        WXWebUtil.wxInit();
    }
}

/**
 * 删除资源缓存
 * @returns 
 */
exp.clearCache = function () {
    if (!cc.sys.isNative) {
        cc.game.restart();
        return;
    }
    let fileUtils = jsb.fileUtils;
    let cachePath = (fileUtils ? fileUtils.getWritablePath() : '/') + 'remote-asset/';
    if (!fileUtils.isDirectoryExist(cachePath)) return;
    fileUtils.removeDirectory(cachePath);
    cc.game.restart();
}

exp.openUrl = function (url) {
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("AppController", "openUrl:", url)
    } else {
        cc.sys.openURL(url);
    }
};

exp.getAppVersion = function () {
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_ANDROID) return jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "getAppVersion", "()Ljava/lang/String;");
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) return jsb.reflection.callStaticMethod("CCCUtil", "getAppVersion:", 'iOS');
    return '2.0.0';
}

exp.copyText = function (text) {
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "setClipboard", "(Ljava/lang/String;)V", text);
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("CCCUtil", "setClipboard:", text);
    } else if (cc.sys.isBrowser) {
        let textArea = document.getElementById("clipBoard");
        if (textArea === null) {
            textArea = document.createElement("textarea");
            textArea.id = "clipBoard";
            textArea.textContent = text;
            document.body.appendChild(textArea);
        }
        textArea.select();
        let msg = null;
        try {
            msg = document.execCommand('copy') ? '复制成功' : '复制失败';
            document.body.removeChild(textArea);
        } catch (err) {
            msg = '复制失败'
        }
        // console.log(">>>>>", msg);
    }
    AssetsManager.tipDialog("复制成功");
};

exp.openAppByUrl = function (url) { };

/**
 * 保存到相册
 */
exp.savePhoto = function (path, rotate, callback) {
    //旋转控制 0-不旋转 1-顺时针90°旋转 2-逆时针90°旋转
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_ANDROID) jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "savePhoto", "(Ljava/lang/String;I)V", path, rotate);
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) jsb.reflection.callStaticMethod("CCCUtil", "savePhoto:rotate:", path, rotate);
    callback && callback();
}

exp.locationEnable = function (mark = "") {
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        return jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "locationEnable", "(Ljava/lang/String;)Z", mark);
    } else if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) {
        return jsb.reflection.callStaticMethod("AppController", "locationEnable:", mark);
    } else {
        return true;
    }
}

exp.startLocation = function (mark = "") {
    CacheManager.setItem('onLocationReq', true);
    if (cc.sys.isBrowser) { } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "startLocation", "(Ljava/lang/String;)V", mark);
    } else if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("AppController", "startLocation:", mark);
    }
};

exp.onLocationCallback = function () {
    let aMapLocation = this.getLocation();
    if (!!aMapLocation) {
        //同步定位
        CacheManager.setItem('onLocationSucc', true);
        let reqData = {
            address: aMapLocation.address,
            location: aMapLocation.location
        };
        ApiHall.updateUserAddressRequest(reqData);
        MessageCallback.emitMessage('OnLocationCallback');
    }
}

exp.getLocation = function () {
    let location = null;
    let params = null;
    let result = this.getVirtualLocation();
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_ANDROID) location = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "getLocation", "(Ljava/lang/String;)Ljava/lang/String;", 'location');
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) location = jsb.reflection.callStaticMethod("AppController", "getLocation:", 'location');
    try {
        //新版定位
        location = !location || location.length == 0 ? JSON.stringify({}) : location;
        params = JSON.parse(location);
        result.location = params.address || '';
        result.address = JSON.stringify({
            x: params.latitude || 0,
            y: params.longitude || 0
        });
    } catch (error) {
        location = location || '0-0-未知';
        params = location.split('-');
        result.location = params[2] || '';
        result.address = JSON.stringify({
            x: params[1] || 0,
            y: params[0] || 0
        });
    }
    return result;
}

exp.getVirtualLocation = function () {
    let result = {
        location: '',
        address: JSON.stringify({
            x: 0,
            y: 0,
        })
    }
    return result;
}

exp.getNetDelay = function (cb) {
    return;
};

//获取电量
exp.getBattery = function () {
    // let battery = '0.8';
    // if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
    //     battery = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "getBattery", "(Ljava/lang/String;)Ljava/lang/String;", "battery");
    // } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
    //     battery = jsb.reflection.callStaticMethod("CCCUtil", "getBattery:", "battery");
    // }
    // return isNaN(parseFloat(battery)) ? 0.8 : parseFloat(battery);
    return cc.sys.getBatteryLevel();
};

//获取信号强度
exp.getSignal = function () {
    let signal = '1.0';
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        signal = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "getSignal", "(Ljava/lang/String;)V", "signal");
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
        signal = jsb.reflection.callStaticMethod("CCCUtil", "getSignal:", "signal");
    }
    return isNaN(parseFloat(signal)) ? 1.0 : parseFloat(signal);
};

//获取网络类型
exp.getNetType = function () {
    let netType = '2';
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        netType = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "getNetType", "(Ljava/lang/String;)V", "signal");
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
        netType = jsb.reflection.callStaticMethod("CCCUtil", "getNetType:", "signal");
    }
    return isNaN(parseInt(netType)) ? 2 : parseInt(netType);
};

exp.getDeviceId = function () {
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_ANDROID) return jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "getDeviceId", "()Ljava/lang/String;");
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) return jsb.reflection.callStaticMethod("CCCUtil", "getUUID:", 'iOS');
    return this.getLocalDeviceId();
}

exp.getLocalDeviceId = function () {
    let deviceId = CacheManager.getItem('deviceId');
    if (typeof (deviceId) != 'string') {
        deviceId = Utils.randomString();
        CacheManager.setItem('deviceId', deviceId);
    }
    return deviceId;
}

exp.hideSplash = function () {
    if (cc.sys.isBrowser) return;
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "hideSplash", "()V");
    } else if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("RootViewController", "hideSplash:", 'splash');
    }
};

//微信授权登录
exp.wxLogin = function () {
    if (cc.sys.isBrowser) {
        WXWebUtil.wxLogin();
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "wxLogin", "()V")
    } else if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("WeChatUtil", "wxLogin:", 'test')
    }
};

//微信授权登录结果
exp.wxLoginCallback = function (code) {
    let wechat = ConfigModel.getWechat();
    NetworkManager.httpRequest({
        url: ConfigModel.getUrl('wxAppToken'),
        data: {
            appid: wechat.wxAppId,
            secret: wechat.wxAppSecret,
            code: code,
            grant_type: 'authorization_code'
        },
        cb: (tData) => {
            if (tData.errcode) return;
            NetworkManager.httpRequest({
                url: ConfigModel.getUrl('wxAppUserInfo'),
                data: {
                    access_token: tData.access_token,
                    openid: tData.openid
                },
                cb: (uData) => {
                    if (uData.errcode) return;
                    MessageCallback.emitMessage('PlatformLogin', {
                        platform: Enums.loginPlatform.WEI_XIN,
                        userInfo: uData
                    });
                }
            })
        }
    });
};

exp.appleLogin = function () {
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("AppController", "appleLogin:", 'test')
    }
};

exp.appleLoginCallback = function (userId) {
    let userInfo = {};
    userInfo.unionid = userId;
    userInfo.nickname = `苹果用户${Utils.getRandomNum(100, 1000000)}`;
    userInfo.headimgurl = ConfigModel.getHead();
    userInfo.sex = 0;
    MessageCallback.emitMessage('PlatformLogin', {
        platform: Enums.loginPlatform.APPLE,
        userInfo: userInfo
    });
}

// 微信分享
// sceneType: 0 朋友， 1朋友圈
exp.wxShareImg = function (sceneType, imgPath, description = Configs.appName) {
    if (cc.sys.isBrowser) return;
    if (cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "wxShareImage", "(ILjava/lang/String;)V", sceneType, imgPath);
    } else if (cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("WeChatUtil", "wxShareImage:path:", sceneType, imgPath);
    }
};

exp.wxShareUrl = function (sceneType, url, title, description) {
    if (cc.sys.isBrowser) return;
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "wxShareWithUrl", "(ILjava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", sceneType, url, title, description);
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("WeChatUtil", "wxShareWithUrl:url:title:content:", sceneType, url, title, description);
    }
};

exp.wxShareFinished = function (errCode) {
    MessageCallback.emitMessage('PlatformShare', {
        platform: Enums.loginPlatform.WEI_XIN,
        errCode: errCode
    });
};

/**横竖屏切换 
 * orientation
 * h 横屏 v 竖屏
 */
exp.setOrientation = function (orientation) {
    let w = cc.view.getFrameSize().width;
    let h = cc.view.getFrameSize().height;
    if ((orientation == 'h' && w > h) || (orientation == 'v' && w < h)) return;
    this.orientation = orientation;
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod('AppController', "setOrientation:", orientation);
    } else if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "setOrientation", "(Ljava/lang/String;)V", orientation);
    }
    if (orientation == 'h') {
        cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
    } else {
        cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
    }
    cc.view.setFrameSize(h, w);
}

exp.getDeviceOrientation = function () {
    return this.orientation || Enums.deviceOrientation.H;
}

// 类型，是否需要裁剪，裁剪尺寸，回调方法
exp.pickImage = function (dict) {
    if (!dict || typeof (dict) != "object") {
        dict = {
            type: Enums.PickImageMethod.Album,
            needClip: needClip, //0是不裁剪,1是裁剪
            clipX: 100, //裁剪x尺寸
            clipY: 100, //裁剪y尺寸
        }
    }
    dict.type = dict.type || Enums.PickImageMethod.Album;
    dict.needClip = dict.needClip || 1;
    dict.clipX = dict.clipX || 100;
    dict.clipY = dict.clipY || 100;
    var info = JSON.stringify(dict);
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        if (dict.type == Enums.PickImageMethod.Album) {
            jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "pickAlbum", "(Ljava/lang/String;)V", info);
        } else if (dict.type == Enums.PickImageMethod.Camera) {
            jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "pickCamera", "(Ljava/lang/String;)V", info);
        }
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
        if (dict.type == Enums.PickImageMethod.Album) {
            jsb.reflection.callStaticMethod('AppController', "pickAlbum:", info);
        } else if (dict.type == Enums.PickImageMethod.Camera) {
            jsb.reflection.callStaticMethod('AppController', "pickCamera:", info);
        }
    } else if (cc.sys.isBrowser) {
        dict.callback = (filePath, base64) => {
            this.onPickImageResult(filePath, base64);
        }
        CCUtil.pickImage(dict);
    }
}

exp.onPickImageResult = function (filePath, base64) {
    let dict = {
        filePath: filePath,
        base64: base64
    }
    MessageCallback.emitMessage('OnPickImageResult', dict);
}

exp.getAppChannel = function () {
    let channel = 0;
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) channel = jsb.reflection.callStaticMethod("CCCUtil", "getAppChannel:", 'iOS');
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_ANDROID) channel = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "getAppChannel", "()I");
    channel = channel || 0;
    return channel;
}

exp.gvApplyKey = function (uid) {
    if (cc.sys.isBrowser) return;
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/GVActivity", "applyMsgKey", "(I)Ljava/lang/String;", uid);
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("GVController", "applyMsgKey:", uid);
    }
};

exp.gvDownloadAndPlayVoice = function (fileId) {
    // console.log("下载并播放" + fileId);
    if (cc.sys.isBrowser) return;
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/GVActivity", "downloadAndPlayVoice", "(Ljava/lang/String;)Ljava/lang/String;", fileId);
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("GVController", "downloadAndPlayVoice:", fileId);
    }
};

exp.gvStartRecord = function () {
    if (cc.sys.isBrowser) return;
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/GVActivity", "startRecord", "()Ljava/lang/String;");
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("GVController", "startRecord:", "mark");
    }
};

exp.gvStopRecord = function () {
    if (cc.sys.isBrowser) return;
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/GVActivity", "stopRecord", "()Ljava/lang/String;");
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("GVController", "stopRecord:", "mark");
    }
};

exp.gvStopAndUploadRecord = function () {
    if (cc.sys.isBrowser) return;
    if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/GVActivity", "stopRecodeAndUploadVoice", "()Ljava/lang/String;");
    } else if (!cc.sys.isBrowser && cc.sys.os === cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("GVController", "stopRecodeAndUploadVoice:", "mark");
    }
};

exp.gvUploadRecordCallback = function (fileId) {
    MessageCallback.emitMessage(Events.clientEvents.gvUploadFileSuccess, fileId);
}

//内购请求
exp.appleOrder = function (goodID) {
    if (cc.sys.isBrowser) return;
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) {
        jsb.reflection.callStaticMethod("IAPUtil", "buyProduct:", goodID);
    }
}

//内购商品信息请求
exp.requestProductInfo = function (id) {
    // console.log("BuyProduct " + id);
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) jsb.reflection.callStaticMethod("IAPUtil", "requstProductInfo:", id);
}

//app升级或者重装后，对已内购信息恢复请求
exp.restoreBuyProduct = function (id) {
    // console.log("BuyProduct " + id);
    if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) jsb.reflection.callStaticMethod("IAPUtil", "restoreBuyProduct:", id);
}

//内购成功xcode回掉
exp.buyProcuctSuccessCallback = function (transactionId, receipt) {
    // console.log("buyProcuctSuccessCallback 2" + receipt);
    CacheManager.setItem('applePayReceipt', receipt);
    MessageCallback.emitMessage(Events.clientEvents.onApplePaySuccess, { receipt: receipt, transactionId: transactionId });
}

//内购失败xcode回掉
exp.buyProcuctFailedCallback = function (eventId) {
    // console.log("BuyProcuctFailedCallBack " + eventId);
    MessageCallback.emitMessage(Events.clientEvents.onApplePayFailed, eventId);
}

//商品信息xcode回掉
exp.showProductListCallback = function (eventId) {
    // console.log("ShowProductList " + eventId);
}

//对已购买的商品进行恢复xcode回掉
exp.restoreBuyProductSuccessCallback = function (eventId) {
    // console.log("restoreBuyProductSuccessCallback " + eventId);
}

window.NativeUtil = exp; //提供给原生端访问