const AssetsManager = require('../../utils/AssetsManager');
const MessageCallback = require('../../utils/MessageCallback');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
	extends: cc.Component,

	properties: {

		cardsNode: cc.Node,
		peekNode: cc.Node,
		mask: cc.Mask,
		cardBackBg: cc.Node,
		cardBack: cc.Node,
		cardFaceBg: cc.Node,
		cardFaceType: cc.Sprite,
		shadowMask: cc.Mask,
		shadow: cc.Node,
		finger1: cc.Node,
		finger2: cc.Node,
		opTips: cc.Label,
		cardSize: cc.Size,
		cardNumber1: cc.Sprite,
		cardNumberType1: cc.Sprite,
		cardNumber2: cc.Sprite,
		cardNumberType2: cc.Sprite,

		_originalDirType: 1,
		_dirType: 1,
		_directionLength: 5,
		_moveSpeed: 0.5,
		_angleFixed: 10,
		_isOpenCard: false, //是否已经开牌 开牌后禁止一切触摸事件
		_isMoveStart: false,
		_tStartPos: cc.Vec2, //触摸开始点
		_tMoveVec: cc.Vec2, //触摸移动向量
		_rotation: 0,
		_inFingers: [],
		_cb: null,
		_card: 0,
		_type: 0,
		_val: 0,
		_cards: null,
		_cardsLength: 0,
	},

	onLoad() {
		this.cardsNode.active = false;
		// this.peekNode.scale = 0;
		// this.peekNode.opacity = 0;
		this.opTips.string = '';
		MessageCallback.addListener('UpdateGameCardBg', this);
		this.updateCardsBgSprite();
	},

	_init() {
		if (!this.node.nodeParams) return;
		let data = this.node.nodeParams;
		if (!!data.cards) {
			this._cards = data.cards;
			// console.log('CARDS-LIST', data.cards);
			this._cardsLength = data.cards.length;
			// for (let index = 0; index < this._cardsLength; index++) {
			// 	this.cardsNode.children[index].getComponent(cc.Sprite).spriteFrame = null;
			// 	if (index == this._cardsLength - 1) {
			// 		this.cardsNode.children[index].active = false;
			// 		AssetsManager.loadSpriteFrame({
			// 			path: ConfigModel.getCardUrl(),
			// 			sprite: this.cardsNode.children[index].getComponent(cc.Sprite)
			// 		});
			// 	} else {
			// 		this.cardsNode.children[index].active = true;
			// 		AssetsManager.loadSpriteFrame({
			// 			path: ConfigModel.getCardUrl(this._cards[index]),
			// 			sprite: this.cardsNode.children[index].getComponent(cc.Sprite)
			// 		});
			// 	}
			// }
		}
		this._card = data.card;
		this._type = data.type;
		this._val = data.val;
		this._cb = data.cb;
		this.cardFaceType.spriteFrame = null;
		AssetsManager.loadSpriteFrame({
			path: 'sprite/cuopai/' + this._card,
			sprite: this.cardFaceType
		}, () => {
			this.cardFaceType.node.setScale(0.7);
		});
		this.scheduleOnce(() => {
			if (!this._isOpenCard) {
				this._openCard();
			}
		}, 8);
	},

	_showCards() {
		if (!this._cards) return;
		// for (let index = 0; index < this._cards.length; index++) {
		// 	this.cardsNode.children[index].active = true;
		// 	this.cardsNode.children[index].getComponent(cc.Sprite).spriteFrame = null;
		// 	AssetsManager.loadSpriteFrame({
		// 		path: ConfigModel.getCardUrl(this._cards[index]),
		// 		sprite: this.cardsNode.children[index].getComponent(cc.Sprite)
		// 	});
		// }
	},

	start() {
		// this.cardsNode.active = false;
		this.peekNode.on(cc.Node.EventType.TOUCH_START, this._touchStart, this);
		this.peekNode.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
		this.peekNode.on(cc.Node.EventType.TOUCH_END, this._touchEnd, this);
		this._layerinit();
		this._init();
	},

	messageCallbackHandler(route, msg) {
		if (route === 'UpdateGameCardBg') {
			this.updateCardsBgSprite();
		}
	},

	updateCardsBgSprite() {
		let cardBg = this.cardBack.getComponent(cc.Sprite);
		if (!cardBg) return;
		AssetsManager.loadSpriteFrame({
			path: ConfigModel.getCardUrl(),
			sprite: cardBg
		});
	},

	_layerinit() {
		// this.setTouchAreaSize(this.cardSize);
		let canvas = cc.director.getScene().getComponentInChildren(cc.Canvas);
		this.setTouchAreaSize(canvas.designResolution);
		if (!this.cardSize) {
			this.cardSize = this.cardBackBg.getContentSize();
		}
		this._initCardNode(this.mask.node, this.cardSize, this._dirType != this._originalDirType);
		this._initCardNode(this.cardBackBg, this.cardSize, this._dirType != this._originalDirType);
		this._initCardNode(this.cardFaceBg, this.cardSize, this._dirType != this._originalDirType);
		this._initCardNode(this.shadowMask.node, this.cardSize, this._dirType != this._originalDirType);

		//设置牌面在遮罩左边
		this.cardFaceBg.setPosition(-this.mask.node.width, 0);
		//设置阴影大小以及位置
		this.shadow.angle = 0;
		this.shadow.height = Math.sqrt(Math.pow(this.cardSize.height, 2) + Math.pow(this.cardSize.width, 2)) * 2
		this.shadow.width = 40;
		let x = this.cardFaceBg.width / 2 + this.shadowMask.node.width / 2;
		let y = this.cardFaceBg.height / 2 + this.shadowMask.node.height / 2
		this.shadow.setPosition(x, y);
		//隐藏手指
		this._initFinger();
		this._initStatus();
	},

	_touchStart(event) {
		if (this._isOpenCard) return;
		this._tStartPos = event.getLocation();
	},

	_touchMove(event) {
		if (this._isOpenCard || !this._tStartPos) return;
		let _tEndPos = event.getLocation();
		let _tPrePos = event.getPreviousLocation();
		if (_tEndPos.equals(_tPrePos)) return; //忽略相同点
		//规定方向向量为: 开始点到当前点的向量。 规定移动向量为: 上一个点到当前点的向量
		let startToEndVec = _tEndPos.sub(this._tStartPos);
		let preToEndVec = _tEndPos.sub(_tPrePos);
		//规定 达到最小长度才确定方向
		let length = startToEndVec.mag();
		if (!this._isMoveStart && length >= this._directionLength) {
			this._isMoveStart = true;
			this._tMoveVec = this._fixedDirection(startToEndVec);
			this._rotation = this._getSignAngle(this._tMoveVec, cc.v2(1, 0));
			//设置外接矩形
			let size = this._getOutRectSize(this.cardBackBg, this._rotation);
			this.mask.node.setContentSize(size);
			//设置旋转角度
			this.mask.node.angle = -this._rotation;
			this.cardBackBg.angle = this._rotation;
			this.cardFaceBg.angle = -this._rotation;
			this.shadow.angle = this._rotation;
			//根据移动方向 设置牌面和阴影 移动前的起始位置
			let quadrant = this._getQuadrant(this._tMoveVec);
			let faceVertexs = this._getNodeVertexByNodeSpaceAR(this.cardFaceBg);
			switch (quadrant) {
				case 1:
				case 5:
					// 牌面在遮罩左边
					this.cardFaceBg.setPosition(-this.mask.node.width, this.cardBackBg.y);
					// 阴影设置在牌面的右下顶点
					this.shadow.setPosition(faceVertexs[2]);
					break;
				case 2:
				case 6:
					// 牌面在遮罩右边
					this.cardFaceBg.setPosition(-this.mask.node.width, -this.cardBackBg.y);
					// 阴影设置在牌面的左下顶点
					this.shadow.setPosition(faceVertexs[3]);
					break;
				case 3:
				case 7:
					// 牌面在遮罩右边
					this.cardFaceBg.setPosition(-this.mask.node.width, -this.cardBackBg.y);
					// 阴影设置在牌面的左上顶点
					this.shadow.setPosition(faceVertexs[0]);
					break;
				case 4:
				case 8:
					// 牌面在遮罩左边
					this.cardFaceBg.setPosition(-this.mask.node.width, this.cardBackBg.y);
					// 阴影设置在牌面的右上顶点
					this.shadow.setPosition(faceVertexs[1]);
					break;
				default:
					this._isMoveStart = false;
					break;
			}

		} else if (this._isMoveStart) {
			//移动向量在方向向量上的分量
			let quadrant = this._getQuadrant(this._tMoveVec);
			let unitV = preToEndVec.project(cc.v2(this._tMoveVec));
			let _unitV = unitV.neg(); //反向移动向量
			if (unitV.mag() == 0) return;
			let speed = this._moveSpeed;
			//移动 此处锁死方向  若要支持全方向注释下面 XY 轴赋值
			unitV.y = quadrant == 1 || quadrant == 6 || quadrant == 8 ? unitV.y : 0; //X 轴移动
			unitV.x = quadrant == 1 || quadrant == 5 || quadrant == 7 ? unitV.x : 0; //Y 轴移动
			// console.log('移动---', quadrant, unitV);
			this._moveByVec2(this.mask.node, unitV, speed);
			this._moveByVec2(this.cardBackBg, _unitV, speed);
			this._moveByVec2(this.cardFaceBg, unitV, speed);
			this._moveByVec2(this.shadow, _unitV, speed);

			//显示手指
			let vertexs = this._getNodeVertexByWorldSpaceAR(this.cardFaceBg, -10);
			let maskPolygon = this._getNodeVertexByWorldSpaceAR(this.mask.node);
			//判断顶点是否落在多边形内
			this._inFingers = [];
			for (let i = 0; i < vertexs.length; i++) {
				if (cc.Intersection.pointInPolygon(vertexs[i], maskPolygon)) {
					this._inFingers.push(i);
				}
			}
			for (let i = 0; i < this._inFingers.length; i++) {
				let index = this._inFingers[i]; //顶点下标
				let finger = this["finger" + (i + 1)];
				if (!finger) continue;
				finger.active = true;
				finger.setPosition(finger.parent.convertToNodeSpaceAR(vertexs[index]));
				finger.angle = 90 - this._rotation;
			}

			length = this._inFingers.length;
			//隐藏不必要的手指
			if (length == 0) {
				this.finger1.active = false
				this.finger2.active = false
			} else if (length == 1) {
				this.finger2.active = false
			}
			if (this._canOpen()) {
				this._openCard();
			}
			if (unitV.x * this._tMoveVec.x <= 0 &&
				unitV.y * this._tMoveVec.y <= 0 &&
				length == 0) {
				this._layerinit();
				this._tMoveVec = null;
				// console.log("禁止继续回退");
			}
		}

	},

	_touchEnd(event) {
		if (this._isOpenCard || !this._tStartPos) return;
		this._layerinit();
	},

	/**
	 * 设置触摸区域的大小
	 */
	setTouchAreaSize(w, h) {
		let size = this._getSize(w, h);
		this.peekNode.setContentSize(size);
	},

	setCardSize(w, h) {
		let size = this._getSize(w, h);
		this.cardSize = size;
		if (this._dirType != this._originalDirType) {
			size = cc.size(size.height, size.width);
		}
		this.mask.node.setContentSize(size);
		this.cardBackBg.setContentSize(size);
		this.cardFaceBg.setContentSize(size);
		this.shadowMask.node.setContentSize(size);
	},

	setFingerSize(x, y) {
		let size = this._getSize(x, y);
		this.finger1.setContentSize(size);
		this.finger2.setContentSize(size);
	},

	/**
	 * 检测是否开牌
	 */
	_canOpen() {
		let length = this._getMoveLength();
		let maxLength = this._getMoveMaxLength();
		return length > maxLength / 2;
	},

	_getMoveLength() {
		let localPos = this.mask.node.getPosition();
		let length = localPos.mag(); //遮罩初始坐标是(0, 0) 此处坐标即向量
		return length;
	},

	_getMoveMaxLength() {
		let maxLength = this.mask.node.width;
		return maxLength;
	},

	_openCard() {
		this._layerinit();
		this._showCard();
		this._showCards();
		//显示牌面
		this.cardFaceBg.setPosition(0, 0);
		this.cardFaceBg.setScale(1);
		this._isOpenCard = true;
		//搓牌结束
		this.peekNode.stopAllActions();
		cc.tween(this.peekNode)
			.delay(0.5)
			.call(() => {
				if (this._cb) this._cb();
			})
			.delay(1)
			.call(() => {
				this.node.destroy();
			})
			.start();
	},

	_showCard() {
		AssetsManager.loadSpriteFrame({
			path: 'sprite/cuopai/' + this._card,
			sprite: this.cardFaceType
		}, () => {
			this.cardFaceType.node.setScale(0.7);
		});
		this.cardNumberType1.spriteFrame = null;
		this.cardNumberType2.spriteFrame = null;
		let num = '',
			numType = this._card != 78 && this._card != 79 ? 'type_' + this._type : '';;
		if (numType != '') {
			//显示小花色
		}
		if (this._card == 78 || this._card == 79) {
			num = 'xiao_' + this._card;
		} else {
			if (this._type == 1 || this._type == 3) {
				num = 'xiao_hei_' + this._val;
			} else {
				num = 'xiao_hong_' + this._val;
			}
		}
		if (num != '') {
			AssetsManager.loadSpriteFrame({
				path: 'sprite/cuopai/' + num,
				sprite: this.cardNumber1
			});
			AssetsManager.loadSpriteFrame({
				path: 'sprite/cuopai/' + num,
				sprite: this.cardNumber2
			});
		}

	},

	_getOutRectSize(inRect, angle) {
		angle = Math.abs(angle);
		if (angle > 90 && angle <= 180) {
			angle = 180 - angle;
		}
		let radian = Math.PI / 180 * angle;
		let w = inRect.height * Math.sin(radian) + inRect.width * Math.cos(radian);
		let h = inRect.height * Math.cos(radian) + inRect.width * Math.sin(radian);
		return cc.size(w, h);
	},

	_moveByVec2(node, unitVec, length = 1) {
		let wp1 = node.parent.convertToWorldSpaceAR(node.getPosition());
		let wp2 = cc.v2(wp1.x + unitVec.x * length, wp1.y + unitVec.y * length);
		let localP = node.parent.convertToNodeSpaceAR(wp2);
		node.setPosition(localP);
	},

	_getSignAngle(v1, v2) {
		let radian = v1.signAngle(v2);
		let angle = 180 / Math.PI * radian;
		return angle;
	},

	_fixedDirection(moveDirection) {
		if (this._angleFixed) {
			let fAngle = this._angleFixed;
			let xVec = cc.v2(1, 0)
			let angle = this._getSignAngle(moveDirection, xVec);
			if ((angle <= (fAngle + 0) && angle >= (-fAngle + 0)) ||
				(angle <= (fAngle + (-180)) || angle >= (-fAngle + 180))) {
				moveDirection = moveDirection.project(xVec);
				return moveDirection;
			}
			let yVec = cc.v2(0, 1);
			angle = this._getSignAngle(moveDirection, yVec);
			if ((angle <= (fAngle + 0) && angle >= (-fAngle + 0)) ||
				(angle <= (fAngle + (-180)) || angle >= (-fAngle + 180))
			) {
				moveDirection = moveDirection.project(yVec);
				return moveDirection;
			}
		}
		return moveDirection;
	},

	_getNodeVertexByWorldSpaceAR(node, offset = 0) {
		let vertexs = this._getNodeVertexByNodeSpaceAR(node, offset);
		for (let i = 0; i < vertexs.length; i++) {
			vertexs[i] = node.convertToWorldSpaceAR(vertexs[i]);
		}
		return vertexs;
	},

	_getNodeVertexByNodeSpaceAR(node, offset = 0) {
		let left = node.width * node.anchorX + offset;
		let right = node.width * (1 - node.anchorX) + offset;
		let bottom = node.height * node.anchorY + offset;
		let top = node.height * (1 - node.anchorY) + offset;
		let lt = cc.v2(-left, top);
		let rt = cc.v2(right, top);
		let rb = cc.v2(right, -bottom);
		let lb = cc.v2(-left, -bottom);
		return [lt, rt, rb, lb];
	},

	/**
	 * 获取坐标所在象限
	 * @returns  1 2 3 4 表示1~4象限 5x正轴 6y正轴 7x负轴 8y负轴 9原点
	 */
	_getQuadrant(vec) {
		let x = vec.x,
			y = vec.y;
		if (x == 0) {
			if (y == 0) {
				return 9; // 原点
			} else if (y > 0) {
				return 6; // y正轴
			} else if (y < 0) {
				return 8; // y负轴
			}
		} else if (x > 0) {
			if (y == 0) {
				return 5; // x正轴
			} else if (y > 0) {
				return 1; // 第一象限
			} else if (y < 0) {
				return 4; // 第四象限
			}
		} else if (x < 0) {
			if (y == 0) {
				return 7; // x负轴
			} else if (y > 0) {
				return 2; // 第二象限
			} else if (y < 0) {
				return 3; // 第三象限
			}
		}
		return 0;
	},

	_initCardNode(node, size, isRotate) {
		if (!size) return;
		if (this._dirType != this._originalDirType) {
			node.setContentSize(size.height, size.width);
		} else {
			node.setContentSize(size);
		}
		node.angle = 0;
		node.setPosition(0, 0);
	},

	_initFinger() {
		this._inFingers = [];
		this.finger1.active = false;
		this.finger2.active = false;
	},

	_initStatus() {
		this._isOpenCard = false; //改变状态 未开牌
		this._isMoveStart = false;
		this._rotation = 0;
	},

	_getSize(x, y) {
		return cc.size(x, y);
		if (x == undefined) {
			return cc.size(0, 0);
		} else if (x instanceof cc.Size) {
			return x;
		} else if (y != undefined) {
			return cc.size(x, y)
		} else {
			return cc.size(x, x)
		}
	},

	_checkDynamicAtlas(texture) {
		let dam = cc.dynamicAtlasManager;
		if (dam.enabled == false) return false;
		// 简单用纹理的size判断
		return texture.width == dam.textureSize && texture.height == dam.textureSize;
	},

	onDestroy() {
		if (!this._isOpenCard && this._cb) {
			this._cb();
		}
		MessageCallback.removeListener('UpdateGameCardBg', this);
		this.peekNode.off(cc.Node.EventType.TOUCH_START, this._touchStart, this);
		this.peekNode.off(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
		this.peekNode.off(cc.Node.EventType.TOUCH_END, this._touchEnd, this);
	},

});