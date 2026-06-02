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

function normalizeActivity(activity) {
  return {
    id: activity.id || '',
    title: String(activity.title || '').trim(),
    clubId: String(activity.clubId || '').trim(),
    category: String(activity.category || '').trim(),
    startTime: String(activity.startTime || '').trim(),
    endTime: String(activity.endTime || '').trim(),
    deadline: String(activity.deadline || '').trim(),
    location: String(activity.location || '').trim(),
    quota: Number(activity.quota || 0),
    coverTone: String(activity.coverTone || 'green').trim(),
    description: String(activity.description || '').trim()
  };
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
  const activity = normalizeActivity(event.activity || {});
  const required = ['title', 'clubId', 'category', 'startTime', 'endTime', 'deadline', 'location', 'description'];
  const missing = required.some(key => !activity[key]);

  if (missing || activity.quota <= 0) {
    return {
      ok: false,
      reason: '请完整填写活动信息'
    };
  }

  const allowed = await canManageClub(OPENID, activity.clubId);
  if (!allowed) {
    return {
      ok: false,
      reason: '你没有管理该社团的权限'
    };
  }

  const data = {
    title: activity.title,
    clubId: activity.clubId,
    category: activity.category,
    startTime: activity.startTime,
    endTime: activity.endTime,
    deadline: activity.deadline,
    location: activity.location,
    quota: activity.quota,
    coverTone: activity.coverTone,
    description: activity.description,
    status: 'open',
    updatedBy: OPENID,
    updatedAt: db.serverDate()
  };

  if (activity.id) {
    const existing = await db.collection('activities').doc(activity.id).get();
    if (!existing.data) {
      return {
        ok: false,
        reason: '活动不存在'
      };
    }

    const canManageExisting = await canManageClub(OPENID, existing.data.clubId);
    if (!canManageExisting) {
      return {
        ok: false,
        reason: '你没有编辑该活动的权限'
      };
    }

    await db.collection('activities').doc(activity.id).update({
      data
    });
    return {
      ok: true,
      id: activity.id
    };
  }

  const result = await db.collection('activities').add({
    data: {
      ...data,
      createdBy: OPENID,
      createdAt: db.serverDate()
    }
  });

  return {
    ok: true,
    id: result._id
  };
};
