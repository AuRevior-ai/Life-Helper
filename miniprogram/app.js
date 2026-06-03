const { getCurrentUser } = require("./utils/auth");

App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: wx.cloud.DYNAMIC_CURRENT_ENV,
        traceUser: true,
      });
    }

    this.globalData.currentUser = getCurrentUser();
  },

  globalData: {
    currentUser: null,
  },
});
