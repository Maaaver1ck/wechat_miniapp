const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    profile: {},
    redirect: '',
    loading: true,
    submitting: false
  },

  onLoad(options) {
    this.setData({
      profile: store.getProfile() || {},
      redirect: options.redirect ? decodeURIComponent(options.redirect) : ''
    });
    this.loadProfile();
  },

  loadProfile() {
    cloudApi.getProfile()
      .then(result => {
        if (result && result.profile) {
          store.saveProfile(result.profile);
          this.setData({ profile: result.profile });
        }
        this.setData({ loading: false });
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  async submitProfile(event) {
    if (this.data.submitting) {
      return;
    }
    const value = event.detail.value;
    const fields = ['name', 'studentId', 'college', 'major', 'phone'];
    const missing = fields.some(field => !String(value[field] || '').trim());
    if (missing) {
      wx.showToast({ title: '请完整填写资料', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const result = await cloudApi.saveProfile(value);
      if (!result || !result.ok) {
        this.setData({ submitting: false });
        wx.showToast({ title: result.reason || '保存失败，请检查填写内容', icon: 'none' });
        return;
      }
      store.saveProfile(result.profile || value);
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({ title: '保存失败，请检查网络或云函数配置', icon: 'none' });
      return;
    }

    this.setData({ submitting: false });
    setTimeout(() => {
      if (this.data.redirect) {
        wx.redirectTo({ url: this.data.redirect });
        return;
      }
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/mine/mine' }) });
    }, 350);
  }
});
