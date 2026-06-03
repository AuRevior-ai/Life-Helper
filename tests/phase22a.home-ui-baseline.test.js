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

test('phase 22A keeps the user home page registered and present', () => {
  const appJson = JSON.parse(read('miniprogram/app.json'))

  assert.equal(appJson.pages.includes('pages/index/index'), true)
  assert.equal(exists('miniprogram/pages/index/index.wxml'), true)
  assert.equal(exists('miniprogram/pages/index/index.wxss'), true)
})

test('home page contains the phase 22A visual baseline sections', () => {
  const wxml = read('miniprogram/pages/index/index.wxml')

  for (const text of [
    '你好，今天需要什么服务？',
    '当前位置',
    '西安市·锦业新城小区',
    '搜索保洁、维修、宠物服务',
    '社区便民服务',
    '服务分类',
    '常用服务',
    '平台审核',
    '明码标价',
    '服务可评价'
  ]) {
    assert.match(wxml, new RegExp(text), `home page should include ${text}`)
  }
})

test('home page removes the inherited dark native navigation bar', () => {
  const indexJson = JSON.parse(read('miniprogram/pages/index/index.json'))
  const wxss = read('miniprogram/pages/index/index.wxss')

  assert.equal(indexJson.navigationStyle, 'custom')
  assert.equal(indexJson.navigationBarTitleText, undefined)
  assert.match(wxss, /\.home-page\s*{[^}]*padding:\s*96rpx 40rpx 170rpx;/s)
}
)

test('user tab pages remove the inherited dark native navigation bar', () => {
  const tabPages = [
    {
      jsonPath: 'miniprogram/pages/order-list/order-list.json',
      wxssPath: 'miniprogram/pages/order-list/order-list.wxss'
    },
    {
      jsonPath: 'miniprogram/pages/profile/profile.json',
      wxssPath: 'miniprogram/pages/profile/profile.wxss'
    }
  ]

  for (const page of tabPages) {
    const pageJson = JSON.parse(read(page.jsonPath))
    const wxss = read(page.wxssPath)

    assert.equal(pageJson.navigationStyle, 'custom', `${page.jsonPath} should use custom navigation`)
    assert.equal(pageJson.navigationBarTitleText, undefined, `${page.jsonPath} should not render native title text`)
    assert.match(wxss, /\.page-shell\s*{[^}]*padding-top:\s*96rpx;/s)
  }
}
)

test('home page defines the three common service rows', () => {
  const js = read('miniprogram/pages/index/index.js')
  const wxml = read('miniprogram/pages/index/index.wxml')

  for (const text of [
    '日常保洁',
    '专业保洁阿姨，深度清洁',
    '水电维修',
    '水电故障维修，快速上门',
    '宠物上门喂养',
    '上门喂养遛狗，贴心照料',
    '¥99起',
    '立即预约'
  ]) {
    assert.match(`${js}\n${wxml}`, new RegExp(text), `common service baseline should include ${text}`)
  }
})

test('home service categories use managed local image assets', () => {
  const js = read('miniprogram/pages/index/index.js')
  const wxml = read('miniprogram/pages/index/index.wxml')
  const wxss = read('miniprogram/pages/index/index.wxss')
  const iconFiles = [
    'miniprogram/assets/home/category-housekeeping.png',
    'miniprogram/assets/home/category-repair.png',
    'miniprogram/assets/home/category-pet.png'
  ]

  for (const file of iconFiles) {
    assert.equal(exists(file), true, `${file} should exist`)
    assert.match(js, new RegExp(file.replace('miniprogram/', '/')))
  }

  assert.match(wxml, /<image[^>]+class="home-category-image"[^>]+src="{{ item\.iconPath }}"/)
  assert.match(wxml, /mode="aspectFit"/)
  assert.doesNotMatch(wxml, /home-category-mark/)
  assert.match(wxss, /\.home-category-image\s*{[^}]*width:\s*86rpx;/s)
  assert.match(wxss, /\.home-category-image\s*{[^}]*height:\s*86rpx;/s)
}
)

test('home banner uses the managed local background board image', () => {
  const wxml = read('miniprogram/pages/index/index.wxml')
  const wxss = read('miniprogram/pages/index/index.wxss')
  const bannerAsset = 'miniprogram/assets/home/用户端_首页_广告栏背景板.png'

  assert.equal(exists(bannerAsset), true, `${bannerAsset} should exist`)
  assert.match(wxml, /class="home-banner-bg"/)
  assert.match(wxml, /src="\/assets\/home\/用户端_首页_广告栏背景板\.png"/)
  assert.match(wxml, /mode="aspectFill"/)
  assert.doesNotMatch(wxml, /home-illustration/)
  assert.match(wxss, /\.home-banner-bg\s*{[^}]*position:\s*absolute;/s)
  assert.match(wxss, /\.home-banner-bg\s*{[^}]*width:\s*100%;/s)
  assert.match(wxss, /\.home-banner-bg\s*{[^}]*height:\s*100%;/s)
  assert.match(wxss, /\.home-banner-bg\s*{[^}]*z-index:\s*1;/s)
}
)

test('home image assets stay small enough for real-device debugging package limits', () => {
  const assetFiles = [
    'miniprogram/assets/home/category-housekeeping.png',
    'miniprogram/assets/home/category-repair.png',
    'miniprogram/assets/home/category-pet.png',
    'miniprogram/assets/home/用户端_首页_广告栏背景板.png',
    'miniprogram/assets/home/service-cleaning.png',
    'miniprogram/assets/home/service-repair.png',
    'miniprogram/assets/home/service-pet-feeding.png'
  ]
  const maxSingleAssetSize = 350 * 1024
  const maxHomeAssetTotalSize = 700 * 1024
  let totalSize = 0

  for (const file of assetFiles) {
    const size = fs.statSync(path.join(rootDir, file)).size
    totalSize += size
    assert.ok(size <= maxSingleAssetSize, `${file} is ${size} bytes and should stay under ${maxSingleAssetSize}`)
  }

  assert.ok(
    totalSize <= maxHomeAssetTotalSize,
    `home image assets total ${totalSize} bytes should stay under ${maxHomeAssetTotalSize}`
  )
}
)

test('home common service rows use managed local cover images', () => {
  const js = read('miniprogram/pages/index/index.js')
  const wxml = read('miniprogram/pages/index/index.wxml')
  const wxss = read('miniprogram/pages/index/index.wxss')
  const serviceCoverFiles = [
    'miniprogram/assets/home/service-cleaning.png',
    'miniprogram/assets/home/service-repair.png',
    'miniprogram/assets/home/service-pet-feeding.png'
  ]

  for (const file of serviceCoverFiles) {
    assert.equal(exists(file), true, `${file} should exist`)
    assert.match(js, new RegExp(file.replace('miniprogram/', '/')))
  }

  assert.match(wxml, /<image[^>]+class="home-service-cover-image"[^>]+src="{{ item\.coverPath }}"/)
  assert.match(wxml, /mode="aspectFill"/)
  assert.match(wxss, /\.home-service-cover-image\s*{[^}]*width:\s*100%;/s)
  assert.match(wxss, /\.home-service-cover-image\s*{[^}]*height:\s*100%;/s)
  assert.doesNotMatch(wxss, /\.home-service-cover--cleaning\s*{[^}]*linear-gradient/s)
  assert.doesNotMatch(wxss, /\.home-service-cover--repair\s*{[^}]*linear-gradient/s)
  assert.doesNotMatch(wxss, /\.home-service-cover--pet\s*{[^}]*linear-gradient/s)
}
)

test('home page preserves service loading and navigation hooks', () => {
  const js = read('miniprogram/pages/index/index.js')

  assert.match(js, /loadHomeData/)
  assert.match(js, /getCategoryList/)
  assert.match(js, /getServiceList/)
  assert.match(js, /goServiceList/)
  assert.match(js, /goServiceDetail/)
})

test('home booking buttons are clipped inside service rows on narrow devices', () => {
  const wxss = read('miniprogram/pages/index/index.wxss')

  assert.match(wxss, /\.home-service-row\s*{[^}]*overflow:\s*hidden;/s)
  assert.match(wxss, /\.home-service-action\s*{[^}]*min-width:\s*0;/s)
  assert.match(wxss, /\.home-book-button\s*{[^}]*max-width:\s*100%;/s)
  assert.match(wxss, /\.home-book-button\s*{[^}]*min-width:\s*0;/s)
  assert.match(wxss, /\.home-book-button\s*{[^}]*box-sizing:\s*border-box;/s)
  assert.match(wxss, /\.home-book-button\s*{[^}]*overflow:\s*hidden;/s)
  assert.match(wxss, /\.home-book-button\s*{[^}]*white-space:\s*nowrap;/s)
}
)

test('phase 22A does not remove core cloudfunction handlers', () => {
  const handlerFiles = [
    'cloudfunctions/order/handler.js',
    'cloudfunctions/payment/handler.js',
    'cloudfunctions/refund/handler.js',
    'cloudfunctions/finance/handler.js',
    'cloudfunctions/dispatch/handler.js',
    'cloudfunctions/qualification/handler.js',
    'cloudfunctions/merchant/handler.js'
  ]

  for (const file of handlerFiles) {
    assert.equal(exists(file), true, `${file} should remain present`)
  }
})

test('phase 22A development record is present and indexed', () => {
  const recordPath = 'docs/dev-records/22a_home-ui-baseline.md'
  const index = read('docs/dev-records/index.md')

  assert.equal(exists(recordPath), true)
  assert.match(read(recordPath), /阶段 22A：首页 UI 视觉重构与全局风格基线建立/)
  assert.match(index, /22a_home-ui-baseline\.md/)
  assert.match(index, /首页 UI 视觉重构与全局风格基线建立/)
})
