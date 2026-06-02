const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    isEdit: false,
    activity: {},
    clubs: [],
    clubIndex: 0,
    selectedClubName: '请选择社团',
    categories: store.CATEGORIES.filter(item => item !== '全部'),
    categoryIndex: 0,
    selectedCategory: '学术',
    loading: false,
    loadFailed: false,
    submitting: false
  },

  onLoad(options) {
    this.options = options;
    this.loadFormData(options);
  },

  async loadFormData(options) {
    const clubs = [];
    const activity = {};
    const isEdit = Boolean(options.id);

    this.setData({
      isEdit,
      clubs,
      activity: activity || {},
      clubIndex: 0,
      selectedClubName: '请选择社团',
      categoryIndex: 0,
      selectedCategory: this.data.categories[0],
      loading: true,
      loadFailed: false
    });

    try {
      const adminResult = await cloudApi.getClubAdminData();
      const cloudClubs = adminResult && adminResult.ok ? adminResult.clubs || [] : clubs;
      let cloudActivity = activity || {};

      if (options.id) {
        const detailResult = await cloudApi.getActivityDetail(options.id);
        if (detailResult && detailResult.ok && detailResult.activity) {
          cloudActivity = detailResult.activity;
        }
      }

      const nextClubId = cloudActivity.clubId || options.clubId;
      const nextClubIndex = Math.max(cloudClubs.findIndex(club => club.id === nextClubId), 0);
      const nextCategoryIndex = Math.max(this.data.categories.findIndex(item => item === cloudActivity.category), 0);
      this.setData({
        clubs: cloudClubs,
        activity: cloudActivity || {},
        clubIndex: nextClubIndex,
        selectedClubName: (cloudClubs[nextClubIndex] || {}).name || '请选择社团',
        categoryIndex: nextCategoryIndex,
        selectedCategory: this.data.categories[nextCategoryIndex],
        loading: false
      });
    } catch (error) {
      console.warn('load activity form cloud data failed', error);
      this.setData({ loading: false, loadFailed: true });
    }
  },

  onClubChange(event) {
    const clubIndex = Number(event.detail.value);
    this.setData({
      clubIndex,
      selectedClubName: (this.data.clubs[clubIndex] || {}).name || '请选择社团'
    });
  },

  onCategoryChange(event) {
    const categoryIndex = Number(event.detail.value);
    this.setData({
      categoryIndex,
      selectedCategory: this.data.categories[categoryIndex]
    });
  },

  async submitActivity(event) {
    if (this.data.submitting) {
      return;
    }
    const value = event.detail.value;
    const club = this.data.clubs[this.data.clubIndex];
    const category = this.data.categories[this.data.categoryIndex];
    const required = ['title', 'startTime', 'endTime', 'deadline', 'location', 'quota', 'description'];
    const missing = required.some(field => !String(value[field] || '').trim());

    if (!club || missing) {
      wx.showToast({ title: '请完整填写活动信息', icon: 'none' });
      return;
    }

    if (Number(value.quota) <= 0) {
      wx.showToast({ title: '人数上限需大于 0', icon: 'none' });
      return;
    }

    const payload = Object.assign({}, this.data.activity, value, {
      clubId: club.id,
      category: category,
      coverTone: this.data.activity.coverTone || 'green'
    });

    this.setData({ submitting: true });
    let savedId = payload.id;
    try {
      const result = await cloudApi.saveActivity(payload);
      if (!result || !result.ok) {
        this.setData({ submitting: false });
        wx.showToast({ title: result.reason || '保存失败，请检查活动信息', icon: 'none' });
        return;
      }
      savedId = result.id || savedId;
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({ title: '保存失败，请检查网络或云函数配置', icon: 'none' });
      return;
    }

    this.setData({ submitting: false });
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 350);
  }
});
