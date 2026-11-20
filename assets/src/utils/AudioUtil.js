const CacheManager = require('../utils/CacheManager');
const Codes = require('../const/Codes');

var exp = module.exports;

exp.init = function () {
    let musicVolume = this.getMusicVolume();
    let effectVolume = this.getEffectVolume();
    cc.audioEngine.setMusicVolume(musicVolume);
    cc.audioEngine.setEffectsVolume(effectVolume);
}

exp.playMusic = function (clip, loop = true) {
    this.stopMusic();
    if (!clip) return;
    this.bgmId = cc.audioEngine.playMusic(clip, loop || true);
}

exp.stopMusic = function () {
    cc.audioEngine.stopMusic();
}

exp.playEffect = function (clip, loop = false) {
    if (!clip) return null;
    return cc.audioEngine.playEffect(clip, loop || false);
}

exp.stopEffect = function (id) {
    !!id ? cc.audioEngine.stopEffect(id) : cc.audioEngine.stopAllEffects();
}

exp.setMusicVolume = function (volume) {
    CacheManager.setItem("music", volume != 0 ? volume : 0);
    cc.audioEngine.setMusicVolume(volume != 0 ? volume : 0);
}

exp.setEffectVolume = function (volume) {
    CacheManager.setItem("sound", volume != 0 ? volume : 0);
    cc.audioEngine.setEffectsVolume(volume != 0 ? volume : 0);
}

exp.getMusicVolume = function () {
    let musicVolume = parseFloat(CacheManager.getItem("music"));
    musicVolume = isNaN(musicVolume) || musicVolume >= 1 ? 1 : musicVolume;
    return musicVolume;
}

exp.getEffectVolume = function () {
    let effectVolume = parseFloat(CacheManager.getItem("sound"));
    effectVolume = isNaN(effectVolume) || effectVolume >= 1 ? 1 : effectVolume;
    return effectVolume;
}

/**
 * 设置音乐静音
 * @param {boolean} mute true静音 false不禁音
 */
exp.setMusicMute = function (mute) {
    if (!!mute) {
        this.musicVolume = this.getMusicVolume(); //静音前存起来
        this.setMusicVolume(0);
    } else {
        if (isNaN(this.musicVolume) || this.musicVolume == 0) this.musicVolume = 1;
        this.setMusicVolume(this.musicVolume);
    }
}

exp.isMusicMute = function (mute) {
    let musicVolume = this.getMusicVolume();
    return musicVolume == 0 || false;
}

/**
 * 设置音效静音
 * @param {boolean} mute true静音 false不禁音
 */
exp.setEffectMute = function (mute) {
    if (!!mute) {
        this.effectVolume = this.getEffectVolume(); //静音前存起来
        this.setEffectVolume(0);
    } else {
        if (isNaN(this.effectVolume) || this.effectVolume == 0) this.effectVolume = 1;
        this.setEffectVolume(this.effectVolume);
    }
}

exp.isEffectMute = function (mute) {
    let effectVolume = this.getEffectVolume();
    return effectVolume == 0 || false;
}

exp.resumeAll = function () {
    cc.audioEngine.resumeAll();
}

exp.stopAll = function () {
    cc.audioEngine.stopAll();
}