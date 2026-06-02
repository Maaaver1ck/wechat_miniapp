const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

const STATUS_TEXT = {
  approved: '已通过',
  rejected: '已拒绝'
};

Page({
  data: {
    pending: [],
    handled: [],
    loading: false,
    reviewingId: '',
    loadFailed: false
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({
      pending: [],
      handled: [],
      loading: true,
      loadFailed: false
    });

    try {
      const result = await cloudApi.getPlatformReviewData();
      if (result && result.ok) {
        this.setData({
          pending: (result.pending || []).map(item => ({
            ...item,
            statusText: STATUS_TEXT[item.status] || '待审核'
          })),
          handled: (result.handled || []).map(item => ({
            ...item,
            statusText: STATUS_TEXT[item.status] || '待审核'
          })),
          loading: false
        });
        return;
      }
    } catch (error) {
      console.warn('getPlatformReviewData failed', error);
    }
    this.setData({ loading: false, loadFailed: true });
  },

  async review(event) {
    const { id, status } = event.currentTarget.dataset;
    if (this.data.reviewingId) {
      return;
    }

    this.setData({ reviewingId: id });
    try {
      const result = await cloudApi.reviewAdminApplication(id, status);
      if (!result || !result.ok) {
        this.setData({ reviewingId: '' });
        wx.showToast({ title: result.reason || '处理失败，请稍后重试', icon: 'none' });
        return;
      }
    } catch (error) {
      this.setData({ reviewingId: '' });
      wx.showToast({ title: '审核失败，请检查网络或云函数配置', icon: 'none' });
      return;
    }

    this.setData({ reviewingId: '' });
    wx.showToast({ title: status === 'approved' ? '已通过' : '已拒绝', icon: 'success' });
    this.loadData();
  }
});
