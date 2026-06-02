const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    categories: store.CATEGORIES,
    activeCategory: '全部',
    keyword: '',
    activities: [],
    filteredActivities: [],
    loading: false,
    loadFailed: false,
    debugMessage: '页面已加载，等待首页数据同步。',
    runtimeError: ''
  },

  onShow() {
    const app = getApp();
    this.setData({
      debugMessage: '页面已进入，准备调用 getHomeData。',
      runtimeError: app.globalData.runtimeError || wx.getStorageSync('runtime_error_message') || ''
    });
    this.loadActivities();
  },

  async loadActivities() {
    this.setData({
      activities: [],
      filteredActivities: [],
      loading: true,
      loadFailed: false,
      debugMessage: '正在调用云函数 getHomeData...'
    });

    try {
      const result = await cloudApi.getHomeData();
      if (result && result.ok) {
        const activityCount = (result.activities || []).length;
        this.setData({
          activities: result.activities || [],
          loading: false,
          debugMessage: `getHomeData 调用成功，返回 ${activityCount} 条活动。`
        }, () => this.applyFilters());
        return;
      }
      this.setData({
        loading: false,
        loadFailed: true,
        debugMessage: `getHomeData 返回异常：${JSON.stringify(result || {})}`
      });
    } catch (error) {
      console.warn('getHomeData failed', error);
      this.setData({
        loading: false,
        loadFailed: true,
        debugMessage: `getHomeData 调用失败：${error && error.errMsg ? error.errMsg : '未知错误'}`
      });
    }
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value }, () => this.applyFilters());
  },

  onCategoryTap(event) {
    this.setData({ activeCategory: event.currentTarget.dataset.category }, () => this.applyFilters());
  },

  applyFilters() {
    const keyword = this.data.keyword.trim().toLowerCase();
    const presetCategories = this.data.categories.filter(item => item !== '全部');
    const filteredActivities = this.data.activities.filter(activity => {
      const normalizedCategory = presetCategories.includes(activity.category) ? activity.category : '其他';
      const matchCategory = this.data.activeCategory === '全部' || normalizedCategory === this.data.activeCategory;
      const text = `${activity.title} ${activity.clubName} ${activity.location}`.toLowerCase();
      return matchCategory && (!keyword || text.includes(keyword));
    });
    this.setData({ filteredActivities });
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${event.currentTarget.dataset.id}`
    });
  }
});
