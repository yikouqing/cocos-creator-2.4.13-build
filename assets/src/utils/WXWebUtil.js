const CCUtil = require('./CCUtil');
const Configs = require('../const/Configs');
const JsApi_Ticket = '';
const Utils = require('./Utils');
const ConfigModel = require('../model/ConfigModel');

var exp = module.exports;
exp.wxShareText = function (params) {
    if (!cc.wx) return;
    params = params || {};
    let imgUrl = params.imgUrl;
    cc.wx.onMenuShareTimeline({
        title: params.title, // 分享标题
        link: params.link + '?state=' + params.roomID, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        imgUrl: imgUrl + '?ver=' + (new Date()).valueOf(), // 分享图标
        success: () => {
            alert('分享成功');
            params.success && params.success();
        },
        cancel: () => {
            alert('取消分享');
            params.fail && params.fail();
        },
        fail: () => {
            alert('分享失败');
            params.fail && params.fail();
        }
    });
};

//分享给朋友
exp.setShareFriend = function (params) {
    if (!cc.wx) return;
    params = params || {};
    let imgUrl = params.imgUrl;
    cc.wx.onMenuShareAppMessage({
        title: params.title, // 分享标题
        desc: params.desc, // 分享描述
        link: params.link + '?state=' + params.roomID, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        imgUrl: imgUrl + '?ver=' + (new Date()).valueOf(), // 分享图标
        type: params.type || '', // 分享类型,music、video或link，不填默认为link
        dataUrl: params.dataUrl || '', // 如果type是music或video，则要提供数据链接，默认为空
        success: () => {
            alert('分享成功');
            params.success && params.success();
        },
        cancel: () => {
            alert('取消分享');
            params.fail && params.fail();

        },
        fail: () => {
            alert('分享失败');
            params.fail && params.fail();
        }
    });
};

/**
 *
 * @param params = {
 *     debug: true or false,开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
 *     appId: 必填，公众号唯一标识
 *     timestamp： 必填，生成签名的时间戳
 *     nonceStr： 必填，生成签名的随机串
 *     signature: 必填，签名，见附录1
 *     jsApiList: api列表
 * }
 * @param callback
 */
exp.wxInit = function () { };

exp.wxLogin = function () {
    let wechat = ConfigModel.getWechat();
    // console.log("调用了微信登录")
    window.location.href = `http://gzh.bqkjqp.cn/get-weixin-code.html?appid=${wechat.wxWebId}&redirect_uri=${encodeURIComponent("http://www.bqkjqp.com")}&response_type=code&scope=snsapi_userinfo&state=bjkghjkh#wechat_redirect`
};