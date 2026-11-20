
var cache = module.exports;

cache.init = function () {
    // console.log('cc.sys.localStorage', cc.sys.localStorage)
    let cacheData = cc.sys.localStorage.getItem('cacheData');
    this.cacheData = !!cacheData ? JSON.parse(cacheData) : {};
}

cache.setItem = function (key, val) {
    this.cacheData = this.cacheData || {};
    this.cacheData[key] = val;
    cc.sys.localStorage.setItem('cacheData', JSON.stringify(this.cacheData));
}

cache.getItem = function (key) {
    this.cacheData = this.cacheData || {};
    return this.cacheData[key];
}

cache.delItem = function (key) {
    this.cacheData = this.cacheData || {};
    delete this.cacheData[key];
    cc.sys.localStorage.setItem('cacheData', JSON.stringify(this.cacheData));
}

cache.delItems = function (keys) {
    if (!keys) return;
    this.cacheData = this.cacheData || {};
    keys.forEach(key => {
        delete this.cacheData[key];
    });
    cc.sys.localStorage.setItem('cacheData', JSON.stringify(this.cacheData));
}

cache.clear = function () {
    this.cacheData = {};
    cc.sys.localStorage.removeItem('cacheData');
}