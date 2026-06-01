const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

test('app declares role selection page for five entry identities', () => {
  const appConfig = JSON.parse(read('miniprogram/app.json'))
  assert.equal(appConfig.pages.includes('pages/role-select/role-select'), true)

  for (const ext of ['js', 'json', 'wxml', 'wxss']) {
    assert.equal(
      fs.existsSync(path.join(rootDir, `miniprogram/pages/role-select/role-select.${ext}`)),
      true
    )
  }
})

test('role selection page shows five identities and routes available roles', () => {
  const roleSelectJs = read('miniprogram/pages/role-select/role-select.js')
  const roleSelectWxml = read('miniprogram/pages/role-select/role-select.wxml')
  const roleSelectWxss = read('miniprogram/pages/role-select/role-select.wxss')

  assert.match(roleSelectWxml, /普通用户端/)
  assert.match(roleSelectWxml, /个人师傅端/)
  assert.match(roleSelectWxml, /商家端/)
  assert.match(roleSelectWxml, /管理员端/)
  assert.match(roleSelectWxml, /小区合伙人端/)
  assert.match(roleSelectWxml, /城市合伙人端/)
  assert.match(roleSelectWxml, /即将开放/)

  assert.match(roleSelectJs, /enterUserRole/)
  assert.match(roleSelectJs, /enterWorkerRole/)
  assert.match(roleSelectJs, /enterMerchantRole/)
  assert.match(roleSelectJs, /enterAdminRole/)
  assert.match(roleSelectJs, /enterCommunityPartnerRole/)
  assert.match(roleSelectJs, /enterCityPartnerRole/)
  assert.match(roleSelectJs, /claimInitialAdmin/)
  assert.match(roleSelectJs, /pages\/worker\/audit-status\/audit-status/)
  assert.match(roleSelectJs, /pages\/merchant\/audit-status\/audit-status/)
  assert.match(roleSelectJs, /pages\/admin\/dashboard\/dashboard/)
  assert.match(roleSelectWxss, /role-grid/)
  assert.match(roleSelectWxss, /identity-card\.disabled/)
})

test('profile page becomes account center and links to identity selection after login', () => {
  const profileJs = read('miniprogram/pages/profile/profile.js')
  const profileWxml = read('miniprogram/pages/profile/profile.wxml')

  assert.match(profileJs, /goRoleSelect/)
  assert.match(profileJs, /pages\/role-select\/role-select/)
  assert.match(profileJs, /handleLogin[\s\S]*goRoleSelect/)
  assert.match(profileWxml, /选择登录身份/)
  assert.doesNotMatch(profileWxml, /师傅入口/)
  assert.doesNotMatch(profileWxml, /管理员入口/)
  assert.match(profileWxml, /账号资料/)
})
