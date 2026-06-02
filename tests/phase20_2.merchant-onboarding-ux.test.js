const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

test('merchant service edit form uses stable labeled controls to avoid clipped placeholder text', () => {
  const wxml = read('miniprogram/pages/merchant/service-edit/service-edit.wxml')
  const wxss = read('miniprogram/pages/merchant/service-edit/service-edit.wxss')

  assert.match(wxml, /page-shell/)
  assert.match(wxml, /form-label/)
  assert.match(wxml, /form-input/)
  assert.match(wxml, /平台服务 ID/)
  assert.match(wxml, /价格/)
  assert.match(wxss, /line-height:\s*80rpx/)
  assert.match(wxss, /min-height:\s*80rpx/)
  assert.match(wxss, /box-sizing:\s*border-box/)
})

test('merchant onboarding status page renders friendly status cards instead of raw enum dumps', () => {
  const js = read('miniprogram/pages/merchant/risk-status/risk-status.js')
  const wxml = read('miniprogram/pages/merchant/risk-status/risk-status.wxml')

  assert.match(js, /ONBOARDING_STATUS_TEXT/)
  assert.match(js, /RISK_LEVEL_TEXT/)
  assert.match(js, /statusView/)
  assert.match(js, /nextActionText/)
  assert.doesNotMatch(wxml, /当前入驻状态：\{\{status\.onboarding_status/)
  assert.doesNotMatch(wxml, /风险等级：\{\{status\.risk_level/)
  assert.match(wxml, /准入进度/)
  assert.match(wxml, /当前状态/)
  assert.match(wxml, /经营权限/)
})

test('merchant deposit page explains mock flow and hides mock pay after payment succeeds', () => {
  const js = read('miniprogram/pages/merchant/deposit/deposit.js')
  const wxml = read('miniprogram/pages/merchant/deposit/deposit.wxml')

  assert.match(js, /DEPOSIT_STATUS_TEXT/)
  assert.match(js, /canMockPay/)
  assert.match(js, /canApplyRefund/)
  assert.match(js, /wx\.navigateBack/)
  assert.match(wxml, /MOCK_PAID/)
  assert.match(wxml, /已模拟缴纳/)
  assert.match(wxml, /才算完成保证金流程/)
  assert.match(wxml, /wx:if="\{\{canMockPay\}\}"/)
  assert.match(wxml, /wx:if="\{\{canApplyRefund\}\}"/)
})
