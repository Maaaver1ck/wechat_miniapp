# 校园社团活动报名小程序开发技术文档

## 1. 项目概述

本项目是一个基于微信小程序云开发的校园社团活动报名系统，面向学生、社团管理员和平台管理员三类角色。

核心能力包括：

- 学生浏览活动、按分类和关键词筛选活动、查看详情、报名和取消报名。
- 学生维护个人资料，查看自己的报名记录。
- 学生绑定 `sjtu.edu.cn` 学校邮箱完成身份认证。
- 学生申请成为社团管理员。
- 社团管理员发布、编辑和删除本社团活动，查看活动报名名单。
- 平台管理员审核社团管理员申请。

当前项目为原生微信小程序结构，前端使用 `WXML`、`WXSS`、`JavaScript`，后端使用微信云开发云函数和云数据库。

## 2. 技术栈

| 类型 | 技术 |
| --- | --- |
| 小程序框架 | 原生微信小程序 |
| 前端语言 | JavaScript / WXML / WXSS |
| 后端服务 | 微信云开发 CloudBase |
| 云函数运行时依赖 | `wx-server-sdk` |
| 数据存储 | 微信云数据库 |
| 小程序基础库 | `3.15.2` |
| AppID | `wxe579de091173783c` |
| 云环境 ID | `cloud1-0gdm8y4f0bf3a31c` |

## 3. 目录结构

```text
.
├── app.js                         # 小程序入口，初始化云开发和全局配置
├── app.json                       # 页面路由、窗口样式、TabBar 配置
├── app.wxss                       # 全局样式
├── project.config.json            # 微信开发者工具项目配置
├── sitemap.json                   # 小程序索引配置
├── utils
│   ├── cloudApi.js                # 前端云函数调用封装
│   └── store.js                   # 本地缓存、分类常量和当前 openid 配置
├── pages
│   ├── home                       # 活动首页
│   ├── activity-detail            # 活动详情、报名、取消报名
│   ├── profile-form               # 学生资料表单
│   ├── email-auth                 # 学校邮箱认证
│   ├── mine                       # 我的页面
│   ├── my-registrations           # 我的报名记录
│   ├── club-admin                 # 社团管理员后台
│   ├── activity-form              # 活动创建和编辑
│   ├── registration-list          # 活动报名名单
│   ├── admin-apply                # 社团管理员申请
│   └── platform-review            # 平台管理员审核
└── cloudfunctions
    ├── login
    ├── getProfile
    ├── saveProfile
    ├── sendEmailCode
    ├── verifyEmailCode
    ├── getHomeData
    ├── getActivityDetail
    ├── registerActivity
    ├── cancelRegistration
    ├── getMyRegistrations
    ├── getClubAdminDataV2
    ├── saveActivity
    ├── deleteActivity
    ├── getRegistrationList
    ├── getAdminApplicationData
    ├── submitAdminApplication
    ├── getPlatformReviewData
    └── reviewAdminApplication
```

## 4. 运行和部署

### 4.1 本地打开项目

1. 使用微信开发者工具打开项目根目录。
2. 确认 `project.config.json` 中的 `appid` 为目标小程序 AppID。
3. 确认 `app.js` 中的云环境 ID：

```js
wx.cloud.init({
  env: 'cloud1-0gdm8y4f0bf3a31c',
  traceUser: true
});
```

4. 在微信开发者工具中选择「云开发」，确认当前环境与代码中的 `env` 一致。

### 4.2 部署云函数

每个云函数目录都包含独立的 `package.json`，依赖为：

```json
{
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}
```

部署步骤：

1. 在微信开发者工具中右键 `cloudfunctions` 下的每个云函数目录。
2. 选择「上传并部署：云端安装依赖」。
3. 至少需要部署以下云函数：

```text
login
getProfile
saveProfile
sendEmailCode
verifyEmailCode
getHomeData
getActivityDetail
registerActivity
cancelRegistration
getMyRegistrations
getClubAdminDataV2
saveActivity
deleteActivity
getRegistrationList
getAdminApplicationData
submitAdminApplication
getPlatformReviewData
reviewAdminApplication
```

### 4.3 初始化云数据库集合

需要在云数据库中创建以下集合：

```text
users
clubs
activities
registrations
admin_applications
email_verifications
```

建议云函数端使用服务端权限访问数据库，客户端不直接写核心业务集合。

## 5. 页面路由

页面配置位于 `app.json`。

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 活动首页 | `pages/home/home` | 活动列表、分类筛选、关键词搜索 |
| 活动详情 | `pages/activity-detail/activity-detail` | 查看活动详情、报名、取消报名 |
| 个人资料 | `pages/profile-form/profile-form` | 新增或更新学生资料 |
| 学校邮箱认证 | `pages/email-auth/email-auth` | 发送验证码、绑定 `sjtu.edu.cn` 邮箱 |
| 我的 | `pages/mine/mine` | 资料入口、报名记录、管理员入口、openid 显示 |
| 我的报名 | `pages/my-registrations/my-registrations` | 当前用户报名记录 |
| 社团管理 | `pages/club-admin/club-admin` | 管理可负责社团的活动 |
| 活动表单 | `pages/activity-form/activity-form` | 创建或编辑活动 |
| 报名名单 | `pages/registration-list/registration-list` | 查看活动报名和取消记录 |
| 管理员申请 | `pages/admin-apply/admin-apply` | 申请成为社团管理员 |
| 平台审核 | `pages/platform-review/platform-review` | 平台管理员审核申请 |

TabBar 页面：

- `pages/home/home`，文本为「活动」。
- `pages/mine/mine`，文本为「我的」。

## 6. 前端模块说明

### 6.1 `utils/cloudApi.js`

该文件统一封装前端对云函数的调用：

```js
function callFunction(name, data) {
  return wx.cloud.callFunction({ name, data }).then(res => res.result);
}
```

业务页面不直接调用 `wx.cloud.callFunction`，而是通过该模块调用，例如：

- `getHomeData()`
- `getActivityDetail(activityId)`
- `registerActivity(activityId)`
- `cancelRegistration(activityId)`
- `saveProfile(profile)`
- `sendEmailCode(email)`
- `verifyEmailCode(email, code)`
- `saveActivity(activity)`
- `deleteActivity(activityId)`
- `reviewAdminApplication(applicationId, status)`

### 6.2 `utils/store.js`

该文件包含本地缓存和前端常量：

- `CURRENT_OPENID`：当前调试 openid。
- `CATEGORIES`：活动分类，包含 `全部`、`学术`、`文艺`、`体育`、`公益`、`竞赛`、`其他`。
- `getProfile()`：读取本地资料缓存。
- `saveProfile(profile)`：写入本地资料缓存。
- `isProfileComplete()`：判断资料是否完整。

注意：`CURRENT_OPENID` 目前写死为：

```js
const CURRENT_OPENID = 'omhZU3Y6E3KbPY724xQlLOiC8au4';
```

正式上线时，权限判断应以云函数中的 `cloud.getWXContext().OPENID` 为准，避免依赖前端写死值。

## 7. 云函数接口

所有云函数入口均为 `exports.main`，返回值约定通常包含：

```js
{
  ok: true,
  data: {}
}
```

失败时通常返回：

```js
{
  ok: false,
  reason: '失败原因'
}
```

### 7.1 用户和资料

| 云函数 | 入参 | 说明 |
| --- | --- | --- |
| `login` | 无 | 返回当前用户 `openid`、`appid`、`unionid` |
| `getProfile` | 无 | 获取当前用户资料 |
| `saveProfile` | `{ profile }` | 保存当前用户资料 |
| `sendEmailCode` | `{ email }` | 向 `sjtu.edu.cn` 学校邮箱发送验证码 |
| `verifyEmailCode` | `{ email, code }` | 校验验证码并绑定学校邮箱 |

`profile` 字段：

```js
{
  name: '姓名',
  studentId: '学号',
  college: '学院',
  major: '专业',
  phone: '手机号',
  schoolEmail: '学校邮箱',
  emailVerified: true
}
```

学校邮箱认证要求：

- 邮箱域名必须严格为 `sjtu.edu.cn`。
- 验证码 10 分钟内有效，60 秒内不能重复发送。
- 验证码哈希后保存在 `email_verifications`，不保存明文。
- 报名活动、申请社团管理员、社团管理操作都需要先完成邮箱认证。

QQ 邮箱 SMTP 发信云函数需要配置环境变量：

```text
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=653848616@qq.com
SMTP_PASS=QQ 邮箱 SMTP 授权码
SMTP_FROM=校园社团活动 <653848616@qq.com>
```

### 7.2 活动浏览和报名

| 云函数 | 入参 | 说明 |
| --- | --- | --- |
| `getHomeData` | 无 | 获取首页社团和活动列表 |
| `getActivityDetail` | `{ activityId }` | 获取活动详情、报名人数、当前用户是否已报名 |
| `registerActivity` | `{ activityId }` | 当前用户报名活动 |
| `cancelRegistration` | `{ activityId }` | 当前用户取消活动报名 |
| `getMyRegistrations` | 无 | 获取当前用户报名记录 |

报名前置条件：

- 用户必须已填写完整资料。
- 活动存在且未删除。
- 当前用户未重复报名同一活动。
- 活动名额未满。

取消报名不会删除报名记录，而是将 `registrations.status` 更新为 `cancelled`。

### 7.3 社团管理员

| 云函数 | 入参 | 说明 |
| --- | --- | --- |
| `getClubAdminDataV2` | 无 | 获取当前用户可管理社团和活动 |
| `saveActivity` | `{ activity }` | 创建或编辑活动 |
| `deleteActivity` | `{ activityId }` | 删除活动，实际将 `activities.status` 更新为 `deleted` |
| `getRegistrationList` | `{ activityId }` | 获取活动报名名单 |

活动保存字段：

```js
{
  id: '活动 ID，新增时为空',
  title: '活动标题',
  clubId: '社团 ID',
  category: '分类',
  startTime: '开始时间',
  duration: '活动时长，例如 2 小时',
  deadline: '报名截止时间',
  location: '地点',
  quota: 50,
  coverTone: 'green',
  description: '活动说明'
}
```

权限要求：

- 平台管理员可以管理所有社团活动。
- 社团管理员只能管理 `clubs.adminOpenids` 中包含自己 `openid` 的社团活动。

### 7.4 管理员申请和平台审核

| 云函数 | 入参 | 说明 |
| --- | --- | --- |
| `getAdminApplicationData` | 无 | 获取社团列表和当前用户提交过的申请 |
| `submitAdminApplication` | `{ clubId, reason }` | 提交社团管理员申请 |
| `getPlatformReviewData` | 无 | 平台管理员获取待审核和已处理申请 |
| `reviewAdminApplication` | `{ applicationId, status }` | 平台管理员审核申请 |

`status` 可选值：

```text
pending
approved
rejected
```

平台管理员 openid 目前配置在以下位置：

- `app.js`
- `cloudfunctions/getClubAdminDataV2/index.js`
- `cloudfunctions/saveActivity/index.js`
- `cloudfunctions/deleteActivity/index.js`
- `cloudfunctions/getRegistrationList/index.js`
- `cloudfunctions/getPlatformReviewData/index.js`
- `cloudfunctions/reviewAdminApplication/index.js`

当前平台管理员 openid：

```text
omhZU3Y6E3KbPY724xQlLOiC8au4
```

后续建议将平台管理员列表迁移到云数据库或环境变量，避免多处硬编码。

## 8. 云数据库设计

### 8.1 `users`

存储学生资料。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 数据库文档 ID |
| `_openid` | string | 微信云开发自动用户标识 |
| `openid` | string | 用户 openid |
| `name` | string | 姓名 |
| `studentId` | string | 学号 |
| `college` | string | 学院 |
| `major` | string | 专业 |
| `phone` | string | 手机号 |
| `completed` | boolean | 资料是否完整 |
| `schoolEmail` | string | 已绑定学校邮箱 |
| `emailVerified` | boolean | 是否完成学校邮箱认证 |
| `emailVerifiedAt` | Date | 邮箱认证时间 |
| `identityStatus` | string | 身份认证状态，当前使用 `verified` 或 `unverified` |
| `createdAt` | Date | 创建时间 |
| `updatedAt` | Date | 更新时间 |

### 8.2 `clubs`

存储社团信息。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 社团 ID |
| `name` | string | 社团名称 |
| `intro` | string | 社团简介 |
| `adminOpenids` | string[] | 社团管理员 openid 列表 |
| `status` | string | 状态，默认 `active`，删除态为 `deleted` |
| `createdAt` | Date | 创建时间 |
| `updatedAt` | Date | 更新时间 |

兼容字段：部分云函数兼容读取 `adminopenids`，但建议统一使用 `adminOpenids`。

### 8.3 `activities`

存储活动信息。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 活动 ID |
| `title` | string | 活动标题 |
| `clubId` | string | 所属社团 ID |
| `category` | string | 分类 |
| `startTime` | string | 开始时间 |
| `duration` | string | 活动时长 |
| `endTime` | string | 历史兼容字段，旧数据可能存在 |
| `deadline` | string | 报名截止时间 |
| `location` | string | 活动地点 |
| `quota` | number | 人数上限 |
| `coverTone` | string | 封面色调 |
| `description` | string | 活动说明 |
| `status` | string | 状态，默认 `open`，删除态为 `deleted` |
| `createdBy` | string | 创建者 openid |
| `updatedBy` | string | 更新者 openid |
| `createdAt` | Date | 创建时间 |
| `updatedAt` | Date | 更新时间 |

### 8.4 `registrations`

存储报名记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 报名记录 ID |
| `_openid` | string | 报名用户 openid |
| `openid` | string | 报名用户 openid |
| `activityId` | string | 活动 ID |
| `status` | string | `active` 或 `cancelled` |
| `profileSnapshot` | object | 报名时的用户资料快照 |
| `createdAt` | Date | 报名时间 |
| `cancelledAt` | Date | 取消时间 |
| `updatedAt` | Date | 更新时间 |

### 8.5 `admin_applications`

存储社团管理员申请。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 申请 ID |
| `_openid` | string | 申请人 openid |
| `clubId` | string | 申请管理的社团 ID |
| `reason` | string | 申请说明 |
| `status` | string | `pending`、`approved`、`rejected` |
| `applicantOpenid` | string | 申请人 openid |
| `applicantProfile` | object | 申请人资料快照 |
| `reviewedBy` | string | 审核人 openid |
| `createdAt` | Date | 申请时间 |
| `reviewedAt` | Date | 审核时间 |
| `updatedAt` | Date | 更新时间 |

### 8.6 `email_verifications`

存储学校邮箱验证码记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `_id` | string | 验证记录 ID |
| `_openid` | string | 发起认证用户 openid |
| `email` | string | 学校邮箱 |
| `codeHash` | string | 验证码哈希 |
| `codeSalt` | string | 哈希盐值 |
| `expiresAt` | Date | 过期时间 |
| `attempts` | number | 已尝试次数 |
| `used` | boolean | 是否已使用 |
| `createdAt` | Date | 创建时间 |
| `usedAt` | Date | 使用时间 |
| `updatedAt` | Date | 更新时间 |

## 9. 业务流程

### 9.1 学生报名流程

1. 学生进入首页，前端调用 `getHomeData`。
2. 学生进入活动详情，前端调用 `getActivityDetail`。
3. 学生点击报名，前端调用 `registerActivity`。
4. 云函数检查学生资料、学校邮箱认证、活动状态、重复报名和名额。
5. 报名成功后写入 `registrations`，状态为 `active`。

### 9.1.1 学校邮箱认证流程

1. 学生进入「学校邮箱认证」页面。
2. 前端调用 `sendEmailCode` 发送验证码。
3. 云函数检查邮箱域名和发送频率，并通过 QQ 邮箱 SMTP 发送邮件。
4. 学生输入验证码，前端调用 `verifyEmailCode`。
5. 云函数校验验证码，通过后更新 `users.emailVerified`。

### 9.2 取消报名流程

1. 学生在活动详情点击取消报名。
2. 前端调用 `cancelRegistration`。
3. 云函数查询当前用户的有效报名记录。
4. 将报名记录状态更新为 `cancelled`，并写入 `cancelledAt`。

### 9.3 社团管理员发布和删除活动流程

1. 用户进入「社团管理」，前端调用 `getClubAdminDataV2`。
2. 云函数根据用户 openid 过滤可管理社团。
3. 管理员进入活动表单页面。
4. 前端调用 `saveActivity`。
5. 云函数校验活动字段和管理权限。
6. 新增或更新 `activities`。
7. 管理员删除活动时，前端调用 `deleteActivity`。
8. 云函数校验管理权限后将 `activities.status` 更新为 `deleted`，保留历史报名记录。

### 9.4 管理员申请审核流程

1. 学生进入「管理员申请」页面，调用 `getAdminApplicationData`。
2. 学生提交申请，调用 `submitAdminApplication`。
3. 平台管理员进入「平台审核」，调用 `getPlatformReviewData`。
4. 平台管理员审核，调用 `reviewAdminApplication`。
5. 审核通过后，将申请人 openid 写入对应社团的 `adminOpenids`。

## 10. 权限模型

| 角色 | 判断方式 | 权限 |
| --- | --- | --- |
| 普通学生 | 已登录微信用户，报名前需完成学校邮箱认证 | 浏览活动、完善资料、报名、取消报名、申请管理员 |
| 社团管理员 | `clubs.adminOpenids` 包含当前 `OPENID`，且完成学校邮箱认证 | 管理对应社团活动、查看报名名单 |
| 平台管理员 | openid 在 `PLATFORM_ADMIN_OPENIDS` 中 | 审核管理员申请、管理所有社团活动 |

安全注意事项：

- 云函数中必须使用 `cloud.getWXContext().OPENID` 获取用户身份。
- 不应信任前端传入的 openid。
- 平台管理员列表目前硬编码在多个文件，修改时需要同步更新。

## 11. 开发规范

### 11.1 新增页面

新增页面时需要：

1. 在 `pages` 下创建同名目录。
2. 添加 `.js`、`.json`、`.wxml`、`.wxss` 四个文件。
3. 在 `app.json` 的 `pages` 数组中注册路由。

### 11.2 新增云函数

新增云函数时需要：

1. 在 `cloudfunctions` 下创建函数目录。
2. 添加 `index.js`、`package.json`、`config.json`。
3. 在微信开发者工具中上传并部署云函数。
4. 在 `utils/cloudApi.js` 中新增前端调用封装。

### 11.3 返回结构约定

建议所有云函数统一使用：

```js
return {
  ok: true,
  data: {}
};
```

错误返回：

```js
return {
  ok: false,
  reason: '错误说明'
};
```

当前项目部分接口直接返回 `profile`、`items`、`activity` 等顶层字段，后续可逐步统一。

## 12. 当前文件职责速览

本节按当前代码内容整理，便于接手时快速定位文件。

### 12.1 根目录文件

| 文件 | 主要内容 |
| --- | --- |
| `app.js` | 小程序生命周期入口；初始化云开发环境；记录运行错误；配置当前调试 openid 和平台管理员 openid。 |
| `app.json` | 注册全部页面路由；配置导航栏、背景色、底部 TabBar。 |
| `app.wxss` | 全局样式，包含页面背景、按钮、卡片、表单等通用视觉规范。 |
| `project.config.json` | 微信开发者工具项目配置，包含 AppID、云函数根目录、基础库版本和编译设置。 |
| `project.private.config.json` | 本机私有开发配置，通常不作为团队公共配置依据。 |
| `sitemap.json` | 小程序页面索引规则。 |
| `readme.md` | 项目说明、运行部署、接口、数据结构和开发规范。 |

### 12.2 工具模块

| 文件 | 主要内容 |
| --- | --- |
| `utils/cloudApi.js` | 对前端云函数调用进行集中封装；页面层通过这里调用后端接口。 |
| `utils/store.js` | 维护本地资料缓存、活动分类常量和当前调试 openid。 |

注意：`utils/store.js` 的 `CURRENT_OPENID` 只适合调试和页面显示。真实权限必须以后端云函数获取到的 `OPENID` 为准。

### 12.3 页面模块

| 页面目录 | 主要内容 |
| --- | --- |
| `pages/home` | 首页活动列表；调用 `getHomeData`；支持分类筛选和关键词搜索。 |
| `pages/activity-detail` | 活动详情；显示名额、社团、报名状态；调用报名和取消报名接口。 |
| `pages/profile-form` | 学生资料表单；调用 `getProfile` 和 `saveProfile`。 |
| `pages/email-auth` | 学校邮箱认证；发送验证码并绑定 `sjtu.edu.cn` 邮箱。 |
| `pages/mine` | 我的页面；展示资料状态、云端 openid、报名入口、管理员入口和平台审核入口。 |
| `pages/my-registrations` | 当前用户报名记录；调用 `getMyRegistrations`。 |
| `pages/admin-apply` | 社团管理员申请；加载可申请社团和历史申请；提交申请说明。 |
| `pages/club-admin` | 社团管理员后台；加载可管理社团和活动；进入新建、编辑、删除、名单页面。 |
| `pages/activity-form` | 活动创建和编辑表单；保存前校验必填字段和人数上限。 |
| `pages/registration-list` | 活动报名名单；区分有效报名和已取消报名。 |
| `pages/platform-review` | 平台管理员审核社团管理员申请；支持通过和拒绝。 |

每个页面目录均包含 `.js`、`.json`、`.wxml`、`.wxss` 四类文件：`.js` 负责逻辑，`.wxml` 负责结构，`.wxss` 负责样式，`.json` 负责页面级配置。

### 12.4 云函数模块

| 云函数目录 | 主要内容 |
| --- | --- |
| `login` | 返回当前微信用户身份信息。 |
| `getProfile` | 查询当前用户资料；没有资料时返回 `profile: null`。 |
| `saveProfile` | 新增或更新当前用户资料。 |
| `sendEmailCode` | 使用 QQ 邮箱 SMTP 向学校邮箱发送验证码。 |
| `verifyEmailCode` | 校验验证码并写入用户认证状态。 |
| `getHomeData` | 聚合社团、活动和报名数量，返回首页活动列表。 |
| `getActivityDetail` | 返回单个活动详情、报名人数、剩余名额和当前用户报名状态。 |
| `registerActivity` | 校验用户资料、重复报名和名额后创建报名记录。 |
| `cancelRegistration` | 将当前用户的有效报名记录更新为 `cancelled`。 |
| `getMyRegistrations` | 查询当前用户报名记录，并补齐活动和社团信息。 |
| `getAdminApplicationData` | 返回可申请社团和当前用户申请历史。 |
| `submitAdminApplication` | 提交社团管理员申请。 |
| `getClubAdminDataV2` | 根据当前用户权限返回可管理社团和活动。 |
| `saveActivity` | 管理员新建或编辑活动。 |
| `deleteActivity` | 管理员软删除活动，保留活动报名历史。 |
| `getRegistrationList` | 管理员查看活动报名名单。 |
| `getPlatformReviewData` | 平台管理员查看待处理和已处理申请。 |
| `reviewAdminApplication` | 平台管理员审核申请；通过后写入社团管理员列表。 |

## 13. 云数据库初始化建议

项目运行前至少需要创建 `clubs` 集合并写入社团数据，否则首页和管理员申请页面无法展示社团。

示例社团数据：

```js
{
  name: '计算机协会',
  intro: '组织技术分享、项目实践和编程竞赛训练。',
  adminOpenids: ['管理员 openid'],
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
}
```

示例活动数据：

```js
{
  title: '小程序云开发入门工作坊',
  clubId: 'clubs 集合中的文档 _id',
  category: '学术',
  startTime: '2026-06-10 19:00',
  duration: '2 小时',
  deadline: '2026-06-09 18:00',
  location: '教学楼 A301',
  quota: 50,
  coverTone: 'green',
  description: '面向零基础同学介绍微信小程序云开发。',
  status: 'open',
  createdAt: new Date(),
  updatedAt: new Date()
}
```

推荐先手动创建几个 `clubs`，再使用小程序里的「社团管理」页面创建活动。`users`、`registrations`、`admin_applications`、`email_verifications` 可由资料保存、报名、申请和学校邮箱认证流程自动产生。

## 14. 联调检查清单

首次运行或迁移环境时建议按以下顺序检查：

1. `app.js` 的 `env` 与微信开发者工具当前云环境一致。
2. `project.config.json` 的 `appid` 与目标小程序一致。
3. 已创建 `users`、`clubs`、`activities`、`registrations`、`admin_applications`、`email_verifications` 集合。
4. 已上传并部署全部云函数，选择「云端安装依赖」。
5. `sendEmailCode` 云函数已配置 `SMTP_USER` 和 `SMTP_PASS` 等 SMTP 环境变量。
6. `login` 云函数可以返回当前用户 `openid`。
7. `clubs` 集合里至少有一条 `status` 不是 `deleted` 的社团数据。
8. 学生先在「我的」页面完善资料并完成学校邮箱认证，再测试活动报名。
9. 如需测试社团管理员，把当前用户 `openid` 加入目标社团的 `adminOpenids`。
10. 如需测试平台审核，同步修改 `app.js` 和相关云函数中的平台管理员 openid。
11. 首页若无数据，优先检查 `getHomeData` 是否部署成功以及 `activities` 是否存在非 `deleted` 活动。

## 15. 当前已知注意事项

- 平台管理员 openid 在多个文件中硬编码，修改时需要同步处理。
- `getActivityDetail` 直接读取活动和社团文档，若传入不存在的 `activityId`，后续可补充更完整的异常处理。
- `getHomeData` 和部分管理接口当前使用 `limit(100)` 或 `limit(1000)`，活动和报名量增大后需要分页。
- 前端页面包含若干 `debugMessage` 和运行错误展示逻辑，适合开发调试；正式发布前可按需要弱化。
- 当前仓库未看到自动化测试配置，主要依赖微信开发者工具和云函数手动联调。
