const AssetsManager = require('../../utils/AssetsManager');
const ApiHall = require('../../api/ApiHall');
const Utils = require('../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        title: cc.Label,
        time: cc.Label,
        readBtnNode: cc.Node,
        alreadyReadNode: cc.Node
    },

    onBtnClk(event, param) {
        switch (param) {
            case 'read':
                AssetsManager.createDialog({
                    path: 'prefab/notice/NoticeDetailDialog',
                    data: this.data
                });
                if (!this.data.isRead) {
                    ApiHall.readEmailRequest({ emailID: this.data.id });
                    this.readBtnNode.active = false;
                    this.alreadyReadNode.active = true;
                    this.data.isRead = true;
                }
                break;
        }
    },

    updateUI(data) {
        this.data = data;

        this.title.string = data.title;
        if (data.title.length > 7) {
            this.title.string = data.title.substr(0, 12) + '...';
        }
        let date = Utils.getDateFormat(data.createTime);
        this.time.string = date.yyyymmdd;

        if (!!data.isRead) {
            this.readBtnNode.active = false;
            this.alreadyReadNode.active = true;
        } else {
            this.readBtnNode.active = true;
            this.alreadyReadNode.active = false;
        }
    }
});