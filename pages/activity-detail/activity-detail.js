const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    id: '',
    activity: null,
    loading: false,
    loadFailed: false,
    submitting: false,
    cancelling: false
  },

  onLoad(options) {
    this.setData({ id: options.id });
  },

  onShow() {
    this.loadActivity();
  },

  async loadActivity() {
    this.setData({
      activity: null,
      loading: true,
      loadFailed: false
    });

    try {
      const result = await cloudApi.getActivityDetail(this.data.id);
      if (result && result.ok && result.activity) {
        this.setData({
          activity: result.activity,
          loading: false
        });
        return;
      }
    } catch (error) {
      console.warn('getActivityDetail failed', error);
    }

    this.setData({
      loading: false,
      loadFailed: true
    });
  },

  async register() {
    if (this.data.submitting || this.data.cancelling) {
      return;
    }
    this.setData({ submitting: true });
    try {
      const result = await cloudApi.registerActivity(this.data.id);
      if (!result || !result.ok) {
        this.setData({ submitting: false });
        if (result && result.needProfile) {
          const redirect = encodeURIComponent(`/pages/activity-detail/activity-detail?id=${this.data.id}`);
          wx.navigateTo({
            url: `/pages/profile-form/profile-form?redirect=${redirect}`
          });
          return;
        }
        wx.showToast({ title: result.reason || '报名失败，请稍后再试', icon: 'none' });
        return;
      }
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({ title: '报名失败，请检查网络或云函数配置', icon: 'none' });
      return;
    }

    this.setData({ submitting: false });
    wx.showToast({ title: '报名成功', icon: 'success' });
    this.loadActivity();
  },

  cancelRegister() {
    wx.showModal({
      title: '取消报名',
      content: '确认取消这场活动的报名吗？',
      success: async response => {
        if (!response.confirm) {
          return;
        }

        if (this.data.submitting || this.data.cancelling) {
          return;
        }
        this.setData({ cancelling: true });
        try {
          const result = await cloudApi.cancelRegistration(this.data.id);
          if (!result || !result.ok) {
            this.setData({ cancelling: false });
            wx.showToast({ title: result.reason || '取消失败，请稍后重试', icon: 'none' });
            return;
          }
        } catch (error) {
          this.setData({ cancelling: false });
          wx.showToast({ title: '取消失败，请检查网络或云函数配置', icon: 'none' });
          return;
        }

        this.setData({ cancelling: false });
        wx.showToast({ title: '已取消', icon: 'success' });
        this.loadActivity();
      }
    });
  }
});
