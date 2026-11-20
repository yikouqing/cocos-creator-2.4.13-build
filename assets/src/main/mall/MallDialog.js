const AssetsManager = require('../../utils/AssetsManager');
const ApiHall = require('../../api/ApiHall');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        roleNode: cc.Node,
        itemListNode: cc.Node,
        itemPrefab: cc.Prefab,
        recordListNode: cc.Node,
        recordPrefab: cc.Prefab,

        _malls: null
    },

    start() {
        if (this.roleNode) {
            this.roleNode.stopAllActions();
            this.roleNode.opacity = 0;
            this.roleShowPos = this.roleNode.getPosition();
            let hidePos = cc.v2(this.roleShowPos.x - this.roleNode.width, this.roleShowPos.y);
            this.roleNode.setPosition(hidePos);
            cc.tween(this.roleNode)
                .to(0.3, {
                    opacity: 255,
                    position: this.roleShowPos
                })
                .call(() => {
                    this.showType(0);
                })
                .start();
        } else {
            this.showType(0);
        }
    },

    showType(type) {
        this.recordListNode.active = type == 1;
        this.itemListNode.active = type == 0;
        if (type == 1) {
            this._startIndex = 0;
            this._perCount = 10;
            this._maxCount = 10;
            this.updateList();
        } else {
            this.init();
        }
    },

    init() {
        this.content = this.itemListNode.getComponent(cc.ScrollView).content;
        this.content.removeAllChildren();
        ApiHall.getRechargeRequest((res) => {
            // console.log('充值', res);
            if (res.code != 0 || !res.msg || !res.msg.recordArr) {
                AssetsManager.tipDialog('暂无商品数据');
                return;
            }
            let recordArr = res.msg.recordArr || [];
            if (!this.itemPrefab || !cc.isValid(this.node)) return;
            for (let index = 0; index < recordArr.length; index++) {
                let iItem = recordArr[index];
                let node = cc.instantiate(this.itemPrefab);
                node.parent = this.content;
                iItem.rIndex = index;
                node.getComponent('MallItem') && node.getComponent('MallItem').bind(iItem);
                node.stopAllActions();
                node.opacity = 0;
                cc.tween(node)
                    .to(0.2, {
                        opacity: 255
                    })
                    .start();
            }
        })
    },

    buttonClicks(event, params) {
        switch (params) {
            case 'close':
                this.node.destroy();
                break;
            case 'record':
                AssetsManager.createDialog({
                    path: 'res/prefab/main/mall/PayRecordDialog',
                    bundle: ConfigModel.getSkin(),
                });
                break;
            case "tog_mail":
                this.showType(0);
                break;
            case "tog_record":
                this.showType(1);
                break;
            default:
                break;
        }
    },


    onScrollEvent(target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                this.updateList();
                break;
        }
    },


    updateList() {
        this.content = this.recordListNode.getComponent(cc.ScrollView).content;
        this.content.removeAllChildren();
        if (this._startIndex >= this._maxCount) return;
        let startIndex = this._startIndex;
        let reqData = {
            startIndex: startIndex,
            count: this._perCount,
        };
        ApiHall.getRechargeRecordRequest(reqData, (res) => {
            if (startIndex != this._startIndex) return;
            let recordArr = res.msg.recordArr;
            this._maxCount = res.msg.totalCount;
            if (recordArr.length > 0) {
                this._startIndex += recordArr.length;
                if (!this.recordPrefab || !cc.isValid(this.content)) return;
                for (let index = 0; index < recordArr.length; index++) {
                    let iItem = recordArr[index];
                    let node = cc.instantiate(this.recordPrefab);
                    node.parent = this.content;
                    iItem.rIndex = index;
                    node.getComponent('PayRecordItem') && node.getComponent('PayRecordItem').bind(iItem);
                }
            }
        });
    },


});