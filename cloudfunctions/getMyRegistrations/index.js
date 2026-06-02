const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

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
  const registrationsResult = await db.collection('registrations').where({
    _openid: OPENID
  }).orderBy('createdAt', 'desc').limit(100).get();

  const registrations = registrationsResult.data;
  const activityIds = [...new Set(registrations.map(item => item.activityId).filter(Boolean))];
  let activities = [];
  let clubs = [];

  if (activityIds.length) {
    const activitiesResult = await db.collection('activities').where({
      _id: _.in(activityIds)
    }).limit(100).get();
    activities = activitiesResult.data;

    const clubIds = [...new Set(activities.map(item => item.clubId).filter(Boolean))];
    if (clubIds.length) {
      const clubsResult = await db.collection('clubs').where({
        _id: _.in(clubIds)
      }).limit(100).get();
      clubs = clubsResult.data;
    }
  }

  const clubMap = {};
  clubs.forEach(club => {
    clubMap[club._id] = club.name;
  });

  const activityMap = {};
  activities.forEach(activity => {
    activityMap[activity._id] = {
      id: activity._id,
      title: activity.title,
      clubId: activity.clubId,
      clubName: clubMap[activity.clubId] || '未知社团',
      category: activity.category,
      startTime: activity.startTime,
      duration: activity.duration || activity.endTime || '',
      endTime: activity.endTime,
      deadline: activity.deadline,
      location: activity.location,
      quota: Number(activity.quota || 0),
      coverTone: activity.coverTone || 'green',
      description: activity.description,
      status: activity.status || 'open'
    };
  });

  return {
    ok: true,
    items: registrations
      .filter(item => activityMap[item.activityId])
      .map(item => ({
        id: item._id,
        activityId: item.activityId,
        status: item.status,
        createdAt: formatDate(item.createdAt),
        cancelledAt: formatDate(item.cancelledAt),
        profileSnapshot: item.profileSnapshot,
        activity: activityMap[item.activityId]
      }))
  };
};
