const CCUtil = require('../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {},

    // LIFE-CYCLE CALLBACKS:

    onLoad() { },

    resetInEditor() {
        // cc.log("资源路径", Editor.assetdb)
        CCUtil.nodeRecursive(this.node, (node) => {
            // if (node.name == "Background" || node.name == "checkmark" || node.name == "BACKGROUND_SPRITE") {
            //     let url = `anhei/ext/img/newroomcreate/${sp.spriteFrame.name}.png`

            //     let name = sp.spriteFrame.name
            //     this.loadRes(url).then(res => {
            //         res.name = name
            //         let t = new cc.SpriteFrame(res)
            //         t.name = name
            //         cc.log("加载成功", t.name)
            //         // sp.spriteFrame = t
            //     })
            // } else 
            // let sp = node.getComponent(cc.Sprite)
            // if (sp && sp.spriteFrame && sp.spriteFrame.name == ("editbg")) {
            //     cc.log("图片路径==", sp.spriteFrame.name, node.name, node.parent.name, node.parent.parent.name)
            // }
            let label = node.getComponent(cc.Label)
            if (label) {
                //dlback #F1DB8F #A79371 36
                //dlbunny #555555 #125734 36
                //dlby #824F3F 36
                //dlchun #8F4415 #BF0D03 36
                //dlgreen #6E4222 40
                //dllanse #9F6D3C 36
                //dlmoyin #4F608D 36
                //dlpanda #597EC2 #7B96DE 36
                //dlqingxin #7B5B50 36
                //dlred #8F4415 #BF0D03 36
                //dlsea #4F608D  #335ABB 36
                //dlwhite #222020 36
                //dlwinered #FED058 36
                //dlwoods #7B5B50 36
                /**修改创建房间的文字颜色 */
                if (node.name == "title") {
                    node.color = cc.color("#7B5B50")
                    // label.fontSize = 36
                    // label.lineHeight = 36
                    // cc.log(`title ${label.string}，更换颜色成功`)
                } else {
                    node.color = cc.color("#7B5B50")
                    // label.fontSize = 36
                    // label.lineHeight = 36
                    // cc.log(`${label.string}，更换颜色成功`)   
                }

                /**修改游戏界面的输赢分数 */
                // if (node.name == "winscore") {
                //     label.string = ""
                //     label.fontSize = 32
                //     label.spacingX = -5
                //     node.scale = 1
                // } else if (node.name == "losescore") {
                //     label.string = ""
                //     label.fontSize = 52
                //     label.spacingX = -5
                //     node.scale = 1
                // }
            }
        })
    },

    loadRes(url) {
        return new Promise((resolve, reject) => {
            if (!CC_EDITOR) {
                resolve(null);
                return;
            }
            Editor.assetdb.queryUuidByUrl(`db://assets/${url}`, (error, uuid) => {
                if (error || !uuid) {
                    resolve(null);
                    cc.warn(`[EditorTool.load] uuid查询失败 url: ${url}`);
                    return;
                }
                // var tt = Editor.assetdb.uuidToUrl(uuid)
                // cc.log("资源路径", tt)
                //@ts-ignore
                cc.resources.load({
                    type: "uuid",
                    uuid: uuid
                }, (error, result) => {
                    if (error || !result) {
                        resolve(null);
                        cc.warn(`[EditorTool.load] 资源加载失败 url: ${url}`);
                        return;
                    }
                    resolve(result);
                });
            });
        });
    },
});