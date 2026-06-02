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

function formatDate(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  const pad = num => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function canManageClub(openid, clubId) {
  if (isPlatformAdmin(openid)) {
    return true;
  }

  const clubResult = await db.collection('clubs').doc(clubId).get();
  const club = clubResult.data;
  return Boolean(club && Array.isArray(club.adminOpenids) && club.adminOpenids.includes(openid));
}

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
  if (!activity) {
    return {
      ok: false,
      reason: '活动不存在'
    };
  }

  const allowed = await canManageClub(OPENID, activity.clubId);
  if (!allowed) {
    return {
      ok: false,
      reason: '你没有查看报名名单的权限'
    };
  }

  const registrationsResult = await db.collection('registrations').where({
    activityId
  }).orderBy('createdAt', 'desc').limit(200).get();

  const items = registrationsResult.data.map(item => ({
    id: item._id,
    status: item.status,
    profileSnapshot: item.profileSnapshot || {},
    createdAt: formatDate(item.createdAt),
    cancelledAt: formatDate(item.cancelledAt)
  }));

  return {
    ok: true,
    activity: {
      id: activity._id,
      title: activity.title,
      clubId: activity.clubId,
      category: activity.category,
      startTime: activity.startTime,
      location: activity.location,
      quota: Number(activity.quota || 0)
    },
    activeItems: items.filter(item => item.status === 'active'),
    cancelledItems: items.filter(item => item.status === 'cancelled')
  };
};
