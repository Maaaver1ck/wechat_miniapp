const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const PLATFORM_ADMIN_OPENIDS = ['omhZU3Y6E3KbPY724xQlLOiC8au4'];

function isPlatformAdmin(openid) {
  return PLATFORM_ADMIN_OPENIDS.includes(String(openid || '').trim());
}

function uniqueOpenids(list, openid) {
  const next = Array.isArray(list) ? list.slice() : [];
  if (!next.includes(openid)) {
    next.push(openid);
  }
  return next;
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const applicationId = String(event.applicationId || '').trim();
  const status = String(event.status || '').trim();

  if (!isPlatformAdmin(OPENID)) {
    return {
      ok: false,
      reason: '没有平台审核权限'
    };
  }

  if (!applicationId || !['approved', 'rejected'].includes(status)) {
    return {
      ok: false,
      reason: '审核参数不正确'
    };
  }

  const applicationResult = await db.collection('admin_applications').doc(applicationId).get();
  const application = applicationResult.data;
  if (!application) {
    return {
      ok: false,
      reason: '申请记录不存在'
    };
  }

  if (application.status !== 'pending') {
    return {
      ok: false,
      reason: '该申请已处理'
    };
  }

  await db.collection('admin_applications').doc(applicationId).update({
    data: {
      status,
      reviewedAt: db.serverDate(),
      reviewedBy: OPENID,
      updatedAt: db.serverDate()
    }
  });

  if (status === 'approved') {
    const clubResult = await db.collection('clubs').doc(application.clubId).get();
    const club = clubResult.data;
    if (club) {
      await db.collection('clubs').doc(application.clubId).update({
        data: {
          adminOpenids: uniqueOpenids(club.adminOpenids || club.adminopenids || [], application.applicantOpenid || application._openid),
          updatedAt: db.serverDate()
        }
      });
    }
  }

  return {
    ok: true
  };
};
