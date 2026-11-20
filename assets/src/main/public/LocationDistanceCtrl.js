const Utils = require('../../utils/Utils');
const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        playerHeads: [cc.Sprite],
        drawPoints: [cc.Node],
        drawPen: cc.Graphics,
    },

    bind(fangzuobi, players) {
        this.drawPen.clear(true);
        for (let index = 0; index < this.playerHeads.length; index++) {
            if (!players[index] || !players[index].userInfo || !this.playerHeads[index]) {
                this.playerHeads[index].spriteFrame = null
            } else {
                AssetsManager.loadSpriteFrame({
                    path: players[index].userInfo.avatar,
                    sprite: this.playerHeads[index]
                })
            }
            for (let parse = index + 1; parse < this.playerHeads.length; parse++) {
                cc.find(`${index}_${parse}`, this.node).getComponent(cc.Label).string = ""
            }
        }
        if (!fangzuobi) return;
        for (let index = 0; index < players.length; index++) {
            let pStart = players[index];
            if (!pStart) continue;
            let startDian = this.drawPoints[index]
            for (let parse = index + 1; parse < players.length; parse++) {
                let pEnd = players[parse];
                let endDian = this.drawPoints[parse]
                // console.log('当前1', index, parse, cc.find(`${index}_${parse}`, this.node), pStart.userInfo.address, pEnd.userInfo.address);
                if (!pEnd || !cc.find(`${index}_${parse}`, this.node) ||
                    !cc.find(`${index}_${parse}`, this.node).getComponent(cc.Label) ||
                    !pStart.userInfo.address ||
                    pStart.userInfo.address.length == 0 ||
                    !pEnd.userInfo.address ||
                    pEnd.userInfo.address.length == 0) continue;
                let a = JSON.parse(pStart.userInfo.address);
                let b = JSON.parse(pEnd.userInfo.address);
                let s = Utils.getDistanceByLocation(a, b);

                var distance_str = "";
                if (s >= 1) {
                    distance_str = Utils.formatNumberWithDecimal(s) + "km";
                } else {
                    distance_str = Utils.formatNumberWithDecimal(s * 1000) + "m";
                }
                cc.find(`${index}_${parse}`, this.node).getComponent(cc.Label).string = `${distance_str}${s < 0.15 ? '(距离较近)' : ''}`;
                // cc.find(`${index}_${parse}`, this.node).color = s < 0.15 ? new cc.Color(202, 60, 5) : new cc.Color(0, 0, 0);
                // //划线
                this.drawPen.lineWidth = 10;
                let c = s < 0.15 ? cc.color(255, 0, 0) : cc.color(89, 140, 221)
                this.drawPen.strokeColor = c;
                startDian.color = c
                endDian.color = c
                let startPos = cc.v2(startDian.x, startDian.y);
                let endPos = cc.v2(endDian.x, endDian.y);
                // console.log("划线==", index, parse)
                this.drawLineOfDashes(this.drawPen, startPos, endPos)
            }
        }
    },

    /**
     * 
     * @param {cc.Graphics} g 
     * @param {cc.Vec2} from 
     * @param {cc.Vec2} to 
     * @param {boolean} stroke 
     * @param {number} length 
     * @param {number} interval 
     */
    drawLineOfDashes(g, from, to, stroke = true, length = 20, interval = 4) {
        if (g) {
            let off = to.sub(from);
            let dir = off.normalize();
            let dis = off.mag();
            let delta = dir.mul(length + interval);
            let delta1 = dir.mul(length);
            let n = Math.floor(dis / (length + interval));
            for (let i = 0; i < n; ++i) {
                let start = from.add(delta.mul(i));
                g.moveTo(start.x, start.y);
                let end = start.add(delta1);
                g.lineTo(end.x, end.y);
            }
            let start1 = from.add(delta.mul(n));
            g.moveTo(start1.x, start1.y);
            if (length < dis - (length + interval) * n) {
                let end = start1.add(delta1);
                g.lineTo(end.x, end.y);
            } else {
                g.lineTo(to.x, to.y);
            }
            if (stroke) g.stroke();
        }
    }

});