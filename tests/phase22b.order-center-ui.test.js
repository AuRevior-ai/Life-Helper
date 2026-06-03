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

test('phase 22B keeps user order center registered and present', () => {
  const appJson = JSON.parse(read('miniprogram/app.json'))

  assert.equal(appJson.pages.includes('pages/order-list/order-list'), true)
  assert.equal(exists('miniprogram/pages/order-list/order-list.wxml'), true)
  assert.equal(exists('miniprogram/pages/order-list/order-list.wxss'), true)
})

test('user order center renders the phase 22B title and horizontal status tabs', () => {
  const js = read('miniprogram/pages/order-list/order-list.js')
  const wxml = read('miniprogram/pages/order-list/order-list.wxml')
  const wxss = read('miniprogram/pages/order-list/order-list.wxss')

  assert.match(js, /title:\s*'订单中心'/)
  assert.match(wxml, /<scroll-view[^>]+class="order-status-tabs"[^>]+scroll-x/)
  assert.match(wxml, /bindtap="onStatusTap"/)

  for (const label of ['全部', '待付款', '待接单', '已接单', '服务中', '待评价', '已完成', '已取消']) {
    assert.match(`${js}\n${wxml}`, new RegExp(label), `order center should include ${label}`)
  }

  assert.match(wxss, /\/\* tabs \*\//)
  assert.match(wxss, /\.order-tab--active/)
})

test('user order center preserves existing data loading and detail navigation', () => {
  const js = read('miniprogram/pages/order-list/order-list.js')

  assert.match(js, /getUserOrderList/)
  assert.match(js, /loadOrders/)
  assert.match(js, /onStatusTap/)
  assert.match(js, /goOrderDetail/)
  assert.match(js, /\/pages\/order-detail\/order-detail\?orderId=/)
})

test('user order cards use the high-density visual structure', () => {
  const wxml = read('miniprogram/components/order-card/order-card.wxml')
  const wxss = read('miniprogram/components/order-card/order-card.wxss')
  const js = read('miniprogram/components/order-card/order-card.js')

  for (const className of [
    'order-card--center',
    'order-card__media',
    'order-card__image-placeholder',
    'order-card__main',
    'order-card__aside',
    'order-card__actions',
    'order-card__meta',
    'order-card__price'
  ]) {
    assert.match(`${wxml}\n${wxss}`, new RegExp(className), `order card should include ${className}`)
  }

  assert.match(wxml, /status-tag/)
  assert.match(`${wxml}\n${js}`, /取消订单/)
  assert.match(`${wxml}\n${js}`, /模拟支付/)
  assert.match(js, /displayAddress/)
  assert.match(js, /displayPriceText/)
  assert.match(js, /variant/)
  assert.match(wxss, /grid-template-columns:\s*168rpx minmax\(0,\s*1fr\) 164rpx/)
  assert.match(wxss, /border-radius:\s*999rpx/)
})

test('status tag supports order center tones without removing the shared component', () => {
  const wxss = read('miniprogram/components/status-tag/status-tag.wxss')
  const wxml = read('miniprogram/components/status-tag/status-tag.wxml')

  assert.match(wxml, /status-tag/)
  for (const tone of [
    'status-tag--order-pending',
    'status-tag--order-accepted',
    'status-tag--order-serving',
    'status-tag--order-review',
    'status-tag--order-completed',
    'status-tag--order-canceled'
  ]) {
    assert.match(wxss, new RegExp(tone), `status tag should include ${tone}`)
  }
})

test('phase 22B keeps shared empty and loading states available', () => {
  for (const dir of [
    'miniprogram/components/status-tag',
    'miniprogram/components/empty-state',
    'miniprogram/components/loading-view'
  ]) {
    for (const ext of ['js', 'json', 'wxml', 'wxss']) {
      assert.equal(exists(`${dir}/${path.basename(dir)}.${ext}`), true, `${dir} missing ${ext}`)
    }
  }
})

test('phase 22B does not remove protected core business handlers', () => {
  for (const file of [
    'cloudfunctions/order/handler.js',
    'cloudfunctions/payment/handler.js',
    'cloudfunctions/refund/handler.js',
    'cloudfunctions/finance/handler.js',
    'cloudfunctions/dispatch/handler.js',
    'cloudfunctions/worker/handler.js',
    'cloudfunctions/merchant/handler.js',
    'cloudfunctions/qualification/handler.js'
  ]) {
    assert.equal(exists(file), true, `${file} should remain present`)
  }
})

test('phase 22B development record is present and indexed', () => {
  const recordPath = 'docs/dev-records/22b_order-center-ui.md'
  const index = read('docs/dev-records/index.md')

  assert.equal(exists(recordPath), true)
  assert.match(read(recordPath), /阶段 22B：用户端订单中心 UI 视觉重构/)
  assert.match(index, /22b_order-center-ui\.md/)
  assert.match(index, /用户端订单中心 UI 视觉重构/)
})
