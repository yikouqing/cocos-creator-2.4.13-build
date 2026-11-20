const AssetsManager = require('../../../utils/AssetsManager')
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        emptyNode: cc.Node,
        recordItem: cc.Prefab,
        pageLabel: cc.Label,

        _curIndex: 0,
        _maxIndex: 0,
        _perCount: 6
    },

    start() {
        this.unionID = this.node.nodeParams.unionInfo.unionID;
        this.uid = this.node.nodeParams.uid;
        this._perCount = 6;
        this.loadList();
    },

    loadList() {
        this.content.removeAllChildren();
        this.emptyNode.active = false;
        let reqData = {
            unionID: this.unionID,
            startIndex: this._curIndex * this._perCount,
            uid: this.uid,
            count: this._perCount
        };
        ApiHall.getTeamDrawDetailListRequest(reqData, (res) => {
            if (!cc.isValid(this.node)) return;
            // console.log('团队详情', res.msg);
            this.content.removeAllChildren();
            let recordArr = res.msg.recordArr;
            this.emptyNode.active = recordArr.length == 0;
            if (res.msg.recordCount % this._perCount === 0) {
                this._maxIndex = Math.floor(res.msg.recordCount / this._perCount);
            } else {
                this._maxIndex = Math.floor(res.msg.recordCount / this._perCount) + 1;
            }
            if (this._maxIndex > 0) {
                this.pageLabel.string = (this._curIndex + 1) + "/" + this._maxIndex;
            } else {
                this.pageLabel.string = '0/0';
            }
            this.content.removeAllChildren();
            // console.log('查看-团队统计', this._curIndex, this._maxIndex)
            for (let i = 0; i < recordArr.length; i++) {
                let record = recordArr[i];
                let item = cc.instantiate(this.recordItem);
                let ctrl = item.getComponent("UnionTeamMemberListItem");
                item.parent = this.content;
                ctrl && ctrl.initWidget(record);
            }
        });
    },

    onBtnClick(event, param) {

        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'left':
                if (this._curIndex === 0) return;
                this._curIndex--;
                this.loadList();
                break;
            case 'right':
                if (this._curIndex >= this._maxIndex - 1) return;
                this._curIndex++;
                this.loadList();
                break;
        }
    }
});