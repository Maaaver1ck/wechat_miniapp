const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function normalizeProfile(profile) {
  return {
    name: String(profile.name || '').trim(),
    studentId: String(profile.studentId || '').trim(),
    college: String(profile.college || '').trim(),
    major: String(profile.major || '').trim(),
    phone: String(profile.phone || '').trim()
  };
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const profile = normalizeProfile(event.profile || {});
  const missing = Object.keys(profile).some(key => !profile[key]);

  if (missing) {
    return {
      ok: false,
      reason: '请完整填写资料'
    };
  }

  const collection = db.collection('users');
  let existing = await collection.where({
    _openid: OPENID
  }).limit(1).get();

  if (!existing.data.length) {
    existing = await collection.where({
      openid: OPENID
    }).limit(1).get();
  }

  if (!existing.data.length) {
    existing = await collection.where({
      studentId: profile.studentId
    }).limit(1).get();
  }

  const existingUser = existing.data[0] || null;
  const existingBelongsToCurrentUser = Boolean(existingUser && (existingUser._openid === OPENID || existingUser.openid === OPENID));
  if (existingUser && !existingBelongsToCurrentUser && existingUser.emailVerified) {
    return {
      ok: false,
      reason: '该学号已绑定其他账号'
    };
  }

  const data = {
    _openid: OPENID,
    openid: OPENID,
    ...profile,
    completed: true,
    updatedAt: db.serverDate()
  };

  if (existingUser && !existingBelongsToCurrentUser) {
    data.schoolEmail = '';
    data.emailVerified = false;
    data.emailVerifiedAt = null;
    data.identityStatus = 'unverified';
  }

  if (existing.data.length) {
    await collection.doc(existing.data[0]._id).update({
      data
    });
  } else {
    await collection.add({
      data: {
        ...data,
        createdAt: db.serverDate()
      }
    });
  }

  return {
    ok: true,
    profile: {
      openid: OPENID,
      ...profile,
      completed: true,
      schoolEmail: existingBelongsToCurrentUser ? existingUser.schoolEmail || '' : '',
      emailVerified: Boolean(existingBelongsToCurrentUser && existingUser.emailVerified),
      emailVerifiedAt: existingBelongsToCurrentUser ? existingUser.emailVerifiedAt || null : null,
      identityStatus: existingBelongsToCurrentUser ? existingUser.identityStatus || 'unverified' : 'unverified'
    }
  };
};
