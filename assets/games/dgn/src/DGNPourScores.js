const ApiDgn = require('./ApiDgn');
const DGNModel = require('./DGNModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');

cc.Class({
	extends: cc.Component,
	properties: {},

	onLoad() {
		this.scoreLabel = cc.find("Label", this.node).getComponent(cc.Label);
		this.slider = cc.find("Slider", this.node).getComponent(cc.Slider);
		this.progressBar = cc.find("ProgressBar", this.node).getComponent(cc.ProgressBar);
	},

	showSelf() {
		this.node.active = true;
		this.range = DGNModel.getPourScoreRange();
		this.scoreLabel.string = "" + this.range[0];
		this.slider.progress = 0;
		this.progressBar.progress = 0;
	},

	onSlider(event, param) {
		this.progressBar.progress = this.slider.progress;
		var score = Math.floor((this.range[1] - this.range[0]) * this.slider.progress + this.range[0]);
		this.scoreLabel.string = "" + score;
	},

	onButton(event, param) {

		if (param == "xiazhu") {
			let score = parseInt(this.scoreLabel.string);
			if (!isNaN(score) && score > 0) {
				this.node.active = false;
				ApiRoom.gameMessageNotify(ApiDgn.pourScoreNotify(score, false));
			}
		} else if (param == "shemen") {
			let score = this.range[1];
			this.node.active = false;
			ApiRoom.gameMessageNotify(ApiDgn.pourScoreNotify(score, true));
			AssetsManager.playEffect({
				path: 'res/audio/main/shemen',
				bundle: Enums.bundleType.DGN
			});
		}
	},
});