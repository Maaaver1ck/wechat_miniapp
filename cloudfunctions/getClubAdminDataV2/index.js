const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

const PLATFORM_ADMIN_OPENIDS = [
  'omhZU3Y6E3KbPY724xQlLOiC8au4'
];

function normalizeOpenid(value) {
  return String(value || '').trim().replace(/\s/g, '').replace(/0/g, 'O');
}

function isPlatformAdminOpenid(openid) {
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

function normalizeActivity(activity, registrationCounts, clubMap) {
  const registeredCount = registrationCounts[activity._id] || 0;
  const quota = Number(activity.quota || 0);
  return {
    id: activity._id,
    title: activity.title,
    clubId: activity.clubId,
    clubName: clubMap[activity.clubId] || '未知社团',
    category: activity.category,
    startTime: activity.startTime,
    endTime: activity.endTime,
    deadline: activity.deadline,
    location: activity.location,
    quota,
    coverTone: activity.coverTone || 'green',
    description: activity.description,
    status: activity.status || 'open',
    registeredCount,
    spotsLeft: Math.max(quota - registeredCount, 0),
    isFull: quota > 0 && registeredCount >= quota
  };
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const openid = String(OPENID || '').trim();
  const isPlatformAdmin = isPlatformAdminOpenid(openid);

  const clubsResult = await db.collection('clubs').limit(100).get();
  const clubs = clubsResult.data
    .filter(club => club.status !== 'deleted')
    .filter(club => isPlatformAdmin || getAdminOpenids(club).includes(openid))
    .map(club => ({
      id: club._id,
      name: club.name,
      intro: club.intro,
      adminOpenids: getAdminOpenids(club),
      status: club.status || 'active'
    }));

  const clubIds = clubs.map(club => club.id);
  if (!clubIds.length) {
    return {
      ok: true,
      clubs: [],
      activities: []
    };
  }

  const [activitiesResult, registrationsResult] = await Promise.all([
    db.collection('activities').where({
      clubId: _.in(clubIds)
    }).orderBy('startTime', 'desc').limit(100).get(),
    db.collection('registrations').where({
      status: 'active'
    }).limit(1000).get()
  ]);

  const clubMap = {};
  clubs.forEach(club => {
    clubMap[club.id] = club.name;
  });

  const registrationCounts = {};
  registrationsResult.data.forEach(item => {
    registrationCounts[item.activityId] = (registrationCounts[item.activityId] || 0) + 1;
  });

  return {
    ok: true,
    clubs,
    activities: activitiesResult.data
      .filter(activity => activity.status !== 'deleted')
      .map(activity => normalizeActivity(activity, registrationCounts, clubMap))
  };
};
