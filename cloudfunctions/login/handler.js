const { success, fail } = require("./_shared/response");
const { getNow } = require("./_shared/time");

const USER_ROLE = Object.freeze({
  USER: "user",
});

const USER_STATUS = Object.freeze({
  NORMAL: "normal",
  DISABLED: "disabled",
});

const DEFAULT_USER_PROFILE = Object.freeze({
  nickname: "社区用户",
  avatar: "",
  phone: "",
});

function compactProfile(event = {}) {
  const profile = event.profile || {};
  const nickname =
    profile.nickname || profile.nickName || event.nickname || event.nickName;
  const avatar =
    profile.avatar || profile.avatarUrl || event.avatar || event.avatarUrl;

  return {
    nickname: nickname ? `${nickname}` : "",
    avatar: avatar ? `${avatar}` : "",
  };
}

function buildProfilePatch(event = {}) {
  const profile = compactProfile(event);
  const patch = {};

  if (profile.nickname) {
    patch.nickname = profile.nickname;
  }
  if (profile.avatar) {
    patch.avatar = profile.avatar;
  }

  return patch;
}

async function loginOrRegister(env) {
  if (!env.openid) {
    return fail("OPENID_MISSING", "无法获取用户 openid");
  }

  const now = getNow(env);
  const profilePatch = buildProfilePatch(env.event);
  const existingUser = await env.users.findByOpenid(env.openid);

  if (existingUser) {
    if (existingUser.status === USER_STATUS.DISABLED) {
      return fail("USER_DISABLED", "当前用户已被禁用");
    }

    const updatedUser = await env.users.updateById(existingUser._id, {
      ...profilePatch,
      updated_at: now,
    });

    return success({
      user: updatedUser || {
        ...existingUser,
        updated_at: now,
      },
      isNewUser: false,
    });
  }

  const user = await env.users.create({
    openid: env.openid,
    nickname: profilePatch.nickname || DEFAULT_USER_PROFILE.nickname,
    avatar: profilePatch.avatar || DEFAULT_USER_PROFILE.avatar,
    phone: DEFAULT_USER_PROFILE.phone,
    role: USER_ROLE.USER,
    status: USER_STATUS.NORMAL,
    created_at: now,
    updated_at: now,
  });

  return success({
    user,
    isNewUser: true,
  });
}

async function handleLogin(event = {}, env) {
  if (event.action !== "loginOrRegister") {
    return fail("ACTION_NOT_FOUND", "未知登录操作");
  }

  try {
    return await loginOrRegister({
      ...env,
      event,
    });
  } catch (error) {
    return fail(
      error.errorCode || "INTERNAL_ERROR",
      error.message || "登录失败",
    );
  }
}

module.exports = {
  handleLogin,
  loginOrRegister,
  DEFAULT_USER_PROFILE,
};
