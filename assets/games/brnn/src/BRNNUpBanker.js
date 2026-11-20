const ApiBrnn = require('./ApiBrnn');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const BRNNModel = require("./BRNNModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,
	properties: {
		sliderBar: cc.Slider,
		progressBar: cc.ProgressBar,
		txt_upScore: cc.Label,
		_minScore: 0,
	},

	onLoad() {
		/**添加按钮事件 */
		CCUtil.nodeRecursive(this.node, (node) => {
			if (node.getComponent(cc.Button)) {
				node.on("click", this.btnClickCallFunc, this)
			} else if (node.getComponent(cc.Slider)) {
				node.on("slide", this.onSlider, this)
			}
		})

		this._minScore = BRNNModel.getGameRuleByKey("bankerScore")

		this.sliderBar.progress = 1;
		this.progressBar.progress = 1;
		this.txt_upScore.string = this.getProgressScore() + ""
	},

	btnClickCallFunc(event, param) {
		let node = event.node || event.target
		// console.log("点击了按钮", node.name, node, event.target)
		switch (node.name) {
			case "btn_enter": //提交
				ApiRoom.gameMessageNotify(ApiBrnn.gameUserApplyBankerNotify(BRNNModel.myUid, 1, parseInt(this.txt_upScore.string)));
				this.node.destroy()
				break;
			case "btn_cancel": //关闭菜单
				this.node.destroy();
				break;
		}
	},

	onSlider(event, param) {
		this.progressBar.progress = event.progress;
		this.txt_upScore.string = this.getProgressScore();
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},

	getProgressScore() {
		let minCanPourScores = this._minScore;
		let maxCanPourScore = parseInt(BRNNModel.getMyScore());
		maxCanPourScore = Math.floor(maxCanPourScore / minCanPourScores) * minCanPourScores
		let score = minCanPourScores + Math.floor((maxCanPourScore - minCanPourScores) * this.progressBar.progress);
		if (score % minCanPourScores != 0) {
			score = Math.floor(score / minCanPourScores) * minCanPourScores
		}
		return score;
	},
});