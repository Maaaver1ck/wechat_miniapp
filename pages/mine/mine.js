const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

Page({
  data: {
    profile: {},
    avatarText: '学',
    profileName: '未完善资料',
    profileLine: '报名活动前需要先完善资料',
    profileStatus: '待完善',
    emailStatus: '未认证',
    emailLine: '绑定交大学校邮箱',
    cloudOpenid: '',
    managedClubs: [],
    isPlatformAdmin: true,
    pendingCount: 0,
    runtimeError: ''
  },

  onShow() {
    const app = getApp();
    this.setData({
      runtimeError: app.globalData.runtimeError || wx.getStorageSync('runtime_error_message') || ''
    });
    this.refreshLocalData(store.getProfile() || {});
    this.loadCloudOpenid();
    this.loadProfile();
  },

  refreshLocalData(profile) {
    const app = getApp();
    this.setData({
      profile,
      avatarText: profile.name ? profile.name.slice(0, 1) : '学',
      profileName: profile.name || '未完善资料',
      profileLine: profile.completed ? `${profile.college} · ${profile.major}` : '报名活动前需要先完善资料',
      profileStatus: profile.completed ? '已完善' : '待完善',
      emailStatus: profile.emailVerified ? '已认证' : '未认证',
      emailLine: profile.emailVerified ? profile.schoolEmail : '报名和社团管理前需要认证',
      isPlatformAdmin: app.globalData.platformAdminOpenids.includes(store.CURRENT_OPENID)
    });
  },

  loadProfile() {
    cloudApi.getProfile()
      .then(result => {
        if (result && result.profile) {
          store.saveProfile(result.profile);
          this.refreshLocalData(result.profile);
        }
      })
      .catch(() => {});

    cloudApi.getPlatformReviewData()
      .then(result => {
        if (result && result.ok) {
          this.setData({
            pendingCount: result.pendingCount || 0
          });
        }
      })
      .catch(() => {});

    cloudApi.getClubAdminData()
      .then(result => {
        if (result && result.ok) {
          this.setData({
            managedClubs: result.clubs || []
          });
        }
      })
      .catch(() => {});
  },

  loadCloudOpenid() {
    if (!wx.cloud) {
      this.setData({ cloudOpenid: '当前基础库不支持云开发' });
      return;
    }

    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        const openid = res.result && res.result.openid;
        this.setData({ cloudOpenid: openid || '未获取到，请确认从小程序端运行' });
      },
      fail: error => {
        this.setData({ cloudOpenid: `获取失败：${error.errMsg || '请先部署 login 云函数'}` });
      }
    });
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile-form/profile-form' });
  },

  goEmailAuth() {
    wx.navigateTo({ url: '/pages/email-auth/email-auth' });
  },

  goRegistrations() {
    wx.navigateTo({ url: '/pages/my-registrations/my-registrations' });
  },

  goApply() {
    wx.navigateTo({ url: '/pages/admin-apply/admin-apply' });
  },

  goClubAdmin() {
    wx.navigateTo({ url: '/pages/club-admin/club-admin' });
  },

  goPlatformReview() {
    wx.navigateTo({ url: '/pages/platform-review/platform-review' });
  }
});
