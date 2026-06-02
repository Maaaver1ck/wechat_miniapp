const cloudApi = require('../../utils/cloudApi');
const store = require('../../utils/store');

const EMAIL_DOMAINS = ['sjtu.edu.cn', 'alumni.sjtu.edu.cn'];

function isSchoolEmail(email) {
  const parts = email.split('@');
  return parts.length === 2 && Boolean(parts[0]) && EMAIL_DOMAINS.includes(parts[1]);
}

Page({
  data: {
    email: '',
    code: '',
    profile: {},
    sending: false,
    verifying: false,
    countdown: 0
  },

  onLoad(options) {
    this.redirect = options.redirect ? decodeURIComponent(options.redirect) : '';
    this.timer = null;
  },

  onShow() {
    this.loadProfile();
  },

  onUnload() {
    this.clearCountdown();
  },

  loadProfile() {
    cloudApi.getProfile()
      .then(result => {
        if (result && result.profile) {
          store.saveProfile(result.profile);
          this.setData({
            profile: result.profile,
            email: result.profile.schoolEmail || this.data.email
          });
        }
      })
      .catch(() => {});
  },

  onEmailInput(event) {
    this.setData({ email: event.detail.value });
  },

  onCodeInput(event) {
    this.setData({ code: event.detail.value });
  },

  startCountdown(seconds) {
    this.clearCountdown();
    this.setData({ countdown: seconds });
    this.timer = setInterval(() => {
      const next = this.data.countdown - 1;
      if (next <= 0) {
        this.clearCountdown();
        this.setData({ countdown: 0 });
        return;
      }
      this.setData({ countdown: next });
    }, 1000);
  },

  clearCountdown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  async sendCode() {
    if (this.data.sending || this.data.countdown > 0) {
      return;
    }

    const email = this.data.email.trim().toLowerCase();
    if (!isSchoolEmail(email)) {
      wx.showToast({ title: '请填写交大学校邮箱', icon: 'none' });
      return;
    }

    this.setData({ sending: true });
    try {
      const result = await cloudApi.sendEmailCode(email);
      if (!result || !result.ok) {
        this.setData({ sending: false });
        wx.showToast({ title: (result && result.reason) || '发送失败，请稍后重试', icon: 'none' });
        return;
      }
      wx.showToast({ title: '验证码已发送', icon: 'success' });
      this.startCountdown(60);
    } catch (error) {
      this.setData({ sending: false });
      wx.showModal({
        title: '发送失败',
        content: (error && error.errMsg) || (error && error.message) || '请检查 sendEmailCode 云函数和 SMTP 环境变量。',
        showCancel: false
      });
      return;
    }
    this.setData({ sending: false });
  },

  async verifyCode() {
    if (this.data.verifying) {
      return;
    }

    const email = this.data.email.trim().toLowerCase();
    const code = this.data.code.trim();
    if (!isSchoolEmail(email) || !/^\d{6}$/.test(code)) {
      wx.showToast({ title: '请填写邮箱和 6 位验证码', icon: 'none' });
      return;
    }

    this.setData({ verifying: true });
    try {
      const result = await cloudApi.verifyEmailCode(email, code);
      if (!result || !result.ok) {
        this.setData({ verifying: false });
        wx.showToast({ title: (result && result.reason) || '认证失败，请稍后重试', icon: 'none' });
        return;
      }
      const profile = Object.assign({}, store.getProfile() || {}, {
        schoolEmail: result.schoolEmail || email,
        emailVerified: true,
        identityStatus: 'verified'
      });
      store.saveProfile(profile);
      wx.showToast({ title: '认证成功', icon: 'success' });
    } catch (error) {
      this.setData({ verifying: false });
      wx.showModal({
        title: '认证失败',
        content: (error && error.errMsg) || (error && error.message) || '请检查 verifyEmailCode 云函数配置。',
        showCancel: false
      });
      return;
    }

    this.setData({ verifying: false });
    setTimeout(() => {
      if (this.redirect) {
        wx.redirectTo({ url: this.redirect });
        return;
      }
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/mine/mine' }) });
    }, 350);
  }
});
