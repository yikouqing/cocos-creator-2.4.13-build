const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const UserModel = require('../../model/UserModel');
const Enums = require('../../const/Enums');

cc.Class({
	extends: cc.Component,

	properties: {
		emojiList: cc.Node,
		emojiItem: cc.Prefab,
		textView: cc.Node,
		emojiView: cc.Node,
		inputLay: cc.Node,
		textEdit: cc.EditBox,
		_chat: null,
		_gameRule: null
	},

	onLoad() {
		this._chat = this.node.nodeParams ? this.node.nodeParams.chat : null;
		this._gameRule = this.node.nodeParams ? this.node.nodeParams.gameRule : null;
	},

	start() {
		this.inputLay.active = !!this._gameRule && !!this._gameRule.wenzi && !!ConfigModel.getData('canChatInput');
		this.emojiList.destroyAllChildren();
		for (let i = 0; i <= 23; ++i) {
			let node = cc.instantiate(this.emojiItem);
			node.parent = this.emojiList;
			node.getComponent('ChatEmojiItem') && node.getComponent('ChatEmojiItem').bind(this, i);
		}
	},

	onEmotionClick(param) {
		if (this.getCanSendChat()) {
			this._chat && this._chat({
				type: Enums.chatType.EMOJI,
				content: parseInt(param)
			});
		}
		this.onCloseClick();
	},

	onTextClick(event, param) {
		if (this.getCanSendChat()) {
			this._chat && this._chat({
				type: Enums.chatType.SYSTEM,
				content: parseInt(param)
			});
		}
		this.onCloseClick();
	},

	onButtonClick(event, param) {

	},

	onChatClick(event, param) {
		let text = this.textEdit.string;
		if (text.length > 0) {
			if (this.getCanSendChat()) {
				this._chat && this._chat({
					type: Enums.chatType.TEXT,
					content: text
				});
			}
			this.onCloseClick();
		}
	},

	onCloseClick(event, param) {
		this.textEdit.string = '';
		this.node.destroy();
	},

	onToggleClick(event, param) {
		if (param == 'emotion') {
			this.emojiView.active = true;
			this.textView.active = !this.emojiView.active;
		} else if (param == 'msg') {
			this.textView.active = true;
			this.emojiView.active = !this.textView.active;
		}
	},

	getCanSendChat() {
		let chatCool = ConfigModel.getData('chatCool') || 3;
		let chatRecord = UserModel.getData('gameChatTimer') || 0;
		let coolTick = Date.now() - chatRecord;
		let canChat = coolTick >= chatCool * 1000;
		if (!!canChat) {
			UserModel.setData('gameChatTimer', Date.now())
		} else {
			let canTick = chatCool - coolTick / 1000;
			AssetsManager.tipDialog(`聊天太频繁，请${Math.round(canTick)}秒后再发！`);
		}
		return canChat;
	},
});