const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    activity: null,
    activeItems: [],
    cancelledItems: []
  },

  onLoad(options) {
    this.activityId = options.id;
    this.setData({
      activity: null,
      activeItems: [],
      cancelledItems: []
    });
    this.loadCloudData();
  },

  async loadCloudData() {
    try {
      const result = await cloudApi.getRegistrationList(this.activityId);
      if (!result || !result.ok) {
        wx.showToast({ title: result.reason || '获取名单失败', icon: 'none' });
        return;
      }
      this.setData({
        activity: result.activity,
        activeItems: result.activeItems || [],
        cancelledItems: result.cancelledItems || []
      });
    } catch (error) {
      wx.showToast({ title: '云端名单获取失败', icon: 'none' });
    }
  }
});
