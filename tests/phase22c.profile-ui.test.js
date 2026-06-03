const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath))
}

test('phase 22C keeps only the user profile tab page in scope', () => {
  assert.equal(exists('miniprogram/pages/profile/profile.js'), true)
  assert.equal(exists('miniprogram/pages/profile/profile.wxml'), true)
  assert.equal(exists('miniprogram/pages/profile/profile.wxss'), true)
  assert.equal(exists('miniprogram/pages/worker/profile/profile.wxml'), true)
  assert.equal(exists('miniprogram/pages/merchant/profile/profile.wxml'), true)
})

test('profile page renders the approved mine page sections', () => {
  const js = read('miniprogram/pages/profile/profile.js')
  const wxml = read('miniprogram/pages/profile/profile.wxml')
  const wxss = read('miniprogram/pages/profile/profile.wxss')

  assert.match(js, /userInfo/)
  assert.match(js, /profileBg/)
  assert.match(js, /\/assets\/profile\/profile-avatar-placeholder\.png/)
  assert.match(js, /\/assets\/profile\/profile-card-bg-placeholder\.png/)
  assert.match(wxml, /mine-page/)
  assert.match(wxml, /mine-title/)
  assert.match(wxml, /我的/)
  assert.match(wxml, /登录后管理账号资料，并选择本次进入的身份端/)
  assert.match(wxml, /profile-card/)
  assert.match(wxml, /avatar-wrap/)
  assert.match(wxml, /src="{{ userInfo\.avatar }}"/)
  assert.match(wxml, /src="{{ profileBg }}"/)
  assert.match(wxml, /logout-btn/)
  assert.match(wxml, /账号资料/)
  assert.match(wxss, /linear-gradient\(135deg,\s*#eefbea/)
  assert.doesNotMatch(wxml, /mine-tabbar/)
})

test('profile placeholder image assets are managed and compressed', () => {
  const assets = [
    'miniprogram/assets/profile/profile-avatar-placeholder.png',
    'miniprogram/assets/profile/profile-card-bg-placeholder.png'
  ]
  const maxSingleAssetSize = 180 * 1024

  for (const asset of assets) {
    assert.equal(exists(asset), true, `${asset} should exist`)
    const size = fs.statSync(path.join(rootDir, asset)).size
    assert.ok(size <= maxSingleAssetSize, `${asset} is ${size} bytes and should stay under ${maxSingleAssetSize}`)
  }
})

test('profile placeholder assets preserve the approved visual behavior', () => {
  const js = read('miniprogram/pages/profile/profile.js')
  const wxss = read('miniprogram/pages/profile/profile.wxss')

  assert.match(js, /normalizeProfileAvatar/)
  assert.match(js, /thirdwx\.qlogo\.cn/)
  assert.match(js, /wx\.qlogo\.cn/)
  assert.match(wxss, /width:\s*100%/)
  assert.match(wxss, /height:\s*221rpx/)
  assert.match(wxss, /opacity:\s*1/)
  assert.doesNotMatch(wxss, /height:\s*210rpx/)
})

test('profile account card contains the seven approved user menu rows', () => {
  const wxml = read('miniprogram/pages/profile/profile.wxml')

  for (const text of [
    '选择登录身份',
    '五端入口',
    '完善资料',
    '昵称和手机号',
    '我的订单',
    '查看服务进度',
    '消息中心',
    '订单和审核提醒',
    '会员中心',
    '会员权益',
    '我的优惠券',
    '领取与使用',
    '地址管理',
    '维护服务地址'
  ]) {
    assert.match(wxml, new RegExp(text), `profile menu should include ${text}`)
  }

  assert.match(wxml, /data-key="role"/)
  assert.match(wxml, /data-key="profile"/)
  assert.match(wxml, /data-key="orders"/)
  assert.match(wxml, /data-key="messages"/)
  assert.match(wxml, /data-key="member"/)
  assert.match(wxml, /data-key="coupons"/)
  assert.match(wxml, /data-key="address"/)
  assert.match(wxml, /bindtap="handleMenuTap"/)
})

test('profile page preserves existing login and navigation handlers', () => {
  const js = read('miniprogram/pages/profile/profile.js')
  const wxml = read('miniprogram/pages/profile/profile.wxml')

  for (const method of [
    'handleLogin',
    'handleLogout',
    'handleMenuTap',
    'goRoleSelect',
    'goProfileEdit',
    'goOrderList',
    'goMessageList',
    'goMemberCenter',
    'goCouponList',
    'goAddressList',
    'goWorkerCenter',
    'goMerchantApply'
  ]) {
    assert.match(js, new RegExp(method), `profile JS should preserve ${method}`)
  }

  assert.match(wxml, /bindtap="handleLogin"/)
  assert.match(wxml, /微信授权登录/)
  assert.match(wxml, /wx:if="{{ isWorkerIdentity }}"/)
  assert.match(wxml, /师傅工作台/)
  assert.match(wxml, /商家入驻/)
})

test('profile uses global custom tabbar instead of a duplicate page tabbar', () => {
  const appJson = JSON.parse(read('miniprogram/app.json'))
  const js = read('miniprogram/pages/profile/profile.js')
  const wxml = read('miniprogram/pages/profile/profile.wxml')
  const wxss = read('miniprogram/pages/profile/profile.wxss')
  const tabbarWxml = read('miniprogram/custom-tab-bar/index.wxml')
  const tabbarWxss = read('miniprogram/custom-tab-bar/index.wxss')
  const tabbarJs = read('miniprogram/custom-tab-bar/index.js')

  assert.equal(appJson.tabBar.custom, true)
  assert.doesNotMatch(wxml, /mine-tabbar/)
  assert.doesNotMatch(wxss, /mine-tabbar/)
  assert.match(js, /setActiveTabBar/)
  assert.match(tabbarWxml, /custom-tabbar/)
  assert.match(`${tabbarWxml}\n${tabbarJs}`, /首页/)
  assert.match(`${tabbarWxml}\n${tabbarJs}`, /订单/)
  assert.match(`${tabbarWxml}\n${tabbarJs}`, /我的/)
  assert.match(tabbarWxss, /tab-icon--mine/)
  assert.match(tabbarWxss, /border-radius:\s*48rpx 48rpx 0 0/)
  assert.match(tabbarJs, /switchTab/)
  assert.match(tabbarJs, /selected/)
})
