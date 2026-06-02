const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

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
  const [clubsResult, applicationsResult] = await Promise.all([
    db.collection('clubs').limit(100).get(),
    db.collection('admin_applications').where({
      _openid: OPENID
    }).orderBy('createdAt', 'desc').limit(100).get()
  ]);

  const clubs = clubsResult.data
    .filter(club => club.status !== 'deleted')
    .map(club => ({
      id: club._id,
      name: club.name,
      intro: club.intro,
      adminOpenids: club.adminOpenids || club.adminopenids || [],
      status: club.status || 'active'
    }));

  const clubMap = {};
  clubs.forEach(club => {
    clubMap[club.id] = club.name;
  });

  const applications = applicationsResult.data.map(item => ({
    id: item._id,
    clubId: item.clubId,
    clubName: clubMap[item.clubId] || '未知社团',
    reason: item.reason,
    status: item.status || 'pending',
    createdAt: formatDate(item.createdAt),
    reviewedAt: formatDate(item.reviewedAt),
    applicantProfile: item.applicantProfile || {}
  }));

  return {
    ok: true,
    clubs,
    applications
  };
};
