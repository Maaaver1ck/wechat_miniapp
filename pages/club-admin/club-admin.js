const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    clubs: [],
    clubIndex: 0,
    selectedClub: null,
    activities: [],
    loading: true,
    loadFailed: false,
    deletingId: ''
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({
      loading: true,
      loadFailed: false
    });

    try {
      const result = await cloudApi.getClubAdminData();
      if (result && result.ok) {
        this.applyAdminData(result.clubs || [], result.activities || []);
        this.setData({ loading: false });
        return;
      }
    } catch (error) {
      console.warn('getClubAdminData failed', error);
    }
    this.setData({ loading: false, loadFailed: true });
  },

  applyAdminData(clubs, allActivities) {
    const selectedClub = clubs[this.data.clubIndex] || clubs[0] || null;
    const clubIndex = selectedClub ? clubs.findIndex(club => club.id === selectedClub.id) : 0;
    const activities = selectedClub
      ? allActivities.filter(activity => activity.clubId === selectedClub.id)
      : [];

    this.setData({
      clubs,
      clubIndex: clubIndex < 0 ? 0 : clubIndex,
      selectedClub,
      activities
    });
  },

  onClubChange(event) {
    this.setData({ clubIndex: Number(event.detail.value) }, () => this.loadData());
  },

  createActivity() {
    if (!this.data.selectedClub) {
      wx.showToast({ title: '暂无可管理社团', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/activity-form/activity-form?clubId=${this.data.selectedClub.id}`
    });
  },

  editActivity(event) {
    wx.navigateTo({
      url: `/pages/activity-form/activity-form?id=${event.currentTarget.dataset.id}`
    });
  },

  viewRegistrations(event) {
    wx.navigateTo({
      url: `/pages/registration-list/registration-list?id=${event.currentTarget.dataset.id}`
    });
  },

  deleteActivity(event) {
    const { id, title } = event.currentTarget.dataset;
    if (!id || this.data.deletingId) {
      return;
    }

    wx.showModal({
      title: '删除活动',
      content: `确认删除「${title || '该活动'}」吗？删除后活动将不再展示，历史报名记录会保留。`,
      confirmText: '删除',
      confirmColor: '#b34d45',
      success: async res => {
        if (!res.confirm) {
          return;
        }

        this.setData({ deletingId: id });
        try {
          const result = await cloudApi.deleteActivity(id);
          if (!result || !result.ok) {
            this.setData({ deletingId: '' });
            wx.showToast({ title: (result && result.reason) || '删除失败，请稍后重试', icon: 'none' });
            return;
          }
        } catch (error) {
          this.setData({ deletingId: '' });
          wx.showToast({ title: '删除失败，请检查网络或云函数配置', icon: 'none' });
          return;
        }

        wx.showToast({ title: '已删除', icon: 'success' });
        this.setData({ deletingId: '' });
        this.loadData();
      }
    });
  }
});
