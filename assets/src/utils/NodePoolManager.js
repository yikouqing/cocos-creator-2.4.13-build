class NodePoolManager {

    constructor() {
        this._poolMap = new Map();
        this._nodeMap = new Map();
    }

    /**
     * 初始化一个新的节点池
     * @param {string} key 唯一key
     * @param {cc.Node | cc.Prefab} copy 需要复制的节点或者预制体
     * @param {number} count 初始化的数量
     */
    init(key, copy, count) {
        let pool = this._poolMap.get(key);
        if (!pool) {
            for (let i = 0; i < count; i++) {
                let item = cc.instantiate(copy);
                this.put(key, item);
            }
        }
        let node = this._nodeMap.get(key);
        if (!node) this._nodeMap.set(key, copy);
    }

    /**
     * 获取节点池中节点数量
     * @param {string} key 
     * @returns 节点数量
     */
    size(key) {
        let pool = this._poolMap.get(key);
        if (!pool) return 0;
        return pool.size();
    }

    /**
     * 清空节点
     * @param {string} key 
     */
    clear(key) {
        if (!key) {
            this._poolMap.forEach(pool => {
                pool.clear();
            });
            this._poolMap.clear();
            this._nodeMap.clear();
        } else {
            let pool = this._poolMap.get(key);
            if (!pool) return;
            pool.clear();
            this._poolMap.delete(key);
            this._nodeMap.delete(key);
        }

    }

    /**
     * 根据类型从节点池取出节点
     * @param {string} key 类型名字
     * @returns cc.Node | null
     */
    get(key) {
        let pool = this._poolMap.get(key);
        let node = null;
        if (!pool || pool.size() == 0) {
            let pNode = this._nodeMap.get(key);
            // console.log('获取节点---1', pNode);
            if (pNode) {
                node = cc.instantiate(pNode);
            }
        } else {
            node = pool.get();
        }
        // console.log('获取节点---3', node);
        return node;
    }

    /**
     * 根据类型将节点放入节点池
     * @param {string} key 类型名字
     * @param {cc.Node} node 节点
     * @returns 
     */
    put(key, node) {
        if (!node) return;
        let pool = this._poolMap.get(key);
        if (!pool) {
            pool = new cc.NodePool();
            this._poolMap.set(key, pool);
        }
        pool.put(node);
    }
}

module.exports = new NodePoolManager();