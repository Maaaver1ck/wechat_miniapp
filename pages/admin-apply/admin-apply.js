const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

const STATUS_TEXT = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
};

Page({
  data: {
    clubs: [],
    clubIndex: 0,
    selectedClubName: '请选择社团',
    applications: [],
    loading: false,
    submitting: false,
    loadFailed: false
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({
      clubs: [],
      selectedClubName: '请选择社团',
      applications: [],
      loading: true,
      loadFailed: false
    });

    try {
      const result = await cloudApi.getAdminApplicationData();
      if (result && result.ok) {
        const clubs = result.clubs || [];
        const applications = (result.applications || []).map(item => ({
          ...item,
          statusText: STATUS_TEXT[item.status] || item.status
        }));
        this.setData({
          clubs,
          selectedClubName: (clubs[this.data.clubIndex] || {}).name || '请选择社团',
          applications,
          loading: false
        });
        return;
      }
    } catch (error) {
      console.warn('getAdminApplicationData failed', error);
    }
    this.setData({ loading: false, loadFailed: true });
  },

  onClubChange(event) {
    const clubIndex = Number(event.detail.value);
    this.setData({
      clubIndex,
      selectedClubName: (this.data.clubs[clubIndex] || {}).name || '请选择社团'
    });
  },

  async submitApplication(event) {
    if (this.data.submitting) {
      return;
    }
    if (!store.isProfileComplete()) {
      wx.showToast({ title: '请先完善学生资料', icon: 'none' });
      wx.navigateTo({ url: '/pages/profile-form/profile-form' });
      return;
    }

    if (!store.isEmailVerified()) {
      wx.showToast({ title: '请先完成学校邮箱认证', icon: 'none' });
      wx.navigateTo({ url: '/pages/email-auth/email-auth' });
      return;
    }

    const club = this.data.clubs[this.data.clubIndex];
    const reason = event.detail.value.reason.trim();
    if (!club || !reason) {
      wx.showToast({ title: '请选择社团并填写说明', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const result = await cloudApi.submitAdminApplication(club.id, reason);
      if (!result || !result.ok) {
        this.setData({ submitting: false });
        if (result && result.needProfile) {
          wx.navigateTo({ url: '/pages/profile-form/profile-form' });
          return;
        }
        if (result && result.needEmailAuth) {
          wx.navigateTo({ url: '/pages/email-auth/email-auth' });
          return;
        }
        wx.showToast({ title: result.reason || '提交失败，请稍后重试', icon: 'none' });
        return;
      }
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({ title: '提交失败，请检查网络或云函数配置', icon: 'none' });
      return;
    }

    this.setData({ submitting: false });
    wx.showToast({ title: '已提交', icon: 'success' });
    this.loadData();
  }
});
