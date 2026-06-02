const cloud = require('wx-server-sdk');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

const EMAIL_DOMAIN = 'sjtu.edu.cn';
const CODE_TTL_MS = 10 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isSchoolEmail(email) {
  const parts = email.split('@');
  return parts.length === 2 && Boolean(parts[0]) && parts[1] === EMAIL_DOMAIN;
}

function createCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code, salt) {
  return crypto.createHash('sha256').update(`${code}:${salt}`).digest('hex');
}

function readEnv(name, fallback) {
  return String(process.env[name] || fallback || '').trim();
}

async function sendWithSmtp({ to, code }) {
  const host = readEnv('SMTP_HOST', 'smtp.qq.com');
  const port = Number(readEnv('SMTP_PORT', '465'));
  const secure = readEnv('SMTP_SECURE', 'true') !== 'false';
  const user = readEnv('SMTP_USER', '653848616@qq.com');
  const pass = readEnv('SMTP_PASS');
  const from = readEnv('SMTP_FROM', `校园社团活动 <${user}>`);

  if (!user || !pass) {
    throw new Error('请先在云函数环境变量中配置 SMTP_USER 和 SMTP_PASS');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });

  await transporter.sendMail({
    from,
    to,
    subject: '校园社团活动身份认证验证码',
    html: [
      '<p>你好，</p>',
      '<p>你正在绑定上海交通大学邮箱，验证码为：</p>',
      `<p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p>`,
      '<p>验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p>'
    ].join(''),
    text: `你正在绑定上海交通大学邮箱，验证码为：${code}。验证码 10 分钟内有效。`
  });
}

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const email = normalizeEmail(event.email);

  if (!isSchoolEmail(email)) {
    return {
      ok: false,
      reason: '请填写 sjtu.edu.cn 学校邮箱'
    };
  }

  const verifiedUsers = await db.collection('users').where({
    schoolEmail: email,
    emailVerified: true
  }).limit(1).get();

  const verifiedUser = verifiedUsers.data[0];
  if (verifiedUser && verifiedUser._openid !== OPENID && verifiedUser.openid !== OPENID) {
    return {
      ok: false,
      reason: '该学校邮箱已绑定其他账号'
    };
  }

  const recent = await db.collection('email_verifications').where({
    _openid: OPENID,
    email,
    createdAt: _.gt(new Date(Date.now() - SEND_COOLDOWN_MS))
  }).limit(1).get();

  if (recent.data.length) {
    return {
      ok: false,
      reason: '验证码发送太频繁，请稍后再试'
    };
  }

  const code = createCode();
  const salt = crypto.randomBytes(12).toString('hex');
  const now = Date.now();

  await sendWithSmtp({
    to: email,
    code
  });

  await db.collection('email_verifications').add({
    data: {
      _openid: OPENID,
      openid: OPENID,
      email,
      codeHash: hashCode(code, salt),
      codeSalt: salt,
      expiresAt: new Date(now + CODE_TTL_MS),
      attempts: 0,
      used: false,
      createdAt: db.serverDate()
    }
  });

  return {
    ok: true,
    email,
    expiresIn: CODE_TTL_MS / 1000
  };
};
