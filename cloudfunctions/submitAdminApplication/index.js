const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function normalizeReason(value) {
  return String(value || '').trim();
}

function getAdminOpenids(club) {
  if (Array.isArray(club.adminOpenids)) {
    return club.adminOpenids;
  }
  if (Array.isArray(club.adminopenids)) {
    return club.adminopenids;
  }
  return [];
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const clubId = String(event.clubId || '').trim();
  const reason = normalizeReason(event.reason);

  if (!clubId || !reason) {
    return {
      ok: false,
      reason: '请选择社团并填写说明'
    };
  }

  const [userResult, clubResult, pendingResult] = await Promise.all([
    db.collection('users').where({
      _openid: OPENID
    }).limit(1).get(),
    db.collection('clubs').doc(clubId).get(),
    db.collection('admin_applications').where({
      _openid: OPENID,
      clubId,
      status: 'pending'
    }).limit(1).get()
  ]);

  const user = userResult.data[0];
  const club = clubResult.data;

  if (!user || !user.completed) {
    return {
      ok: false,
      reason: '请先完善学生资料',
      needProfile: true
    };
  }

  if (!club || club.status === 'deleted') {
    return {
      ok: false,
      reason: '社团不存在'
    };
  }

  if (getAdminOpenids(club).includes(OPENID)) {
    return {
      ok: false,
      reason: '你已经是该社团管理员'
    };
  }

  if (pendingResult.data.length) {
    return {
      ok: false,
      reason: '该社团已有待审核申请'
    };
  }

  await db.collection('admin_applications').add({
    data: {
      clubId,
      reason,
      status: 'pending',
      applicantOpenid: OPENID,
      applicantProfile: {
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
