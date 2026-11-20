const ConfigModel = require('../model/ConfigModel');
const ABManager = require('../utils/ABManager');
const AudioUtil = require('./AudioUtil');
const Enums = require('../const/Enums');
const Events = require('../const/Events');
const MessageCallback = require('../utils/MessageCallback');
const NativeUtil = require('../utils/NativeUtil');

var exp = module.exports;

exp.init = function (root) {
    this.root = root;
    this.dialogs = [];
    this.loadAsset({
        path: 'prefab/inter/Speaker',
        aType: cc.Prefab,
    }, (asset) => {
        if (!asset) return;
        if (!!this.speaker) return;
        this.speaker = asset;
    });
    this.loadAsset({
        path: 'prefab/inter/HoldDialog',
        aType: cc.Prefab
    });
};

/**
 * 播放背景音乐
 * @param {*} data 
 */
exp.playMusic = function (data) {
    AudioUtil.stopAll();
    data.aType = cc.AudioClip;
    this.loadAsset(data, (clip) => {
        if (!clip) return;
        AudioUtil.playMusic(clip, data.loop);
    })
}

/**
 * 播放音效
 * @param {*} data 
 */
exp.playEffect = function (data) {
    data.aType = cc.AudioClip;
    this.loadAsset(data, (clip) => {
        if (!clip) return;
        let id = AudioUtil.playEffect(clip, data.loop);
        data.idcb && data.idcb(id); //设置ID回调
        if (!data.finish || !id) return;
        cc.audioEngine.setFinishCallback(id, data.finish); //设置播放结束回调
    });
}

/**
 * 通用按钮音效
 */
exp.onClick = function (type) {
    let data = {};
    let audio = ConfigModel.getOnClick(type);
    data.path = `audio/common/${audio}`;
    data.aType = cc.AudioClip;
    this.loadAsset(data, (clip) => {
        if (!clip) return;
        AudioUtil.playEffect(clip);
    });
}

/**
 * 创建页面 prefab
 * @param {} data 
 */
exp.createDialog = function (data) {
    //如果存在 clear 则关闭所有弹窗
    if (!!this.dialogs && !!data.clear) {
        this.release();
    }
    if (!!this.checkDialog(data.path)) return;
    data.aType = cc.Prefab;
    let root = !!data.parent ? data.parent : this.root;
    this.loadAsset(data, (asset) => {
        if (!asset ||
            !root ||
            !cc.isValid(root) ||
            this.checkDialog(data.path)) return;
        let node = cc.instantiate(asset);
        node.attr({
            nodeParams: data
        }); //设置初始化参数
        this.dialogs = this.dialogs || [];
        this.pushDialog({
            path: data.path,
            node: node,
            name: node.name
        });
        root.addChild(node);
        data.done && data.done(node);
    });
}

exp.destroyDialog = function (data) {
    if (!this.dialogs) return;
    for (let index = 0; index < this.dialogs.length; index++) {
        if (this.dialogs[index].path == data.path || this.dialogs[index].name == data.name) {
            let node = this.dialogs[index].node;
            if (!!node && cc.isValid(node)) {
                this.dialogs.splice(index, 1); //删除对象记录
                if (!node.getComponent('DialogWidgetCtrl')) node.destroy();//如果弹窗上没有挂载DialogWidgetCtrl控制组件需要单独处理
                break;
            }
        }
    }
}

exp.clearDialog = function (dialogs) {
    MessageCallback.emitMessage(Events.clientEvents.onDialogRelease, dialogs);
    dialogs = dialogs || [];
    dialogs.forEach(dialog => {
        this.destroyDialog({
            name: dialog
        })
    });
}

/**
 * 加载单个资源
 */
exp.loadAsset = function (data, callback) {
    let bundle = ABManager.getBundleByType(data.bundle);
    if (!bundle) return;
    if (!data.aType) return;
    bundle.load(data.path, data.aType, (error, assets) => {
        callback && callback(!!error ? null : assets)
    });
}

/**加载文件夹资源 */
exp.loadAssetDir = function (data, callback) {
    let bundle = ABManager.getBundleByType(data.bundle);
    if (!bundle) {
        this.tipDialog('请先加载资源包！');
        return;
    }
    if (!data.aType) {
        this.tipDialog('资源类型未定义！');
        return;
    }
    bundle.loadDir(data.path, data.aType, (error, assets) => {
        callback && callback(!!error ? null : assets)
    });
}

/**
 * 公共弹窗
 * @param {} data 
 */
exp.popDialog = function (data) {
    data.path = 'res/prefab/main/public/PopDialog';
    data.bundle = ConfigModel.getSkin();
    data.aType = cc.Prefab;
    this.createDialog(data);
}

exp.holdDialog = function (data) {
    data = data || {};
    data.path = 'prefab/inter/HoldDialog';
    data.aType = cc.Prefab;
    this.loadAsset(data, (asset) => {
        if (!asset ||
            !this.root ||
            !cc.isValid(this.root)) return;
        if (this.checkDialog(data.path)) {
            let dialog = this.getDialog(data.path);
            if (!dialog) return;
            dialog.getComponent('HoldDialog') &&
                dialog.getComponent('HoldDialog').init(data);
        } else {
            let node = cc.instantiate(asset);
            this.dialogs = this.dialogs || [];
            this.pushDialog({
                path: data.path,
                node: node,
                name: node.name
            });
            this.root.addChild(node);
            node.getComponent('HoldDialog') &&
                node.getComponent('HoldDialog').init(data);
        }
    });
}

/**添加观战页面 */
exp.standDialog = function (data) {
    data = data || {};
    data.path = 'res/prefab/main/public/GameLookOnListDialog';
    data.bundle = ConfigModel.getSkin();
    data.aType = cc.Prefab;
    this.createDialog(data);
}

/**
 * 冒泡
 * @param {*} content 
 */
exp.tipDialog = function (content) {
    let data = {};
    data.path = 'prefab/inter/TipDialog';
    data.content = content;
    data.aType = cc.Prefab;
    this.loadAsset(data, (asset) => {
        if (!asset ||
            !this.root ||
            !cc.isValid(this.root)) return;
        let node = cc.instantiate(asset);
        node.attr({
            nodeParams: data
        }); //设置初始化参数
        this.root.addChild(node);
    });
}

/**
 * 检测弹窗 避免重复弹窗 存在且 isvalid 为重复
 * @param {} path 
 */
exp.checkDialog = function (path) {
    let isExist = false;
    let dialog = this.dialogs.find((item) => {
        return item.path == path;
    })
    isExist = !!dialog && !!dialog.node && !!cc.isValid(dialog.node);
    return isExist;
}

/**
 * 获取vilid节点
 * @param {*} name 
 * @returns 
 */
exp.getDialog = function (path) {
    let node = null;
    for (const dialog of this.dialogs) {
        if (dialog.path == path &&
            !!dialog.node &&
            cc.isValid(dialog.node)) {
            node = dialog.node;
            break;
        }
    }
    return node;
}

exp.getRoot = function () {
    return this.root;
};

exp.getAsset = function (key) {
    return this[key];
}

/**
 * 释放代码加载的资源
 */
exp.release = function () {
    const dialogs = this.dialogs;
    this.dialogs = [];
    for (const dialog of dialogs) {
        if (!!dialog.node && cc.isValid(dialog.node)) {
            dialog.node.destroy();
        }
    }
}

/**
 * 管理弹窗
 * @param {添加弹窗} dialog 
 * @returns 
 */
exp.pushDialog = function (dialog) {
    let isExist = false;
    for (let index = 0; index < this.dialogs.length; index++) {
        if (this.dialogs[index].path == dialog.path) {
            this.dialogs[index].node = dialog.node;
            isExist = true;
            break;
        }
    }
    if (isExist) return;
    this.dialogs.push(dialog);
}

/**
 * 创建精灵节点 node
 * @param {*} data 
 * @returns 
 */
exp.createSpriteNode = function (data) {
    let node = new cc.Node();
    let sprite = node.addComponent(cc.Sprite);
    sprite.spriteFrame = new cc.SpriteFrame();
    if (!!data.width && !!data.height) {
        sprite.trim = false;
        sprite.type = cc.Sprite.Type.SIMPLE;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        node.width = data.width;
        node.height = data.height;
    }
    data.sprite = sprite;
    this.loadSpriteFrame(data);
    return node;
};

/**
 * 加载精灵图片
 * @param {*} data 
 * @returns 
 */
exp.loadSpriteFrame = function (data, cb) {
    if (!data.sprite || !cc.isValid(data.sprite)) return;
    data.path = data.path || '';
    if (data.path.indexOf('/uploadcache/') != -1) data.path = `${ConfigModel.getUrl('ftps')}${data.path}`;
    if (data.sprite.node.last_exc_path == data.path && data.path.length > 0 && !!data.sprite.spriteFrame) {
        cb && cb();
        return;
    }
    if (!!data.sprite.node.last_exc_path) data.sprite.spriteFrame = null;
    data.sprite.node.attr({
        last_exc_path: data.path
    });
    if (data.path.indexOf('http') != -1) {
        if (cc.sys.isBrowser) return;
        cc.assetManager.loadRemote(data.path, {
            ext: ".png"
        }, (error, texture) => {
            if (!!error && !!data.sprite && !!data.sprite.node && data.sprite.node.last_exc_path == data.path) data.sprite.spriteFrame = null;
            if (!!error || !cc.isValid(data.sprite)) return;
            if (data.path != data.sprite.node.last_exc_path) return;
            data.sprite.spriteFrame = new cc.SpriteFrame(texture);
            cb && cb();
        });
    } else {
        let bundle = ABManager.getBundleByType(data.bundle);
        // console.log('当前资源包', bundle, data.path);
        if (!bundle) return;
        bundle.load(data.path, cc.SpriteFrame, (error, spriteFrame) => {
            if (!!error && !!data.sprite && !!data.sprite.node && data.sprite.node.last_exc_path == data.path) data.sprite.spriteFrame = null;
            if (!!error || !cc.isValid(data.sprite)) return;
            if (data.path != data.sprite.node.last_exc_path) return;
            data.sprite.spriteFrame = spriteFrame;
            cb && cb();
        });
    }
};

/**
 * 互动动画
 * @param {} data 
 * @returns 
 */
exp.addGift = function (data) {
    let prop = ConfigModel.getGiftConfig(data.id);
    // console.log('资源查找', data.reciever, data.sender);
    if (!prop || !data.reciever || !data.sender) return;
    data.path = prop.asset;
    data.aType = cc.Prefab;
    this.loadAsset(data, (item) => {
        if (!item || !cc.isValid(data.parent)) return;
        for (let index = 0; index < data.reciever.length; index++) {
            const reciever = data.reciever[index];
            if (!data.sender ||
                !cc.isValid(data.sender) ||
                !reciever ||
                !cc.isValid(reciever)) continue;
            const node = cc.instantiate(item);
            let chatProp = {
                id: data.id,
                sid: data.sid,
                rid: data.rids[index],
                sender: data.sender,
                reciever: reciever,
                parent: data.parent
            };
            node.attr({
                _chat_prop: chatProp
            });
            //写入数据 基于Spine的渲染和 Node 的生命周期建议这样处理
            data.parent.addChild(node);
        }
    });
}

exp.addEmotion = function (index, cb) {
    let node = new cc.Node();
    node.name = 'emotion';
    node.addComponent(cc.Sprite);
    let animation = node.addComponent(cc.Animation);
    let data = {};
    data.path = `sprite/emotion/${index}/${index}`;
    data.aType = cc.JsonAsset;
    this.loadAsset(data, (jsonAsset) => {
        if (!jsonAsset || !cc.isValid(node)) return;
        let data = jsonAsset.json;
        let count = data.count;
        let turn = data.turn;
        let time = data.time;
        let urls = [];
        for (let i = 0; i < count; ++i) {
            urls.push(`sprite/emotion/${index}/${i}`);
        }
        data.path = urls;
        data.aType = cc.SpriteFrame;
        this.loadAsset(data, (frames) => {
            if (!frames || !cc.isValid(node)) return;
            let clip = cc.AnimationClip.createWithSpriteFrames(frames, count);
            clip.name = 'emotion';
            clip.speed = 1;
            animation.addClip(clip);
            clip.wrapMode = cc.WrapMode.Loop;
            animation.play('emotion');
        });
        cc.tween(node)
            .delay(time)
            .call(() => {
                cb && cb();
                node.destroy();
            }).start();
    });
    return node;
};

exp.startDialog = function (data) {
    data = data || {};
    data.path = "res/prefab/start/StartDialog";
    data.bundle = ConfigModel.getSkin(Enums.bundleType.HALL);
    this.createDialog(data);
}

exp.ruleDialog = function (data) {
    data = data || {};
    data.path = 'res/prefab/main/rule/RuleDialog';
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

exp.chatDialog = function (data) {
    data = data || {};
    data.path = 'res/prefab/main/chat/ChatDialog';
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

exp.setDialog = function (data) {
    data = data || {};
    data.path = "res/prefab/main/setting/SettingDialog";
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

exp.headDialog = function (data) {
    data = data || {};
    data.path = "res/prefab/main/user/HeadDetail";
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

//添加搓牌
exp.rubDialog = function (data, cb) {
    data.path = 'prefab/inter/CuopaiNode';
    data.aType = cc.Prefab;
    this.loadAsset(data, (prefab) => {
        if (!prefab || !data.parent || !cc.isValid(data.parent)) return;
        let node = cc.instantiate(prefab);
        node.attr({
            nodeParams: data
        });
        node.parent = data.parent;
        cb && cb(node);
    })
}

//新搓牌
exp.newCuoPaiDialog = function (data, cb) {
    data.path = 'prefab/inter/NewCuopaiNode';
    data.aType = cc.Prefab;
    this.loadAsset(data, (prefab) => {
        if (!prefab || !data.parent || !cc.isValid(data.parent)) return;
        let node = cc.instantiate(prefab);
        node.attr({
            nodeParams: data
        });
        node.parent = data.parent;
        cb && cb(node);
    })
}

exp.disDialog = function (data) {
    data = data || {};
    data.path = 'res/prefab/main/public/DismissDialog';
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

exp.nisDialog = function (data) {
    data = data || {};
    data.path = 'res/prefab/main/public/DismissNode';
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

exp.tableDialog = function (data) {
    data = data || {};
    data.path = 'res/prefab/main/public/RuleNode';
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

exp.inviteDialog = function (data) {
    data = data || {};
    data.path = 'res/prefab/main/public/InviteDialog';
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

exp.friendDialog = function (data) {
    data = data || {};
    data.path = 'res/prefab/main/public/InviteFriend';
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

exp.locationDialog = function (data) {
    data = data || {};
    data.path = 'prefab/inter/LocationInfoDialog';
    this.createDialog(data);
}

exp.subLoadDialog = function (data) {
    data = data || {};
    data.path = 'res/prefab/main/public/BundleLoadDialog';
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

exp.skinDialog = function (data) {
    data = data || {};
    data.path = 'res/prefab/main/public/SkinDialog';
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

/**
 * 联盟团队
 * @param {*} data 
 */
exp.unionTeamDialog = function (data) {
    data = data || {};
    data.path = "res/prefab/union/partner/UnionMainMemberListDialog";
    data.bundle = ConfigModel.getSkin();
    this.createDialog(data);
}

exp.serviceDialog = function () {
    let jumpToServiceUrl = ConfigModel.getData('jumpToServiceUrl');
    if (!!jumpToServiceUrl) {
        let url = ConfigModel.getData('serviceUrl');
        url = url || '';
        if (url.length == 0) return;
        NativeUtil.openUrl(url);
        return;
    }
    this.createDialog({
        path: 'res/prefab/main/public/ServiceDialog',
        bundle: ConfigModel.getSkin()
    });
}