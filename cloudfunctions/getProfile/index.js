const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const result = await db.collection('users').where({
    _openid: OPENID
  }).limit(1).get();

  if (!result.data.length) {
    return {
      ok: true,
      profile: null
    };
  }

  const user = result.data[0];
  return {
    ok: true,
    profile: {
      id: user._id,
      openid: OPENID,
      name: user.name,
      studentId: user.studentId,
      college: user.college,
      major: user.major,
      phone: user.phone,
      completed: Boolean(user.completed),
      schoolEmail: user.schoolEmail || '',
      emailVerified: Boolean(user.emailVerified),
      emailVerifiedAt: user.emailVerifiedAt || null,
      identityStatus: user.identityStatus || (user.emailVerified ? 'verified' : 'unverified')
    }
  };
};
