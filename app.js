const store = require('./utils/store');

App({
  onLaunch() {
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: 'cloud1-0gdm8y4f0bf3a31c',
          traceUser: true
        });
      } catch (e) {
        console.error('wx.cloud.init failed', e);
        this.globalData.runtimeError = `云开发初始化失败：${e && e.message ? e.message : String(e)}`;
        try { wx.setStorageSync('runtime_error_message', this.globalData.runtimeError); } catch (_) {}
      }
    }
  },
  onError(error) {
    this.globalData.runtimeError = String(error || '');
    try {
      wx.setStorageSync('runtime_error_message', String(error || ''));
    } catch (e) {}
  },
  onPageNotFound(error) {
    const message = `页面不存在：${(error && error.path) || ''}`;
    this.globalData.runtimeError = message;
    try {
      wx.setStorageSync('runtime_error_message', message);
    } catch (e) {}
  },
  globalData: {
    currentOpenid: store.CURRENT_OPENID,
    platformAdminOpenids: ['omhZU3Y6E3KbPY724xQlLOiC8au4'],
    runtimeError: ''
  }
});
