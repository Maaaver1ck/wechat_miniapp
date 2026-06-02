const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    clubs: [],
    clubIndex: 0,
    selectedClub: null,
    activities: [],
    loading: true,
    loadFailed: false
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
  }
});
