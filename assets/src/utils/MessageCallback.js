const NetworkLogic = require('./NetworkLogic');
const AssetsManager = require('./AssetsManager');
const Codes = require('../const/Codes');
const UserModel = require('../../src/model/UserModel');
const ConfigModel = require('../../src/model/ConfigModel');
const Enums = require('../const/Enums');
const CacheManager = require('./CacheManager');
const CryptoUtil = require('./CryptoUtil');
const LoginManager = require('./LoginManager');

var exp = module.exports;
exp.addListener = function (route, handler) {
    this.handlers = this.handlers || [];
    let handlers = this.handlers[route] || null;
    if (!!handlers) {
        let isHandlerExist = false;
        for (let i in handlers) {
            if (handlers.hasOwnProperty(i) && handlers[i] === handler) {
                isHandlerExist = true;
                break;
            }
        }
        if (!isHandlerExist) {
            handlers.push(handler);
        }
    } else {
        handlers = [];
        handlers.push(handler);
        this.handlers[route] = handlers;
    }
};

exp.removeListener = function (route, handler) {
    this.handlers = this.handlers || [];
    if (!this.handlers[route]) return;
    for (let i = 0; i < this.handlers[route].length; ++i) {
        if (this.handlers[route][i] === handler) {
            this.handlers[route].splice(i, 1);
            break;
        }
    }
};

exp.emitMessage = function (route, msg) {
    if (route == Enums.Push_Router.GAME ||
        route == Enums.Push_Router.ROOM) {
        // if (!!msg && !!msg.data && typeof (msg.data) == 'string') {
        //     msg.data = CryptoUtil.decrypt(msg.data);
        // }
    }
    this.handlers = this.handlers || [];
    let handlers = this.handlers[route] || [];
    if (!!handlers) {
        let handlersTemp = handlers.slice();
        for (let i in handlersTemp) {
            if (handlersTemp.hasOwnProperty(i) && !!handlersTemp[i].messageCallbackHandler) {
                handlersTemp[i].messageCallbackHandler(route, msg);
            }
        }
    }
    this.commonMessage(route, msg);
};

exp.commonMessage = function (route, msg) {
    if (route === 'ServerMessagePush') {
        if (!!msg) {
            if (typeof (msg) == 'string') msg = CryptoUtil.decrypt(msg);
            if (!!msg.pushRouter) {
                if (msg.pushRouter == 'SelfEntryRoomPush') {
                    // console.log('SelfEntryRoomPush', msg);
                    UserModel.setDatas(msg);
                } else if (msg.pushRouter === 'KickUserPush') {
                    this.isKickUser = true;
                    NetworkLogic.disconnect(false);
                    AssetsManager.popDialog({
                        content: "您账号已在其他地方登录!!!请重新登录或修改密码!",
                        ok: () => {
                            UserModel.release(true);
                        }
                    });
                } else if (msg.pushRouter === 'PopDialogContentPush') {
                    if (!!Codes[msg.code]) {
                        AssetsManager.tipDialog(Codes[msg.code]);
                    } else if (!!msg.content) {
                        AssetsManager.tipDialog(msg.content);
                    } else {
                        AssetsManager.tipDialog('错误码：' + msg.code);
                    }
                } else if (msg.pushRouter === 'UpdateUserInfoPush') {
                    // console.log("UpdateUserInfoPush:", msg);
                    UserModel.setDatas(msg);
                } else if (msg.pushRouter === 'gameInvitation') {
                    let gameInvite = CacheManager.getItem('gameInvite');
                    if (!UserModel.isInRoom() && parseInt(gameInvite) == 1) {
                        AssetsManager.inviteDialog({
                            msg: msg,
                        })
                    }
                }
                let pushRouter = msg.pushRouter;
                msg.pushRouter = null; //清除msg.pushRouter
                this.emitMessage(pushRouter, msg);
            }
        }
    } else if (route === 'ServerDisconnection') {
        // 检测是否是系统主动断开连接
        if (!!this.isKickUser) return;//被踢了不走下面逻辑
        NetworkLogic.setManualCloseConnection(false);
        if (msg.code === 1000 || msg.code === 1006) {
            AssetsManager.popDialog({
                content: "与服务器断开连接，请稍候再试~",
                ok: () => {
                    UserModel.release();
                }
            });
            return;
        }
        LoginManager.quick(null, false, (err) => {
            if (!!err) {
                cc.game.restart();
                return;
            }
        });
    } else if (route === 'ReconnectSuccess') {
        // console.log('测试-重连成功-7');
        this.isKickUser = false;
    }
}

//老版本断线重连 
// 检测是否是系统主动断开连接 放在ServerDisconnection下
// if (msg.code === 1000 && !NetworkLogic.isManualCloseConnection()) {
//     AssetsManager.popDialog({
//         content: "服务器主动断开连接，请稍后登录！",
//         ok: () => {
//             UserModel.release();
//         }
//     });
// } else if (!NetworkLogic.isManualCloseConnection()) {
//     // 如果不是手动断开则执行断线重连
//     // console.log("不是主动断开-测试");
//     setTimeout(() => {
//         NetworkLogic.reconnection((res) => {
//             if (!res || res.code !== 0) {
//                 AssetsManager.popDialog({
//                     content: "与服务器断开连接，请重新登录!",
//                     ok: () => {
//                         UserModel.release();
//                     }
//                 });
//             } else {
//                 NetworkLogic.setManualCloseConnection(false);
//             }
//         });
//     }, 2000);
// } else {
//     NetworkLogic.setManualCloseConnection(false);
// }