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

  const existing = await db.collection('registrations').where({
    activityId,
    _openid: OPENID,
    status: 'active'
  }).limit(1).get();

  if (!existing.data.length) {
    return {
      ok: false,
      reason: '没有找到有效报名'
    };
  }

  await db.collection('registrations').doc(existing.data[0]._id).update({
    data: {
      status: 'cancelled',
      cancelledAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  });

  return {
    ok: true
  };
};
