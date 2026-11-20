const ConfigModel = require('../../model/ConfigModel');
const AssetsManager = require('../../utils/AssetsManager');
const SubManager = require('../../utils/SubManager');
const Enums = require('../../const/Enums');
const Configs = require('../../const/Configs');
const CCUtil = require('../../utils/CCUtil');
const MessageCallback = require('../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        ruleTog: cc.Prefab,
        togList: cc.Node,
        ruleScrollView: cc.ScrollView,
        ruleContext: cc.Label,
        _type: -1,
        _game: null,
    },

    start() {
        MessageCallback.emitMessage("BroadcastVisibleSync", false);
        this._type = !!this.node.nodeParams ? this.node.nodeParams.type : -1;
        let list = [];
        if (!this._type || this._type == -1) {
            list = ConfigModel.getBundles();
            this._type = SubManager.getDefaultType();
            this._game = ConfigModel.getBundleConfig(this._type);
        } else {
            list.push(this._type);
            this._game = ConfigModel.getBundleConfig(this._type);
        }
        this.init(list);
    },

    init(list) {
        list.forEach(bundle => {
            let item = ConfigModel.getBundleConfig(bundle);
            if (!!ConfigModel.canCreate(item.type)) {
                let node = cc.instantiate(this.ruleTog);
                node.attr({
                    nodeParams: {
                        game: item,
                        check: this._game,
                        comp: this
                    }
                }); //设置初始化参数
                node.parent = this.togList;
            }
        });
    },

    loadRule(data) {
        this.ruleScrollView.scrollToTop(0.1);
        this.ruleContext.string = '';
        this.ruleContext.node.attr({
            lastGameRule: data
        });
        this._game = data;
        AssetsManager.loadAsset({
            path: `json/rules/rule${this._game.type}`,
            aType: cc.JsonAsset
        }, (res) => {
            if (!res) return;
            if (!this.ruleContext.node.lastGameRule || this.ruleContext.node.lastGameRule.type != this._game.type) return;
            // console.log('规则', res.json.context)
            this.ruleContext.string = res.json.context;
        })
    },

    onClick() {
        MessageCallback.emitMessage("BroadcastVisibleSync", true);
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

});