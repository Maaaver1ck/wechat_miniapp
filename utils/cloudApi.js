function callFunction(name, data) {
  data = data || {};
  if (!wx.cloud) {
    return Promise.reject(new Error('当前基础库不支持云开发'));
  }

  return wx.cloud.callFunction({
    name,
    data
  }).then(res => res.result);
}

function getProfile() {
  return callFunction('getProfile');
}

function saveProfile(profile) {
  return callFunction('saveProfile', {
    profile
  });
}

function sendEmailCode(email) {
  return callFunction('sendEmailCode', {
    email
  });
}

function verifyEmailCode(email, code) {
  return callFunction('verifyEmailCode', {
    email,
    code
  });
}

function getHomeData() {
  return callFunction('getHomeData');
}

function getActivityDetail(activityId) {
  return callFunction('getActivityDetail', {
    activityId
  });
}

function registerActivity(activityId) {
  return callFunction('registerActivity', {
    activityId
  });
}

function cancelRegistration(activityId) {
  return callFunction('cancelRegistration', {
    activityId
  });
}

function getMyRegistrations() {
  return callFunction('getMyRegistrations');
}

function getClubAdminData() {
  return callFunction('getClubAdminDataV2');
}

function saveActivity(activity) {
  return callFunction('saveActivity', {
    activity
  });
}

function deleteActivity(activityId) {
  return callFunction('deleteActivity', {
    activityId
  });
}

function getRegistrationList(activityId) {
  return callFunction('getRegistrationList', {
    activityId
  });
}

function getAdminApplicationData() {
  return callFunction('getAdminApplicationData');
}

function submitAdminApplication(clubId, reason) {
  return callFunction('submitAdminApplication', {
    clubId,
    reason
  });
}

function getPlatformReviewData() {
  return callFunction('getPlatformReviewData');
}

function reviewAdminApplication(applicationId, status) {
  return callFunction('reviewAdminApplication', {
    applicationId,
    status
  });
}

module.exports = {
  getProfile,
  saveProfile,
  sendEmailCode,
  verifyEmailCode,
  getHomeData,
  getActivityDetail,
  registerActivity,
  cancelRegistration,
  getMyRegistrations,
  getClubAdminData,
  saveActivity,
  deleteActivity,
  getRegistrationList,
  getAdminApplicationData,
  submitAdminApplication,
  getPlatformReviewData,
  reviewAdminApplication
};
