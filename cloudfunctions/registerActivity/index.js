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

  const userResult = await db.collection('users').where({
    _openid: OPENID
  }).limit(1).get();
  const user = userResult.data[0];

  if (!user || !user.completed) {
    return {
      ok: false,
      reason: '请先完善个人资料',
      needProfile: true
    };
  }

  const activityResult = await db.collection('activities').doc(activityId).get();
  const activity = activityResult.data;

  if (!activity || activity.status === 'deleted') {
    return {
      ok: false,
      reason: '活动不存在'
    };
  }

  const existing = await db.collection('registrations').where({
    activityId,
    _openid: OPENID,
    status: 'active'
  }).limit(1).get();

  if (existing.data.length) {
    return {
      ok: false,
      reason: '你已报名该活动'
    };
  }

  const countResult = await db.collection('registrations').where({
    activityId,
    status: 'active'
  }).count();

  const quota = Number(activity.quota || 0);
  if (quota > 0 && countResult.total >= quota) {
    return {
      ok: false,
      reason: '活动名额已满'
    };
  }

  await db.collection('registrations').add({
    data: {
      _openid: OPENID,
      openid: OPENID,
      activityId,
      status: 'active',
      profileSnapshot: {
        name: user.name,
        studentId: user.studentId,
        college: user.college,
        major: user.major,
        phone: user.phone
      },
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  });

  return {
    ok: true
  };
};
