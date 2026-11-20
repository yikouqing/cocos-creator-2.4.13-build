cc.Class({
    extends: cc.Component,

    properties: {
        contentItems: 0, //创建列表节点数
        bindDataCallback: null, //节点绑定数据回调
        dataList: null, //数据列表
        maxHeight: 0,
        subIndex: 3, //为了解决item过大时，上划列表，item隐藏时机不对的问题
        index: 0, //当前索引
        itemSpacingY: 0, //ITEM间距
        contentBottomY: 0, //容器最底下的坐标位置
    },

    viewInit(data) {
        this.node.parent.parent.getComponent(cc.ScrollView).scrollToTop(0.1);
        let layout = this.node.getComponent(cc.Layout);
        if (layout) this.node.removeComponent(layout);
        this.node.destroyAllChildren();
        this.itemSpacingY = data.spacingY;
        this.contentItems = Math.floor(this.node.parent.height / (data.prefab.data.height + this.itemSpacingY)) + 3;
        this.maxHeight = data.prefab.data.height / 2 + this.itemSpacingY;
        if (data.prefab.data.height + data.spacingY >= this.node.parent.height / 2) this.subIndex = 1.5;
        this.contentItems = data.list.length > this.contentItems ? this.contentItems : data.list.length;
        this.bindDataCallback = data.callback;
        this.dataList = data.list;
        this.node.height = data.list.length * (data.prefab.data.height + data.spacingY);
        for (let i = 0; i < this.contentItems; i++) {
            let node = cc.instantiate(data.prefab);
            node.active = true;
            this.node.addChild(node);
            node.stopAllActions();
            let pos = cc.v2(0, -(data.prefab.data.height + this.itemSpacingY) * (i + 1) + this.maxHeight - this.itemSpacingY);
            if (data.animation) {
                if (data.animation.type == 0) { //渐变
                    node.opacity = 0;
                    node.setPosition(pos);
                    cc.tween(node).delay(i * 0.08).to(data.animation.time, {
                        opacity: 255
                    }, {
                        easing: 'expoOut'
                    }).start();
                } else if (data.animation.type == 1) { //位移+渐变
                    node.opacity = 0;
                    let startPos = cc.v2(pos.x, pos.y + data.animation.value);
                    node.setPosition(startPos);
                    cc.tween(node).delay(i * 0.08).to(data.animation.time, {
                        position: cc.v3(pos),
                        opacity: 255
                    }, {
                        easing: 'expoOut'
                    }).start();
                }
            } else {
                node.setPosition((pos));
            }
            this.bindDataCallback && this.bindDataCallback(node, data.list[i], i);
        }
        this.index = this.contentItems;
        this.contentBottomY = this.node.y;
    },

    //动态计算item的y坐标
    update(dt) {
        if (this.node.y == this.contentBottomY ||
            this.dataList == null ||
            this.dataList == undefined) {
            return;
        }
        let isDown = this.node.y > this.contentBottomY;
        for (let i = 0; i < this.node.childrenCount; i++) {
            let worldPos = this.node.convertToWorldSpaceAR(cc.v2(this.node.children[i].position));
            let pos = this.node.parent.convertToNodeSpaceAR(worldPos);
            if (isDown) {
                if (pos.y - this.maxHeight > (this.node.parent.height / 2 + this.maxHeight)) {
                    if (this.index > this.dataList.length - 1) return;
                    this.node.children[i].y = -(this.node.children[i].height + this.itemSpacingY) * (this.index + 1) + this.maxHeight - this.itemSpacingY;
                    this.bindDataCallback(this.node.children[i], this.dataList[this.index], this.index);
                    this.index++;
                }
            } else {
                if (pos.y < -(this.node.children[i].height + this.itemSpacingY) * (this.contentItems - this.subIndex) + this.maxHeight + this.itemSpacingY) {
                    if (this.index - 1 < this.contentItems) return;
                    this.node.children[i].y = (this.node.children[i].height + this.itemSpacingY) * (this.contentItems - this.index) + this.maxHeight - this.itemSpacingY;
                    this.bindDataCallback(this.node.children[i], this.dataList[this.index - this.contentItems - 1], this.index - this.contentItems - 1);
                    this.index--;
                }
            }
        }
        this.contentBottomY = this.node.y;
    },


});