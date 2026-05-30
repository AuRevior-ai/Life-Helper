const { USER_ROLE_TEXT } = require('../config/roles')

const STORAGE_KEY = 'CURRENT_USER'

function getCurrentUser() {
  if (typeof wx === 'undefined') return null
  return wx.getStorageSync(STORAGE_KEY) || null
}

function setCurrentUser(user) {
  if (typeof wx === 'undefined') return
  wx.setStorageSync(STORAGE_KEY, user)
}

function clearCurrentUser() {
  if (typeof wx === 'undefined') return
  wx.removeStorageSync(STORAGE_KEY)
}

function hasRole(role) {
  const user = getCurrentUser()
  return Boolean(user && user.role === role)
}

function isLoggedIn() {
  return Boolean(getCurrentUser())
}

function getCurrentUserRoleText(role) {
  const targetRole = role || (getCurrentUser() || {}).role
  return USER_ROLE_TEXT[targetRole] || '未登录'
}

module.exports = {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  hasRole,
  isLoggedIn,
  getCurrentUserRoleText
}
