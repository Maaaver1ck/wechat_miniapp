const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const { activityId } = event;

  if (!activityId) {
    return {
      ok: false,
      reason: '缺少活动 ID'
    };
  }

  const activityResult = await db.collection('activities').doc(activityId).get();
  const activity = activityResult.data;
  const clubResult = await db.collection('clubs').doc(activity.clubId).get();
  const countResult = await db.collection('registrations').where({
    activityId,
    status: 'active'
  }).count();
  const myRegistration = await db.collection('registrations').where({
    activityId,
    _openid: OPENID,
    status: 'active'
  }).limit(1).get();

  const quota = Number(activity.quota || 0);
  const registeredCount = countResult.total;

  return {
    ok: true,
    activity: {
      id: activity._id,
      title: activity.title,
      clubId: activity.clubId,
      clubName: clubResult.data.name,
      category: activity.category,
      startTime: activity.startTime,
      duration: activity.duration || activity.endTime || '',
      endTime: activity.endTime,
      deadline: activity.deadline,
      location: activity.location,
      quota,
      coverTone: activity.coverTone || 'green',
      description: activity.description,
      status: activity.status || 'open',
      registeredCount,
      spotsLeft: Math.max(quota - registeredCount, 0),
      isFull: quota > 0 && registeredCount >= quota,
      hasRegistered: myRegistration.data.length > 0
    }
  };
};
