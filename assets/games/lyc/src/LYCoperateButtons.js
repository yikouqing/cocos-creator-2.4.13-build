/*
 * 抢庄
 * author: sfmy
 */
const LYCModel = require('./LYCModel');
const ApiLyc = require('./ApiLyc');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
	extends: cc.Component,
	properties: {},

	onLoad() {
		this.compareNodeArray = [];
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
	},

	gameInit(data) {
		if (data.gameData.gameStatus === ApiLyc.gameStatus.CHOOSE_OPERATE) {
			this.showBtn(data.gameData.curOperateInfo)
		}
		this._compareOptArr = data.gameData.compareOperateArray
	},

	messageCallbackHandler(route, msg) {
		if (!LYCModel.getGameInited()) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit(msg.data);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiLyc.GAME_USER_OPERATE_START_PUSH) {
				this.showBtn(msg.data)
			} else if (msg.type === ApiLyc.GAME_USER_OPERATE_PUSH) {
				if (msg.data.chairID == LYCModel.getMyChairID()) this.node.active = false;
				let opType = msg.data.operateInfo.operateType;
				let user = LYCModel.getUserByChairID(msg.data.chairID);
				let audio = '';
				// console.log('USER-OPTION', msg, opType);
				if (opType == ApiLyc.operateType.CANCEL) {
					audio = 'res/audio/nv/px_bulao';
				} else if (opType == ApiLyc.operateType.PULL) {
					audio = 'res/audio/nv/px_laoyizhang';
				} else if (opType == ApiLyc.operateType.BOOM) {
					audio = 'res/audio/nv/px_zhakai';
				} else if (opType == ApiLyc.operateType.UNBOOM) {
					audio = 'res/audio/nv/px_buzha';
				}
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/nv/, "nan");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.LYC
				});
			} else if (msg.type === ApiLyc.GAME_RESULT_PUSH) {
				this.node.active = false
				this.delCompareNode()
			} else if (msg.type === ApiLyc.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus !== ApiLyc.gameStatus.CHOOSE_OPERATE) {
					this.node.active = false
					this.delCompareNode()
				}
			} else if (msg.type === ApiLyc.GAME_COMPARE_PUSH) {

			}
		}
	},

	showBtn(data) {
		if (data.chairID == LYCModel.getMyChairID()) {
			/**根据消息展示按钮 */
			// pullCard: pullCard, //捞牌
			// 	cancel: cancel, //不捞
			// 	boom: boom, //炸开
			// 	unBoom: unBoom, //不炸
			// 	compare: compare, //比牌
			// 	tick: tick, //倒计时
			cc.find("Layout/btn_lao", this.node).active = data.pullCard
			cc.find("Layout/btn_bulao", this.node).active = data.cancel
			cc.find("Layout/btn_zha", this.node).active = data.boom
			cc.find("Layout/btn_buzha", this.node).active = data.unBoom
			cc.find("Layout/btn_bipai", this.node).active = data.compare
			this._compareOptArr = data.compareOperateArray
			this.node.active = true;
		}
	},

	onButtonClick(event, param) {

		let type = ApiLyc.operateType.CANCEL
		switch (event.target.name) {
			case "btn_lao":
				type = ApiLyc.operateType.PULL
				break;
			case "btn_zha":
				type = ApiLyc.operateType.BOOM
				break;
			case "btn_bulao":
				type = ApiLyc.operateType.CANCEL
				break;
			case "btn_buzha":
				type = ApiLyc.operateType.UNBOOM
				break;
			case "btn_bipai":
				type = 5
				break;
			default:
				break;
		}
		if (type == 5) {
			this.onCompareClick()
		} else {
			ApiRoom.gameMessageNotify(ApiLyc.gameUserOperateNotify(type));
		}
	},

	compare(chairID) {
		this.delCompareNode()
		cc.find('bg', this.node).active = false;
		ApiRoom.gameMessageNotify(ApiLyc.gameCompareNotify(chairID));
		this.node.active = false;
	},

	onCompareClick() {
		if (this._compareOptArr) {
			let canCompareCount = 0
			let cChairId = -1
			for (let i = 0; i < this._compareOptArr.length; i++) {
				const c = this._compareOptArr[i];
				if (c == 1 && i != LYCModel.getMyChairID()) {
					canCompareCount++
					cChairId = i
				}
			}
			this.delCompareNode()
			// console.log("当前可以比牌的数量==", canCompareCount, cChairId)
			if (canCompareCount == 0) {
				return
			}
			if (canCompareCount == 1) {
				this.compare(cChairId)
			} else {
				let mainCom = this.node.parent.getComponent("LYCMainDialog")
				let btn_compare = cc.find("btn_compare", this.node)
				let bgNode = cc.find('bg', this.node);
				let selfPos = this.node.getPosition();
				bgNode.active = true;
				for (let i = 0; i < this._compareOptArr.length; i++) {
					const canBipai = this._compareOptArr[i];
					if (canBipai == 1 && i != LYCModel.getMyChairID()) {
						let headNodePos = mainCom.getHeadNodeByChairID(i).getPosition();
						let node = cc.instantiate(btn_compare);
						node.parent = this.node;
						node.active = true;
						node.setPosition(cc.v2(headNodePos.x - selfPos.x, headNodePos.y - selfPos.y));
						this.compareNodeArray.push(node);
						node.on(cc.Node.EventType.TOUCH_END, this.compare.bind(this, i));
					}
				}
			}
		}
	},

	cancelCompare() {
		this.delCompareNode()
		cc.find('bg', this.node).active = false;
	},

	delCompareNode() {
		while (this.compareNodeArray.length > 0) {
			let node = this.compareNodeArray.pop();
			node.destroy();
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});