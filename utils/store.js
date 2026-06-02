const CURRENT_OPENID = 'omhZU3Y6E3KbPY724xQlLOiC8au4';

const KEYS = {
  profile: 'campus_profile'
};

const CATEGORIES = ['全部', '学术', '文艺', '体育', '公益', '竞赛', '其他'];

function read(key, fallback) {
  const value = wx.getStorageSync(key);
  return value || fallback;
}

function write(key, value) {
  wx.setStorageSync(key, value);
}

function getProfile() {
  return read(KEYS.profile, null);
}

function saveProfile(profile) {
  const completed = Boolean(profile.completed || (profile.name && profile.studentId && profile.college && profile.major && profile.phone));
  const normalized = {
    ...profile,
    openid: profile.openid || CURRENT_OPENID,
    name: profile.name,
    studentId: profile.studentId,
    college: profile.college,
    major: profile.major,
    phone: profile.phone,
    completed
  };
  write(KEYS.profile, normalized);
  return normalized;
}

function isProfileComplete() {
  const profile = getProfile();
  return Boolean(profile && profile.name && profile.studentId && profile.college && profile.major && profile.phone);
}

function isEmailVerified() {
  const profile = getProfile();
  return Boolean(profile && profile.emailVerified);
}

module.exports = {
  CURRENT_OPENID,
  CATEGORIES,
  getProfile,
  saveProfile,
  isProfileComplete,
  isEmailVerified
};
