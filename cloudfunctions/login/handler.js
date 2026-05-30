const USER_ROLE = Object.freeze({
  USER: 'user'
})

const USER_STATUS = Object.freeze({
  NORMAL: 'normal',
  DISABLED: 'disabled'
})

const DEFAULT_USER_PROFILE = Object.freeze({
  nickname: '社区用户',
  avatar: '',
  phone: ''
})

function success(data, message = 'success') {
  return {
    success: true,
    data,
    message
  }
}

function fail(errorCode, message) {
  return {
    success: false,
    errorCode,
    message
  }
}

function getNow(env) {
  return env.now ? env.now() : new Date()
}

async function loginOrRegister(env) {
  if (!env.openid) {
    return fail('OPENID_MISSING', '无法获取用户 openid')
  }

  const now = getNow(env)
  const existingUser = await env.users.findByOpenid(env.openid)

  if (existingUser) {
    if (existingUser.status === USER_STATUS.DISABLED) {
      return fail('USER_DISABLED', '当前用户已被禁用')
    }

    const updatedUser = await env.users.updateById(existingUser._id, {
      updated_at: now
    })

    return success({
      user: updatedUser || {
        ...existingUser,
        updated_at: now
      },
      isNewUser: false
    })
  }

  const user = await env.users.create({
    openid: env.openid,
    nickname: DEFAULT_USER_PROFILE.nickname,
    avatar: DEFAULT_USER_PROFILE.avatar,
    phone: DEFAULT_USER_PROFILE.phone,
    role: USER_ROLE.USER,
    status: USER_STATUS.NORMAL,
    created_at: now,
    updated_at: now
  })

  return success({
    user,
    isNewUser: true
  })
}

async function handleLogin(event = {}, env) {
  if (event.action !== 'loginOrRegister') {
    return fail('ACTION_NOT_FOUND', '未知登录操作')
  }

  try {
    return await loginOrRegister(env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '登录失败')
  }
}

module.exports = {
  handleLogin,
  loginOrRegister,
  DEFAULT_USER_PROFILE
}
