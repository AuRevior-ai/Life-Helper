const USER_ROLE = Object.freeze({
  USER: 'user',
  WORKER: 'worker',
  ADMIN: 'admin'
})

const USER_ROLE_TEXT = Object.freeze({
  [USER_ROLE.USER]: '普通用户',
  [USER_ROLE.WORKER]: '师傅',
  [USER_ROLE.ADMIN]: '管理员'
})

module.exports = {
  USER_ROLE,
  USER_ROLE_TEXT
}
