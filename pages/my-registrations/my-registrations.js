const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    items: [],
    loading: false,
    loadFailed: false
  },

  async onShow() {
    this.setData({
      items: [],
      loading: true,
      loadFailed: false
    });

    try {
      const result = await cloudApi.getMyRegistrations();
      if (result && result.ok) {
        this.setData({
          items: result.items || [],
          loading: false
        });
        return;
      }
    } catch (error) {
      console.warn('getMyRegistrations failed', error);
    }
    this.setData({ loading: false, loadFailed: true });
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${event.currentTarget.dataset.id}`
    });
  }
});
