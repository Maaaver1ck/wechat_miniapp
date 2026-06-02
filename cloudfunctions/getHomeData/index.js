const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

function normalizeActivity(activity, clubMap, registrationCounts, openid) {
  const registeredCount = registrationCounts[activity._id] || 0;
  const quota = Number(activity.quota || 0);
  return {
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
    quota,
    coverTone: activity.coverTone || 'green',
    description: activity.description,
    status: activity.status || 'open',
    registeredCount,
    spotsLeft: Math.max(quota - registeredCount, 0),
    isFull: quota > 0 && registeredCount >= quota,
    hasRegistered: Boolean(activity.myRegistrationOpenids && activity.myRegistrationOpenids.includes(openid))
  };
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const [clubsResult, activitiesResult, registrationsResult] = await Promise.all([
    db.collection('clubs').where({
      status: _.neq('deleted')
    }).limit(100).get(),
    db.collection('activities').where({
      status: _.neq('deleted')
    }).orderBy('startTime', 'asc').limit(100).get(),
    db.collection('registrations').where({
      status: 'active'
    }).limit(1000).get()
  ]);

  const clubMap = {};
  clubsResult.data.forEach(club => {
    clubMap[club._id] = club.name;
  });

  const registrationCounts = {};
  const myRegistrationMap = {};
  registrationsResult.data.forEach(registration => {
    registrationCounts[registration.activityId] = (registrationCounts[registration.activityId] || 0) + 1;
    if (registration._openid === OPENID) {
      myRegistrationMap[registration.activityId] = true;
    }
  });

  const activities = activitiesResult.data.map(activity => normalizeActivity({
    ...activity,
    myRegistrationOpenids: myRegistrationMap[activity._id] ? [OPENID] : []
  }, clubMap, registrationCounts, OPENID));

  return {
    ok: true,
    clubs: clubsResult.data.map(club => ({
      id: club._id,
      name: club.name,
      intro: club.intro,
      adminOpenids: club.adminOpenids || [],
      status: club.status || 'active'
    })),
    activities
  };
};
