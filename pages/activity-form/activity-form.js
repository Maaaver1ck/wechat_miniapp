const store = require('../../utils/store');
const cloudApi = require('../../utils/cloudApi');

const MINUTE_OPTIONS = ['00', '15', '30', '45'];
const HOUR_OPTIONS = Array.from({ length: 25 }, (_, index) => `${index}`);
const REGISTRATION_METHODS = [
  { value: 'miniapp', label: '小程序报名' },
  { value: 'none', label: '无需报名' },
  { value: 'other', label: '其他' }
];

function pad(value) {
  return String(value).padStart(2, '0');
}

function getNowParts() {
  const now = new Date();
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`
  };
}

function parseDateTime(value) {
  const now = getNowParts();
  const match = String(value || '').trim().match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?/);
  return {
    date: match ? match[1] : now.date,
    time: match && match[2] ? match[2] : now.time
  };
}

function normalizeDurationText(hour, minute) {
  const parts = [];
  if (hour > 0) {
    parts.push(`${hour} 小时`);
  }
  if (minute > 0) {
    parts.push(`${minute} 分钟`);
  }
  return parts.join(' ') || '0 分钟';
}

function parseDuration(value) {
  const text = String(value || '').trim();
  const hourMatch = text.match(/(\d+)\s*小时/);
  const minuteMatch = text.match(/(\d+)\s*分钟/);
  const hour = hourMatch ? Number(hourMatch[1]) : 2;
  const minute = minuteMatch ? Number(minuteMatch[1]) : 0;
  const safeHour = Math.min(Math.max(hour, 0), HOUR_OPTIONS.length - 1);
  const safeMinute = MINUTE_OPTIONS.includes(pad(minute)) ? pad(minute) : '00';
  return {
    value: [safeHour, MINUTE_OPTIONS.indexOf(safeMinute)],
    text: normalizeDurationText(safeHour, Number(safeMinute))
  };
}

function getRegistrationMethodIndex(value) {
  const index = REGISTRATION_METHODS.findIndex(item => item.value === value);
  return index < 0 ? 0 : index;
}

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
    startDate: '',
    startClock: '',
    deadlineDate: '',
    deadlineClock: '',
    durationColumns: [HOUR_OPTIONS, MINUTE_OPTIONS],
    durationValue: [2, 0],
    durationText: '2 小时',
    registrationMethods: REGISTRATION_METHODS,
    registrationMethodIndex: 0,
    selectedRegistrationMethod: 'miniapp',
    selectedRegistrationMethodLabel: '小程序报名',
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
    const now = getNowParts();
    const defaultDuration = parseDuration('');

    this.setData({
      isEdit,
      clubs,
      activity: activity || {},
      clubIndex: 0,
      selectedClubName: '请选择社团',
      categoryIndex: 0,
      selectedCategory: this.data.categories[0],
      startDate: now.date,
      startClock: now.time,
      deadlineDate: now.date,
      deadlineClock: now.time,
      durationValue: defaultDuration.value,
      durationText: defaultDuration.text,
      registrationMethodIndex: 0,
      selectedRegistrationMethod: 'miniapp',
      selectedRegistrationMethodLabel: '小程序报名',
      loading: true,
      loadFailed: false
    });

    try {
      const adminResult = await cloudApi.getClubAdminData();
      if (adminResult && adminResult.needEmailAuth) {
        this.setData({ loading: false });
        wx.navigateTo({ url: '/pages/email-auth/email-auth' });
        return;
      }
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
      const startParts = parseDateTime(cloudActivity.startTime);
      const deadlineParts = parseDateTime(cloudActivity.deadline);
      const durationParts = parseDuration(cloudActivity.duration);
      const registrationMethodIndex = getRegistrationMethodIndex(cloudActivity.registrationMethod);
      const selectedRegistrationMethod = REGISTRATION_METHODS[registrationMethodIndex];
      this.setData({
        clubs: cloudClubs,
        activity: cloudActivity || {},
        clubIndex: nextClubIndex,
        selectedClubName: (cloudClubs[nextClubIndex] || {}).name || '请选择社团',
        categoryIndex: nextCategoryIndex,
        selectedCategory: this.data.categories[nextCategoryIndex],
        startDate: startParts.date,
        startClock: startParts.time,
        deadlineDate: deadlineParts.date,
        deadlineClock: deadlineParts.time,
        durationValue: durationParts.value,
        durationText: durationParts.text,
        registrationMethodIndex,
        selectedRegistrationMethod: selectedRegistrationMethod.value,
        selectedRegistrationMethodLabel: selectedRegistrationMethod.label,
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

  onStartDateChange(event) {
    this.setData({ startDate: event.detail.value });
  },

  onStartClockChange(event) {
    this.setData({ startClock: event.detail.value });
  },

  onDeadlineDateChange(event) {
    this.setData({ deadlineDate: event.detail.value });
  },

  onDeadlineClockChange(event) {
    this.setData({ deadlineClock: event.detail.value });
  },

  onDurationChange(event) {
    const value = event.detail.value.map(item => Number(item));
    const hour = Number(this.data.durationColumns[0][value[0]]);
    const minute = Number(this.data.durationColumns[1][value[1]]);
    this.setData({
      durationValue: value,
      durationText: normalizeDurationText(hour, minute)
    });
  },

  onRegistrationMethodChange(event) {
    const registrationMethodIndex = Number(event.detail.value);
    const selectedRegistrationMethod = this.data.registrationMethods[registrationMethodIndex];
    this.setData({
      registrationMethodIndex,
      selectedRegistrationMethod: selectedRegistrationMethod.value,
      selectedRegistrationMethodLabel: selectedRegistrationMethod.label
    });
  },

  async submitActivity(event) {
    if (this.data.submitting) {
      return;
    }
    const value = event.detail.value;
    const club = this.data.clubs[this.data.clubIndex];
    const category = this.data.categories[this.data.categoryIndex];
    const required = ['title', 'location', 'description'];
    const missing = required.some(field => !String(value[field] || '').trim());

    if (!club || missing || !this.data.startDate || !this.data.startClock || !this.data.deadlineDate || !this.data.deadlineClock) {
      wx.showToast({ title: '请完整填写活动信息', icon: 'none' });
      return;
    }

    const durationHour = Number(this.data.durationColumns[0][this.data.durationValue[0]]);
    const durationMinute = Number(this.data.durationColumns[1][this.data.durationValue[1]]);
    if (durationHour === 0 && durationMinute === 0) {
      wx.showToast({ title: '活动时长需大于 0', icon: 'none' });
      return;
    }

    if (this.data.selectedRegistrationMethod === 'miniapp' && Number(value.quota) <= 0) {
      wx.showToast({ title: '人数上限需大于 0', icon: 'none' });
      return;
    }

    if (this.data.selectedRegistrationMethod === 'other' && !String(value.registrationNote || '').trim()) {
      wx.showToast({ title: '请填写报名方法', icon: 'none' });
      return;
    }

    const payload = Object.assign({}, this.data.activity, value, {
      clubId: club.id,
      category: category,
      startTime: `${this.data.startDate} ${this.data.startClock}`,
      deadline: `${this.data.deadlineDate} ${this.data.deadlineClock}`,
      duration: this.data.durationText,
      endTime: '',
      quota: this.data.selectedRegistrationMethod === 'miniapp' ? Number(value.quota) : 0,
      registrationMethod: this.data.selectedRegistrationMethod,
      registrationNote: String(value.registrationNote || '').trim(),
      coverTone: this.data.activity.coverTone || 'green'
    });

    this.setData({ submitting: true });
    let savedId = payload.id;
    try {
      const result = await cloudApi.saveActivity(payload);
      if (!result || !result.ok) {
        this.setData({ submitting: false });
        if (result && result.needEmailAuth) {
          wx.navigateTo({ url: '/pages/email-auth/email-auth' });
          return;
        }
        wx.showToast({ title: (result && result.reason) || '保存失败，请检查活动信息', icon: 'none' });
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
