const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const PLATFORM_ADMIN_OPENIDS = [
  'omhZU3Y6E3KbPY724xQlLOiC8au4'
];

function normalizeOpenid(value) {
  return String(value || '').trim().replace(/\s/g, '').replace(/0/g, 'O');
}

function isPlatformAdmin(openid) {
  const normalizedOpenid = normalizeOpenid(openid);
  return PLATFORM_ADMIN_OPENIDS.some(item => normalizeOpenid(item) === normalizedOpenid);
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

async function canManageClub(openid, clubId) {
  if (isPlatformAdmin(openid)) {
    return true;
  }

  const clubResult = await db.collection('clubs').doc(clubId).get();
  const club = clubResult.data;
  return Boolean(club && getAdminOpenids(club).includes(openid));
}

async function isEmailVerified(openid) {
  const result = await db.collection('users').where({
    _openid: openid
  }).limit(1).get();
  return Boolean(result.data[0] && result.data[0].emailVerified);
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const activityId = String(event.activityId || '').trim();

  if (!activityId) {
    return {
      ok: false,
      reason: '缺少活动 ID'
    };
  }

  if (!(await isEmailVerified(OPENID))) {
    return {
      ok: false,
      reason: '请先完成学校邮箱认证',
      needEmailAuth: true
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

  const allowed = await canManageClub(OPENID, activity.clubId);
  if (!allowed) {
    return {
      ok: false,
      reason: '你没有删除该活动的权限'
    };
  }

  await db.collection('activities').doc(activityId).update({
    data: {
      status: 'deleted',
      deletedBy: OPENID,
      deletedAt: db.serverDate(),
      updatedBy: OPENID,
      updatedAt: db.serverDate()
    }
  });

  return {
    ok: true,
    id: activityId
  };
};
