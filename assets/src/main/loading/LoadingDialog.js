cc.Class({
    extends: cc.Component,

    properties: {
        loadingGroup: cc.ProgressBar,
        allTotalCount: 0,
        allCompletedCount: 0,
        finishedCount: 0,
    },

    start() {
        this.isLoadingFinished = false;
        this.loadDirArr = this.node.nodeParams.loadDirArr || [];
        this.callback = this.node.nodeParams.cb;
        //加载资源
        this.loading();
    },

    loading() {
        let loadDirArr = this.loadDirArr;
        this.allTotalCount = 0;
        this.allCompletedCount = 0;
        this.finishedCount = 0;
        this.loadingGroup.progress = 0;
        for (let i = 0; i < loadDirArr.length; ++i) {
            this.loadDir(loadDirArr[i]);
        }
    },

    loadDir(dir) {
        // console.log('加载', dir);
        let lastTotalCount = 0;
        let lastCompletedCount = 0;
        cc.resources.loadDir(dir, (completedCount, totalCount) => {
            if (!this.isValid) return;
            if ((this.finishedCount === this.loadDirArr.length) && (this.loadingGroup.progress === 1)) return;
            if (this.isLoadingFinished) return;
            if (lastTotalCount === 0) {
                this.allTotalCount += totalCount;
                this.allCompletedCount += completedCount;
            } else {
                this.allTotalCount += (totalCount - lastTotalCount);
                this.allCompletedCount += (completedCount - lastCompletedCount);
            }
            if (this.allTotalCount < 10) this.allTotalCount = 10;
            lastTotalCount = totalCount;
            lastCompletedCount = completedCount;
            if (totalCount === completedCount) {
                this.finishedCount++;
            }
            let newProgress = 0;
            if (this.allTotalCount === 0) {
                newProgress = this.finishedCount / this.loadDirArr.length;
            } else {
                newProgress = this.allCompletedCount / this.allTotalCount;
            }
            if (newProgress > this.loadingGroup.progress) {
                this.loadingGroup.progress = newProgress;
            }
            if (newProgress * 1.1 >= 1) {
                this.loadingFinished();
            }
        },
            (err) => {
                if (!!err) { }
            });
    },

    loadingFinished() {
        if (this.isLoadingFinished) return;
        this.isLoadingFinished = true;
        this.loadingGroup.progress = 1;
        this.callback();
    }
});