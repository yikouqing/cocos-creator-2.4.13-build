const Utils = require("./Utils");
const AssetsManager = require('./AssetsManager');
const MessageCallback = require('../utils/MessageCallback');
const Codes = require('../const/Codes');
const Enums = require("../const/Enums")
const ConfigModel = require("../model/ConfigModel")

var exp = module.exports;
exp.createFrameAnimationNode = function (res, cb) {
    cc.resources.load(res + "_config", cc.JsonAsset, function (err, data) {
        if (!!err) {
            cb("load file fail");
        } else {
            data = data.json;
            let width = data["width"] || 0;
            let height = data["height"] || 0;
            let count = data["count"] || 0;
            let intervalTime = (data["intervalTime"] || 0);
            if (width <= 0 || height <= 0 || count <= 0 || intervalTime <= 0) {
                cb("animation data err");
                return;
            }
            cc.resources.load(cc.url.raw(res + '.png'), function (err, texture) {
                if (!!err) {
                    cb("load file fail");
                } else {
                    let wCount = Math.floor(texture.width / width) || 1;
                    let hCount = Math.floor(texture.height / height) || 1;

                    let node = new cc.Node();
                    let sprite = node.addComponent(cc.Sprite);
                    sprite.spriteFrame = new cc.SpriteFrame(texture, new cc.Rect(0, 64, width, height));
                    /**
                     * @param loop 是否循环，默认false
                     * @param speed 播放速度，默认1
                     * @param completeCallback，每完成一次的回调
                     */
                    node.startAnimation = function (loop, speed, completeCallback) {
                        if (!speed || speed <= 0) speed = 1;
                        intervalTime = intervalTime / speed;
                        node.stopAllActions();
                        let index = 0;

                        function callback() {
                            let curIndex = index++ % data.count;
                            let rect = new cc.Rect((curIndex % wCount) * width, Math.floor(curIndex / hCount) * height, width, height);
                            sprite.spriteFrame = new cc.SpriteFrame(texture, rect);
                            if (!!completeCallback && (curIndex === (data.count - 1))) {
                                completeCallback();
                            }
                        }
                        if (!!loop) {
                            node.runAction(cc.repeatForever(cc.sequence([cc.delayTime(intervalTime), cc.callFunc(callback)])));
                        } else {
                            node.runAction(cc.repeat(cc.sequence([cc.delayTime(intervalTime), cc.callFunc(callback)]), data.count));
                        }
                    };
                    node.stopAnimation = function () {
                        node.stopAllActions();
                    };
                    cb(null, node);
                }
            })
        }
    });
};

exp.loadRes = (dirArr, cb) => {
    let loadingCount = 0;
    for (let i = 0; i < dirArr.length; i++) {
        cc.resources.load(dirArr[i], (err) => {
            loadingCount += 1;
            if (loadingCount >= (dirArr.length)) {
                cb && cb(err);
            }
        });
    }
};

/**加载指定类型的资源 */
exp.loadTypeRes = (dirArr, type, cb) => {
    let loadingCount = 0;
    for (let i = 0; i < dirArr.length; i++) {
        cc.resources.load(dirArr[i], type, (err) => {
            loadingCount += 1;
            if (loadingCount >= (dirArr.length)) {
                cb && cb(err);
            }
        });
    }
};

// 获取单位向量
exp.getUnitVector = function (startPoint, endPoint) {
    let point = cc.v2(0, 0);
    let distance;
    distance = Math.pow((startPoint.x - endPoint.x), 2) + Math.pow((startPoint.y - endPoint.y), 2);
    distance = Math.sqrt(distance);
    if (distance === 0) return point;
    point.x = (endPoint.x - startPoint.x) / distance;
    point.y = (endPoint.y - startPoint.y) / distance;
    return point;
};

exp.getRelativePosition = function (childNode, parentNode) {
    return parentNode.convertToNodeSpace(childNode.parent.convertToWorldSpace(childNode.position));
};

//检查是不是微信浏览器
exp.isWechatBrowser = function () {
    //安卓的微信webview由qq浏览器x5内核提供技术支持，所以加BROWSER_TYPE_MOBILE_QQ
    return false;
    //return (cc.sys.browserType === cc.sys.BROWSER_TYPE_WECHAT || cc.sys.browserType === cc.sys.BROWSER_TYPE_MOBILE_QQ);
};

exp.setPageTitle = function (titleText) {
    if (!cc.sys.isBrowser) return;
    document.title = titleText;
};

exp.drawQRCode = (node, url, color = cc.Color.BLACK) => {
    if (!node.getComponent(cc.Graphics)) node.addComponent(cc.Graphics)
    let ctx = node.getComponent(cc.Graphics);
    let qrcode = new QRCode(-1, QRErrorCorrectLevel.H);
    qrcode.addData(url);
    qrcode.make();
    ctx.fillColor = color;
    //块宽高
    let tileW = node.width / qrcode.getModuleCount();
    let tileH = node.height / qrcode.getModuleCount();
    // draw in the Graphics
    for (let row = 0; row < qrcode.getModuleCount(); row++) {
        for (let col = 0; col < qrcode.getModuleCount(); col++) {
            if (qrcode.isDark(row, col)) {
                // ctx.fillColor = cc.Color.BLACK;
                let w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW));
                let h = (Math.ceil((row + 1) * tileW) - Math.floor(row * tileW));
                ctx.rect(Math.round(col * tileW), Math.round(row * tileH), w, h);
                ctx.fill();
            }
        }
    }
}

/**
 * node 传入节点
 * @param {*} node 
 * @returns 
 */
exp.capScreen = (node) => {
    if (!node || !cc.isValid(node)) return '';
    let gl = cc.game["_renderContext"];
    let texture = new cc.RenderTexture();
    let rWidth = cc.visibleRect.width,
        rHeight = cc.visibleRect.height;
    texture.initWithSize(rWidth, rHeight, gl.STENCIL_INDEX8);
    let width = texture.width;
    let height = texture.height;
    if (!cc.sys.isBrowser) {
        if (!node.getComponent(cc.Camera)) node.addComponent(cc.Camera);
        let camera = node.getComponent(cc.Camera);
        camera.cullingMask = 0xffffffff;
        camera.depth = -1;
        camera.targetTexture = texture;
        camera.render();
        let data = texture.readPixels();
        let picData = new Uint8Array(width * height * 4);
        let rowBytes = width * 4;
        for (let row = 0; row < height; row++) {
            let srow = height - 1 - row;
            let start = srow * width * 4;
            let reStart = row * width * 4;
            for (let i = 0; i < rowBytes; i++) {
                picData[reStart + i] = data[start + i];
            }
        }
        let strPngName = 'screen_capture_share.jpg';
        let fullPath = jsb.fileUtils.getWritablePath() + strPngName;
        //@ts-ignore
        jsb.saveImageData(picData, width, height, fullPath);
        return fullPath;
    } else {
        if (!node.getComponent(cc.Camera)) node.addComponent(cc.Camera);
        let camera = node.getComponent(cc.Camera);
        camera.enabled = false; //避免自动渲染
        camera.targetTexture = texture;
        camera.cullingMask = 0xffffffff;
        camera.depth = -1;
        camera.render();
        let data = texture.readPixels();
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        let rowBytes = width * 4;
        for (let row = 0; row < height; row++) {
            let srow = height - 1 - row;
            let imageData = ctx.createImageData(width, 1);
            let start = srow * width * 4;
            for (let i = 0; i < rowBytes; i++) {
                imageData.data[i] = data[start + i];
            }
            ctx.putImageData(imageData, 0, row);
        }
        let dataUrl = canvas.toDataURL("image/jpeg");
        let href = dataUrl.replace(/^data:image[^;]*/, "data:image/octet-stream");
        let a = document.createElement('a'); // 创建一个a节点插入的document
        a.href = href;
        a.download = 'screen_capture_share.jpg';
        a.click();
        a.remove();
        return href;
    }
};

// 刷新对齐
exp.updateNodeAlignment = function (node) {
    let widget = node.getComponent(cc.Widget);
    if (!!widget) {
        widget.updateAlignment();
    }
    for (let i = 0; i < node.children.length; ++i) {
        exp.updateNodeAlignment(node.children[i]);
    }
};

//获取屏幕缩放参数
exp.getScaleFitRate = function () {
    //计算适配参数
    let designFrameSize = cc.view.getDesignResolutionSize();
    let designFrameRate = designFrameSize.width / designFrameSize.height;
    let deviceFrameSize = cc.sys.isBrowser ? cc.view.getCanvasSize() : cc.view.getFrameSize();
    let deviceFrameRate = deviceFrameSize.width / deviceFrameSize.height;
    let fitRate = 1;
    if (deviceFrameSize.width >= deviceFrameSize.height && deviceFrameRate >= designFrameRate) {
        //横屏宽屏时计算宽屏比例
        fitRate = deviceFrameSize.width / (designFrameSize.width * (deviceFrameSize.height / designFrameSize.height));
    } else if (deviceFrameSize.width < deviceFrameSize.height && deviceFrameRate < designFrameRate) {
        //竖屏宽屏时计算宽屏比例
        fitRate = deviceFrameSize.height / (designFrameSize.height * (deviceFrameSize.width / designFrameSize.width));
    }
    return fitRate;
}

//Widget挂件对齐适配
exp.getFixWidget = function () {
    let deviceFrameSize = cc.sys.isBrowser ? cc.view.getCanvasSize() : cc.view.getFrameSize();
    let deviceFrameRate = deviceFrameSize.width / deviceFrameSize.height;
    let fitRate = 19 / 9;
    if (deviceFrameSize.width > deviceFrameSize.height) {
        deviceFrameRate = deviceFrameRate;
    } else {
        deviceFrameRate = 1 / deviceFrameRate;
    }
    let offset = deviceFrameRate >= fitRate ? 55 : 0;
    return offset; //纵横比
}

/**
 * 指定长度字符串截取
 * @param {*} data 
 * @param {*} max 这里指的是字符的数量（汉字需要x2）
 * @param {*} fill 填充字符
 * @returns 
 */
exp.stringClamp = function (data, max, fill = '') {
    max *= 2;
    let cData = '';
    if (typeof (data) != 'string' && typeof (data) != 'number') return '';
    let tCount = Utils.getCharCount(data);
    if (tCount < max) {
        cData = data;
    } else {
        let dArray = data.split('');
        let sArray = [];
        for (let index = 0; index < dArray.length; index++) {
            let char = dArray[index];
            sArray.push(char);
            let nData = sArray.join('');
            let nCount = Utils.getCharCount(nData);
            if (nCount >= max) {
                sArray.pop();
                break;
            }
        }
        let clamp = sArray.join('');
        cData = `${clamp}${fill}`;
    }
    return cData;
}

/**
 * 把节点转化成目标节点坐标系下的坐标
 * @param current 需要转换的节点
 * @param target 目标节点
 */
exp.postionConvert = function (current, target) {
    let worldPoint = current.convertToWorldSpaceAR(cc.v2(0, 0)); // 把节点转换成世界坐标
    return target.convertToNodeSpaceAR(worldPoint, cc.v2());
}

/**
 * 获取节点排列坐标 
 * 布局时注意父节点的锚点
 * @param {*} anchor 
 * @param {*} direction 
 * @param {*} totalCount 
 * @param {*} childSize 
 * @param {*} offset 
 * @param {*} laneCount 
 * @returns 
 */
exp.getStraightNodesPos = function (direction, totalCount, childSize, anchor, offsetRateX, offsetRateY, laneCount) {
    let perWidth = childSize.width * (1 - offsetRateX);
    let perHeight = childSize.height * (1 - offsetRateY);
    let totalRow = Math.floor(totalCount / laneCount);
    let pos = [];
    let startPos = cc.v2(0, 0);
    if (direction == 0) {
        //锚点cc.v2(0.5,0.5) 中心点散开
        let totalWidth = perWidth * (totalCount - 1);
        startPos = cc.v2(-totalWidth / 2, 0);
        for (let index = 0; index < totalCount; index++) {
            pos.push(cc.v2(startPos.x + index * perWidth, startPos.y));
        }
    } else if (direction == 1) {
        //锚点cc.v2(1,1) 从右到左
        startPos.x = anchor.x == 0.5 ? 0 : -0.5 * childSize.width;
        startPos.y = anchor.y == 0.5 ? 0 : -0.5 * childSize.height
        for (let index = 0; index < totalCount; index++) {
            let rowIndex = Math.floor(index / laneCount);
            let colIndex = Math.floor(index % laneCount);
            let laneCount = rowIndex < totalRow ? laneCount : totalCount % laneCount != 0 ? totalCount % laneCount : laneCount;
            pos.push(cc.v2(startPos.x - (laneCount - 1 - colIndex) * perWidth, startPos.y - rowIndex * perHeight));
        }
    } else if (direction == 2) {
        //锚点cc.v2(0,1) 从左到右
        startPos.x = anchor.x == 0.5 ? 0 : 0.5 * childSize.width;
        startPos.y = anchor.y == 0.5 ? 0 : -0.5 * childSize.height
        for (let index = 0; index < totalCount; index++) {
            let rowIndex = Math.floor(index / laneCount);
            let colIndex = Math.floor(index % laneCount);
            pos.push(cc.v2(startPos.x + colIndex * perWidth, startPos.y - rowIndex * perHeight));
        }
    }
    return pos;
}

/**
 * 点击间隔
 * @param {*} target 目标对象
 * @param {*} interval 间隔时间
 * @param {*} tip 是否提示
 * @returns 
 */
exp.clickInterval = function (target, interval = 2, tip = null) {
    let inInterval = false;
    if (!target) return inInterval;
    let intervalTime = target.intervalTime;
    if (intervalTime && Date.now() - intervalTime < interval * 1000) {
        if (tip) {
            if (typeof (tip) == 'string') {
                AssetsManager.tipDialog(tip);
            } else {
                AssetsManager.tipDialog('请勿频繁操作~');
            }
        }
        inInterval = true;
    } else {
        target.intervalTime = Date.now();
        inInterval = false;
    }
    return inInterval;
}

/**
 * 获取节点包围盒矩形 不含子节点
 * @param node 传入节点
 * @returns 
 */
exp.getBoundingBoxToWorldWithoutChildren = function (node) {
    let width = node.getContentSize().width;
    let height = node.getContentSize().height;
    let rect = cc.rect(
        -node.getAnchorPoint().x * width,
        -node.getAnchorPoint().y * height,
        width,
        height
    );
    node._calculWorldMatrix();
    rect.transformMat4(rect, node.getWorldMatrix(cc.mat4()));
    return rect;
}

/**
 * 矩形区域取随机点
 * @param {number} width 宽
 * @param {number} height 高
 * @returns vec2
 */
exp.getRandomPos = function (width, height) {
    let xRandom = (Math.random() * (width / 2)) * Math.pow(-1, Math.floor(Math.random() * 3));
    let yRandom = (Math.random() * (height / 2)) * Math.pow(-1, Math.floor(Math.random() * 3));
    return cc.v2(xRandom, yRandom);
}

exp.setGrayShader = function (node, gray = false) {
    if (!node || !cc.isValid(node)) return;
    node.getComponentsInChildren(cc.Sprite).forEach((sprite) => {
        let material = null;
        if (gray) {
            material = cc.Material.getBuiltinMaterial('2d-gray-sprite');
        } else {
            material = cc.Material.getBuiltinMaterial('2d-sprite');
        }
        sprite.setMaterial(0, material);
    });
    node.getComponentsInChildren(cc.Label).forEach((label) => {
        let material = null;
        if (gray) {
            material = cc.Material.getBuiltinMaterial('2d-gray-sprite');
        } else {
            material = cc.Material.getBuiltinMaterial('2d-sprite');
        }
        label.setMaterial(0, material);
    });
}

exp.getViewSize = function () {
    let view = cc.sys.isBrowser ? cc.view.getCanvasSize() : cc.view.getFrameSize();
    return view;
}

exp.positionCalculate = function (v1, v2) {
    let cal = {
        radian: 0,
        distance: 0,
        angle: 0
    }
    if (!v1 || !v2) return 0;
    let radian = Math.atan2((v2.y - v1.y), (v2.x - v1.x)); //弧度
    let distance = v2.sub(v1).mag(); //距离
    let angle = 180 * radian / Math.PI; //角度
    cal.radian = radian;
    cal.distance = distance;
    cal.angle = angle;
    return cal;
}

/**
 * 子节点递归处理
 * @param {*} node 父节点
 * @param {*} cb 回调函数
 * @param {*} thisArg 函数所属的this 
 */
exp.nodeRecursive = function (node, cb, thisArg) {
    if (node instanceof cc.Node) {
        cb && cb.call(thisArg, node);
        node.children.forEach((n) => {
            this.nodeRecursive(n, cb, thisArg);
        });
    } else if (Array.isArray(node)) {
        node.forEach((n) => {
            this.nodeRecursive(n, cb, thisArg);
        });
    }
}

/**节点点击穿透 */
exp.touchPierce = function (node, _this = null) {
    if (!node) return false;
    _this && node.targetOff(_this);
    node.on(cc.Node.EventType.TOUCH_END, () => {
        node._touchListener.setSwallowTouches(false); //2dx的设置穿透
    });
}

exp.pickImage = function (data = null) {
    data = data || {};
    let fileInput = document.getElementById("fileInput");
    let mime = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'bmp': 'image/bmp'
    };

    const baseFilter = (base64) => {
        for (const key in mime) {
            let filter = `data:${mime[key]};base64,`;
            if (base64.indexOf(filter) == -1) continue;
            base64 = base64.replace(filter, '');
        }
        return base64;
    }

    const selectFile = (evt) => {
        let file = evt.target.files[0];
        if (!file) return;
        let type = file.type;
        if (!type) type = mime[file.name.match(/\.([^\.]+)$/i)[1]];
        let reader = new FileReader();
        reader.onload = (e) => {
            let result = !!e && !!e.target && !!e.target.result ? e.target.result : '';
            let base64 = baseFilter(result);
            !!data && !!data.callback && !!data.callback('webfile', base64);
        }
        reader.readAsDataURL(file);
    }
    fileInput = document.createElement("input");
    fileInput.id = "fileInput";
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.height = "0px";
    fileInput.style.display = "block";
    fileInput.style.overflow = "hidden";
    document.body.insertBefore(fileInput, document.body.firstChild);
    fileInput.addEventListener('change', selectFile, false);
    fileInput.click()
}

/**
 * 节点是否在目标节点的包围盒范围内
 * node必须在target的节点树下
 * @param {*} node 
 * @param {*} target 
 */
exp.boundContains = function (node, target) {
    let nodePos = node.convertToWorldSpaceAR(cc.v2());
    let targetBound = target.getBoundingBoxToWorld();
    return targetBound.contains(nodePos);
}

/**
 * 节点包围盒是否相交
 * @param {*} node 
 * @param {*} target 
 * @returns 
 */
exp.boundIntersects = function (node, target) {
    let nodeBound = this.getBoundingBoxToWorldWithoutChildren(node);
    let targetBound = this.getBoundingBoxToWorldWithoutChildren(target);
    return nodeBound.intersects(targetBound);
}
/**加载Base64图片显示 */
exp.loadBase64Spr = function (base64, funs) {
    if (!base64) return false;
    let url = "data:image/png;base64," + base64;
    let img = new Image();
    img.src = url;
    let texture = new cc.Texture2D();
    texture.initWithElement(img);
    texture.handleLoadedTexture();
    if (funs) funs(new cc.SpriteFrame(texture));
}

/**
 * 获取当前逻辑场景的名字
 * @returns 
 */
exp.getSceneName = function () {
    let scene = cc.director.getScene();
    return scene.name;
}

/**
 * 获取Canvas的设计分辨率
 * @returns 
 */
exp.getDesignSize = function () {
    let designSize = cc.view.getDesignResolutionSize();
    return designSize;
}

/**
 * 获取屏幕的拉伸比例
 * @returns 
 */
exp.getViewScale = function () {
    let visibleSize = cc.view.getVisibleSize();
    let visibleWidth = visibleSize.width;
    let visibleHeight = visibleSize.height;
    let visibleRate = visibleWidth / visibleHeight;
    let designSize = cc.view.getDesignResolutionSize();
    let designWidth = designSize.width;
    let designHeight = designSize.height;
    let designRate = designWidth / designHeight;
    let viewScale = {
        type: 0, //无拉伸,1-横向,2-纵向
        scaleX: 1,
        scaleY: 1
    }
    if (visibleRate > designRate) {
        //横向拉伸
        viewScale.type = 1;
        viewScale.scaleX = visibleRate / designRate;
    } else if (visibleRate < designRate) {
        //纵向拉伸
        viewScale.type = 2;
        viewScale.scaleX = designRate / visibleRate;
    }

    return viewScale;
}

/**
 * 获取手牌动态缩放比例
 * @param {number} cardCount 手牌数量，不同数量不同缩放比例
 * @param {number} bundleClass 类型对应bundleClass,默认麻将
 * @returns 
 */
exp.getHandCardScale = function (cardCount, bundleClass = 2) {
    let designFrameSize = cc.view.getDesignResolutionSize();
    let scale = cc.winSize.width / designFrameSize.width;
    let defaultMin = 1.3;
    let defaultMax = 1.5;
    let defaultAdd = 0.3;

    if (bundleClass == 2) {
        //麻将
        if (cardCount == 16) {
            defaultMin = 1.1;
            defaultMax = 1.2;
            defaultAdd = 0.1;
        }
    }

    scale += defaultAdd
    // console.log("scale======", scale)
    if (scale < defaultMin) return defaultMin;
    if (scale > defaultMax) return defaultMax;
    return scale;
}

/**
 * 游戏聊天
 * @param {object} data 聊天数据和用户数据
 * @param {cc.Node} labelNode 聊天文本节点
 * @param {cc.Node} headImgNode 头像图片节点
 * @param {cc.Node} headRoot 头像根节点
 * @returns 
 */
exp.gameChat = function (data, labelNode, headImgNode, headRoot) {
    let user = data.user
    let node = labelNode.parent
    if (cc.find('emotion', node)) {
        cc.find('emotion', node).destroy();
    }
    let labelCom = labelNode.getComponent(cc.Label)
    if (data.type == Enums.chatType.EMOJI) {
        node.active = false;
        let emotionNode = AssetsManager.addEmotion(data.msg);
        let emotion = headRoot.getChildByName("emotionRoot")
        if (!cc.isValid(emotion)) {
            emotion = new cc.Node("emotionRoot")
            let pos = this.postionConvert(headImgNode, headRoot);
            emotion.parent = headRoot
            emotion.setPosition(pos);
        }
        emotion.active = true
        emotion.destroyAllChildren()
        emotionNode.parent = emotion;
        emotionNode.setPosition(0, 0);
        emotionNode.scale = 2;
    } else if (data.type == Enums.chatType.SYSTEM) {
        AssetsManager.playEffect({
            path: ConfigModel.getChatTextAudio(user.userInfo.sex, data.msg)
        });
        labelCom.string = ConfigModel.getChatTextConfigById(data.msg);
    } else if (data.type == Enums.chatType.TEXT) {
        labelCom.string = data.msg
    } else if (data.type == Enums.chatType.VOICE) {
        //实时语音
        NativeUtil.gvDownloadAndPlayVoice(data.msg);
        let speakerNode = headRoot.getChildByName("speaker")
        if (!cc.isValid(speakerNode)) {
            speakerNode = new cc.Node("speaker");
            let pos = this.postionConvert(headImgNode, headRoot);
            headRoot.addChild(speakerNode);
            speakerNode.setPosition(pos);
        }
        let item = AssetsManager.getAsset('speaker');
        if (!item) return;
        if (!!speakerNode) speakerNode.destroyAllChildren();
        let speaker = cc.instantiate(item);
        speakerNode.addChild(speaker);
        cc.tween(speaker)
            .delay(3)
            .removeSelf()
            .start();
    }
    if (data.type == Enums.chatType.TEXT || data.type == Enums.chatType.SYSTEM) {
        labelNode.active = true;
        labelCom._forceUpdateRenderData();
        node.width = labelNode.width + 50;
        node.height = 58;
        node.active = true;
        node.stopAllActions();
        cc.tween(node).delay(2).call(() => {
            node.active = false
        }).start()
    }
}