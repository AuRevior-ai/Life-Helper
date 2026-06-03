const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function fixedNow() {
  return new Date("2026-05-30T03:30:00.000Z");
}

function createMemoryUsers(initialUsers = []) {
  const records = initialUsers.map((user) => ({ ...user }));

  return {
    records,

    async findByOpenid(openid) {
      return records.find((user) => user.openid === openid) || null;
    },

    async findById(id) {
      return records.find((user) => user._id === id) || null;
    },

    async create(data) {
      const record = {
        ...data,
        _id: `user_${records.length + 1}`,
      };
      records.push(record);
      return { ...record };
    },

    async updateById(id, data) {
      const record = records.find((user) => user._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
  };
}

test("loginOrRegister creates a default normal user on first login", async () => {
  const { handleLogin } = require("../cloudfunctions/login/handler");
  const users = createMemoryUsers();

  const result = await handleLogin(
    { action: "loginOrRegister" },
    {
      openid: "openid_first",
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.isNewUser, true);
  assert.equal(result.data.user._id, "user_1");
  assert.equal(result.data.user.openid, "openid_first");
  assert.equal(result.data.user.nickname, "社区用户");
  assert.equal(result.data.user.avatar, "");
  assert.equal(result.data.user.phone, "");
  assert.equal(result.data.user.role, "user");
  assert.equal(result.data.user.status, "normal");
  assert.equal(
    result.data.user.created_at.toISOString(),
    "2026-05-30T03:30:00.000Z",
  );
  assert.equal(
    result.data.user.updated_at.toISOString(),
    "2026-05-30T03:30:00.000Z",
  );
  assert.equal(users.records.length, 1);
});

test("loginOrRegister saves authorized nickname and avatar on first login", async () => {
  const { handleLogin } = require("../cloudfunctions/login/handler");
  const users = createMemoryUsers();

  const result = await handleLogin(
    {
      action: "loginOrRegister",
      profile: {
        nickname: "授权用户",
        avatar: "https://example.com/avatar.png",
      },
    },
    {
      openid: "openid_profile",
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.user.nickname, "授权用户");
  assert.equal(result.data.user.avatar, "https://example.com/avatar.png");
  assert.equal(result.data.user.phone, "");
  assert.equal(result.data.user.role, "user");
});

test("loginOrRegister refreshes authorized nickname and avatar for existing users", async () => {
  const { handleLogin } = require("../cloudfunctions/login/handler");
  const users = createMemoryUsers([
    {
      _id: "user_profile",
      openid: "openid_profile",
      nickname: "旧昵称",
      avatar: "",
      phone: "",
      role: "user",
      status: "normal",
      created_at: new Date("2026-05-01T00:00:00.000Z"),
      updated_at: new Date("2026-05-01T00:00:00.000Z"),
    },
  ]);

  const result = await handleLogin(
    {
      action: "loginOrRegister",
      profile: {
        nickname: "新昵称",
        avatar: "cloud://new-avatar",
      },
    },
    {
      openid: "openid_profile",
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.isNewUser, false);
  assert.equal(result.data.user.nickname, "新昵称");
  assert.equal(result.data.user.avatar, "cloud://new-avatar");
  assert.equal(users.records.length, 1);
});

test("loginOrRegister returns an existing user without creating a duplicate", async () => {
  const { handleLogin } = require("../cloudfunctions/login/handler");
  const users = createMemoryUsers([
    {
      _id: "user_admin",
      openid: "openid_admin",
      nickname: "管理员",
      avatar: "",
      phone: "",
      role: "admin",
      status: "normal",
      created_at: new Date("2026-05-01T00:00:00.000Z"),
      updated_at: new Date("2026-05-01T00:00:00.000Z"),
    },
  ]);

  const result = await handleLogin(
    { action: "loginOrRegister" },
    {
      openid: "openid_admin",
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.isNewUser, false);
  assert.equal(result.data.user._id, "user_admin");
  assert.equal(result.data.user.role, "admin");
  assert.equal(
    result.data.user.updated_at.toISOString(),
    "2026-05-30T03:30:00.000Z",
  );
  assert.equal(users.records.length, 1);
});

test("loginOrRegister rejects an existing disabled user", async () => {
  const { handleLogin } = require("../cloudfunctions/login/handler");
  const users = createMemoryUsers([
    {
      _id: "user_disabled",
      openid: "openid_disabled",
      nickname: "禁用用户",
      avatar: "",
      phone: "",
      role: "user",
      status: "disabled",
      created_at: new Date("2026-05-01T00:00:00.000Z"),
      updated_at: new Date("2026-05-01T00:00:00.000Z"),
    },
  ]);

  const result = await handleLogin(
    { action: "loginOrRegister" },
    {
      openid: "openid_disabled",
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, false);
  assert.equal(result.errorCode, "USER_DISABLED");
  assert.equal(users.records.length, 1);
});

test("getCurrentUser returns the current normal user", async () => {
  const { handleUser } = require("../cloudfunctions/user/handler");
  const users = createMemoryUsers([
    {
      _id: "user_1",
      openid: "openid_user",
      nickname: "居民",
      avatar: "",
      phone: "",
      role: "user",
      status: "normal",
    },
  ]);

  const result = await handleUser(
    { action: "getCurrentUser" },
    {
      openid: "openid_user",
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.user.nickname, "居民");
});

test("updateUserInfo updates only allowed profile fields", async () => {
  const { handleUser } = require("../cloudfunctions/user/handler");
  const users = createMemoryUsers([
    {
      _id: "user_1",
      openid: "openid_user",
      nickname: "旧昵称",
      avatar: "",
      phone: "",
      role: "user",
      status: "normal",
    },
  ]);

  const result = await handleUser(
    {
      action: "updateUserInfo",
      nickname: "新昵称",
      avatar: "cloud://avatar.png",
      phone: "13800138000",
      role: "admin",
      status: "disabled",
    },
    {
      openid: "openid_user",
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.user.nickname, "新昵称");
  assert.equal(result.data.user.avatar, "cloud://avatar.png");
  assert.equal(result.data.user.phone, "13800138000");
  assert.equal(result.data.user.role, "user");
  assert.equal(result.data.user.status, "normal");
});

test("admin can update another user role", async () => {
  const { handleUser } = require("../cloudfunctions/user/handler");
  const users = createMemoryUsers([
    {
      _id: "admin_1",
      openid: "openid_admin",
      nickname: "管理员",
      role: "admin",
      status: "normal",
    },
    {
      _id: "user_1",
      openid: "openid_user",
      nickname: "居民",
      role: "user",
      status: "normal",
    },
  ]);

  const result = await handleUser(
    {
      action: "updateUserRole",
      userId: "user_1",
      role: "worker",
    },
    {
      openid: "openid_admin",
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.user.role, "worker");
});

test("normal user cannot update another user role", async () => {
  const { handleUser } = require("../cloudfunctions/user/handler");
  const users = createMemoryUsers([
    {
      _id: "user_1",
      openid: "openid_user",
      nickname: "居民",
      role: "user",
      status: "normal",
    },
    {
      _id: "user_2",
      openid: "openid_other",
      nickname: "其他用户",
      role: "user",
      status: "normal",
    },
  ]);

  const result = await handleUser(
    {
      action: "updateUserRole",
      userId: "user_2",
      role: "admin",
    },
    {
      openid: "openid_user",
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, false);
  assert.equal(result.errorCode, "PERMISSION_DENIED");
  assert.equal(
    users.records.find((user) => user._id === "user_2").role,
    "user",
  );
});

test("admin can disable a user", async () => {
  const { handleUser } = require("../cloudfunctions/user/handler");
  const users = createMemoryUsers([
    {
      _id: "admin_1",
      openid: "openid_admin",
      nickname: "管理员",
      role: "admin",
      status: "normal",
    },
    {
      _id: "user_1",
      openid: "openid_user",
      nickname: "居民",
      role: "user",
      status: "normal",
    },
  ]);

  const result = await handleUser(
    {
      action: "disableUser",
      userId: "user_1",
    },
    {
      openid: "openid_admin",
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.user.status, "disabled");
});

test("auth helpers persist current user and expose login state", () => {
  const storage = {};
  global.wx = {
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    },
  };

  const authPath = require.resolve("../miniprogram/utils/auth");
  delete require.cache[authPath];
  const {
    clearCurrentUser,
    getCurrentIdentityRole,
    getCurrentUser,
    getCurrentUserRoleText,
    hasRole,
    setCurrentIdentityRole,
    isLoggedIn,
    setCurrentUser,
  } = require("../miniprogram/utils/auth");

  clearCurrentUser();
  assert.equal(isLoggedIn(), false);

  setCurrentUser({
    nickname: "管理员",
    role: "admin",
    status: "normal",
  });

  assert.equal(isLoggedIn(), true);
  assert.equal(getCurrentUser().nickname, "管理员");
  assert.equal(hasRole("admin"), true);
  assert.equal(hasRole("worker"), false);
  assert.equal(getCurrentUserRoleText(), "管理员");

  setCurrentIdentityRole("user");
  assert.equal(getCurrentIdentityRole(), "user");
  assert.equal(getCurrentUser().role, "admin");
  assert.equal(getCurrentUser().active_role, "user");
  assert.equal(hasRole("admin"), false);
  assert.equal(hasRole("user"), true);
  assert.equal(getCurrentUserRoleText(), "普通用户");

  clearCurrentUser();
  assert.equal(getCurrentUser(), null);
  delete global.wx;
});

test("profile page exposes login action and identity selection entry", () => {
  const profileWxml = fs.readFileSync(
    path.resolve(__dirname, "../miniprogram/pages/profile/profile.wxml"),
    "utf8",
  );

  assert.match(profileWxml, /bindtap="handleLogin"/);
  assert.match(profileWxml, /微信授权登录/);
  assert.match(profileWxml, /选择登录身份/);
  assert.doesNotMatch(profileWxml, /师傅入口/);
  assert.doesNotMatch(profileWxml, /管理员入口/);
});

test("profile page requests user profile before cloud login when available", () => {
  const profileJs = fs.readFileSync(
    path.resolve(__dirname, "../miniprogram/pages/profile/profile.js"),
    "utf8",
  );

  assert.match(profileJs, /wx\.getUserProfile/);
  assert.match(profileJs, /用于完善会员资料/);
});
