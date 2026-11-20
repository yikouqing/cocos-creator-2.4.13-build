const SubManager = require('../../utils/SubManager');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        togsContent: cc.Node,
        itemContent: cc.Node,

        _showType: null,
        _isUnion: false,
        _update: null,
        _hallsSync: null,
        _calssify: 0,
        _gameType: 0,
    },

    onLoad() {
        cc.systemEvent.on('OnGameCheck', this._onCheck, this);
        this._isUnion = !!this.node.nodeParams ? this.node.nodeParams.isUnion : null;
        this._cb = !!this.node.nodeParams ? this.node.nodeParams.cb : null;
        this._update = !!this.node.nodeParams ? this.node.nodeParams.update : null;
        this._hallsSync = !!this.node.nodeParams ? this.node.nodeParams.hallsSync : null;
        this._gameType = !!this.node.nodeParams ? this.node.nodeParams.selected : null;
        this._showType = !!this.node.nodeParams ? this.node.nodeParams.showType : null;
    },

    start() {
        this.classes();
        this.lists();
    },

    lists() {
        let bundles = ConfigModel.getBundles();
        this.itemContent.removeAllChildren();
        AssetsManager.loadAsset({
            path: 'res/prefab/main/room/GameListItem',
            aType: cc.Prefab,
            bundle: ConfigModel.getSkin()
        }, (asset) => {
            if (!asset || !cc.isValid(this.node)) return;
            this.itemContent.destroyAllChildren();
            bundles.forEach(bundle => {
                let game = ConfigModel.getBundleConfig(bundle);
                if (game &&
                    (game.classify === this._calssify ||
                        this._calssify === 0) &&
                    !!ConfigModel.canCreate(game.type)) {
                    let node = cc.instantiate(asset);
                    node.attr({
                        nodeParams: {
                            game: game,
                            showType: this._showType,
                            selected: this._gameType
                        }
                    });
                    this.itemContent.addChild(node);
                }
            });
        })
    },

    /**初始化分类按钮 */
    classes() {
        let classes = ConfigModel.getGameClasses();
        this.togsContent.destroyAllChildren();
        AssetsManager.loadAsset({
            path: 'res/prefab/main/room/GameTypeTog',
            aType: cc.Prefab,
            bundle: ConfigModel.getSkin()
        }, (item) => {
            if (!item || !cc.isValid(this.node)) return;
            this.togsContent.destroyAllChildren();
            classes.forEach((game) => {
                let node = cc.instantiate(item);
                node.attr({
                    nodeParams: {
                        type: game,
                        classify: this._calssify,
                        click: this.gameClick.bind(this)
                    }
                }); //设置初始化参数
                this.togsContent.addChild(node);
                node.getComponent("GameTypeTog").classify();
            })
        });
    },

    _onCheck(type) {
        this._gameType = type;
    },

    /**游戏分类选择 */
    gameClick(type) {
        this._calssify = type;
        this.lists();
    },

    onCloseClick() {
        this._update && this._update();
        this._hallsSync && this._hallsSync();
        this._cb && this._cb(this._gameType);
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    onDestroy() {
        cc.systemEvent.off('OnGameCheck', this._onCheck, this);
    }

});