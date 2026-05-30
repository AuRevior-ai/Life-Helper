const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

test('wechat MVP verification runbook lists every required collection and cloud function', () => {
  const runbook = read('docs/wechat-mvp-verification.md')

  ;[
    'users',
    'service_categories',
    'services',
    'addresses',
    'orders',
    'workers',
    'reviews'
  ].forEach((collection) => {
    assert.match(runbook, new RegExp(`\\\`${collection}\\\``))
  })

  ;[
    'login',
    'user',
    'service',
    'address',
    'order',
    'worker',
    'review',
    'admin'
  ].forEach((cloudFunction) => {
    assert.match(runbook, new RegExp(`cloudfunctions/${cloudFunction}`))
  })

  assert.match(runbook, /touristappid/)
  assert.match(runbook, /role` 字段改为 `admin`/)
  assert.match(runbook, /同步种子服务/)
  assert.match(runbook, /用户下单到评价闭环/)
  assert.match(runbook, /管理员验证/)
})

test('README links final verification runbook and marks all eight phases complete', () => {
  const readme = read('README.md')

  assert.match(readme, /阶段八：优化、验证准备与文档收口/)
  assert.match(readme, /docs\/wechat-mvp-verification.md/)
  assert.match(readme, /第一版 MVP 已完成/)
})

test('admin deferred edit pages explain MVP scope instead of showing empty placeholders', () => {
  const categoryEditWxml = read('miniprogram/pages/admin/category-edit/category-edit.wxml')
  const serviceEditWxml = read('miniprogram/pages/admin/service-edit/service-edit.wxml')
  const categoryEditJs = read('miniprogram/pages/admin/category-edit/category-edit.js')
  const serviceEditJs = read('miniprogram/pages/admin/service-edit/service-edit.js')

  assert.doesNotMatch(categoryEditWxml, /暂无数据/)
  assert.doesNotMatch(serviceEditWxml, /暂无数据/)
  assert.match(categoryEditWxml, /MVP 阶段暂不开放分类编辑/)
  assert.match(serviceEditWxml, /MVP 阶段暂不开放服务编辑/)
  assert.match(categoryEditJs, /goBack/)
  assert.match(serviceEditJs, /goServiceList/)
})
