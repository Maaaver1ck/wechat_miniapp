const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const PLATFORM_ADMIN_OPENIDS = ['omhZU3Y6E3KbPY724xQlLOiC8au4'];

function isPlatformAdmin(openid) {
  return PLATFORM_ADMIN_OPENIDS.includes(String(openid || '').trim());
}

function formatDate(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  const pad = num => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  if (!isPlatformAdmin(OPENID)) {
    return {
      ok: false,
      reason: '没有平台审核权限'
    };
  }

  const [clubsResult, applicationsResult] = await Promise.all([
    db.collection('clubs').limit(100).get(),
    db.collection('admin_applications').orderBy('createdAt', 'desc').limit(200).get()
  ]);

  const clubMap = {};
  clubsResult.data.forEach(club => {
    if (club.status !== 'deleted') {
      clubMap[club._id] = club.name;
    }
  });

  const items = applicationsResult.data.map(item => ({
    id: item._id,
    clubId: item.clubId,
    clubName: clubMap[item.clubId] || '未知社团',
    reason: item.reason,
    status: item.status || 'pending',
    createdAt: formatDate(item.createdAt),
    reviewedAt: formatDate(item.reviewedAt),
    applicantOpenid: item._openid,
    applicantProfile: item.applicantProfile || {}
  }));

  return {
    ok: true,
    pending: items.filter(item => item.status === 'pending'),
    handled: items.filter(item => item.status !== 'pending'),
    pendingCount: items.filter(item => item.status === 'pending').length
  };
};
