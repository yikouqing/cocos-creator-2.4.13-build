cc.Class({
	extends: cc.Component,
	properties: {
		boll: cc.Node,
	},

	shemen(comp, chairID) {
		let boll = cc.instantiate(this.boll);
		boll.parent = this.node;
		boll.active = true;
		let head = comp.getHeadNodeByChairID(chairID);
		boll.setPosition(head.getPosition());
		let endPos = cc.find("BankerScorePool", head).getPosition();
		let rotate = -180;
		if (endPos.x >= 0) {
			rotate = -Math.atan(endPos.y / endPos.x) / 3.1415926 * 180;
		} else {
			rotate = -Math.atan(endPos.y / endPos.x) / 3.1415926 * 180 + 180;
		}
		boll.rotation = rotate + 185;
		boll.runAction(cc.sequence(
			cc.moveBy(0.50, endPos),
			cc.callFunc(() => {
				boll.destroy();
			})
		));
	},
});