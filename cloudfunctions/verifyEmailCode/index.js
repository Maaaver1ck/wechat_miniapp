const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

const EMAIL_DOMAIN = 'sjtu.edu.cn';
const MAX_ATTEMPTS = 5;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeCode(value) {
  return String(value || '').trim();
}

function isSchoolEmail(email) {
  const parts = email.split('@');
  return parts.length === 2 && Boolean(parts[0]) && parts[1] === EMAIL_DOMAIN;
}

function hashCode(code, salt) {
  return crypto.createHash('sha256').update(`${code}:${salt}`).digest('hex');
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const email = normalizeEmail(event.email);
  const code = normalizeCode(event.code);

  if (!isSchoolEmail(email) || !/^\d{6}$/.test(code)) {
    return {
      ok: false,
      reason: '邮箱或验证码格式不正确'
    };
  }

  const verifiedUsers = await db.collection('users').where({
    schoolEmail: email,
    emailVerified: true
  }).limit(1).get();

  const verifiedUser = verifiedUsers.data[0];
  if (verifiedUser && verifiedUser._openid !== OPENID && verifiedUser.openid !== OPENID) {
    return {
      ok: false,
      reason: '该学校邮箱已绑定其他账号'
    };
  }

  const verificationResult = await db.collection('email_verifications').where({
    _openid: OPENID,
    email,
    used: false
  }).orderBy('createdAt', 'desc').limit(1).get();

  if (!verificationResult.data.length) {
    return {
      ok: false,
      reason: '请先获取验证码'
    };
  }

  const verification = verificationResult.data[0];
  if (verification.expiresAt && new Date(verification.expiresAt).getTime() < Date.now()) {
    return {
      ok: false,
      reason: '验证码已过期，请重新获取'
    };
  }

  if (Number(verification.attempts || 0) >= MAX_ATTEMPTS) {
    return {
      ok: false,
      reason: '验证码错误次数过多，请重新获取'
    };
  }

  const expectedHash = hashCode(code, verification.codeSalt);
  if (expectedHash !== verification.codeHash) {
    await db.collection('email_verifications').doc(verification._id).update({
      data: {
        attempts: _.inc(1),
        updatedAt: db.serverDate()
      }
    });
    return {
      ok: false,
      reason: '验证码不正确'
    };
  }

  await db.collection('email_verifications').doc(verification._id).update({
    data: {
      used: true,
      usedAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  });

  const users = await db.collection('users').where({
    _openid: OPENID
  }).limit(1).get();

  const authData = {
    _openid: OPENID,
    openid: OPENID,
    schoolEmail: email,
    emailVerified: true,
    emailVerifiedAt: db.serverDate(),
    identityStatus: 'verified',
    updatedAt: db.serverDate()
  };

  if (users.data.length) {
    await db.collection('users').doc(users.data[0]._id).update({
      data: authData
    });
  } else {
    await db.collection('users').add({
      data: {
        ...authData,
        completed: false,
        createdAt: db.serverDate()
      }
    });
  }

  return {
    ok: true,
    schoolEmail: email,
    emailVerified: true
  };
};
