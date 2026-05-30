const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

test('getCategoryList returns the three MVP service categories in sort order', async () => {
  const { handleService } = require('../cloudfunctions/service/handler')

  const result = await handleService({ action: 'getCategoryList' })

  assert.equal(result.success, true)
  assert.deepEqual(
    result.data.categories.map((category) => category.name),
    ['家政保洁', '维修服务', '宠物服务']
  )
  assert.deepEqual(
    result.data.categories.map((category) => category.status),
    ['enabled', 'enabled', 'enabled']
  )
})

test('getServiceList returns on-shelf services filtered by category', async () => {
  const { handleService } = require('../cloudfunctions/service/handler')

  const result = await handleService({
    action: 'getServiceList',
    categoryId: 'cat_repair'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.services.length, 2)
  assert.deepEqual(
    result.data.services.map((service) => service.category_id),
    ['cat_repair', 'cat_repair']
  )
  assert.deepEqual(
    result.data.services.map((service) => service.status),
    ['on', 'on']
  )
})

test('getServiceList returns recommended services when no category is provided', async () => {
  const { handleService } = require('../cloudfunctions/service/handler')

  const result = await handleService({ action: 'getServiceList', recommended: true })

  assert.equal(result.success, true)
  assert.equal(result.data.services.length, 3)
  assert.equal(result.data.services.every((service) => service.recommended), true)
})

test('getServiceDetail returns complete service information', async () => {
  const { handleService } = require('../cloudfunctions/service/handler')

  const result = await handleService({
    action: 'getServiceDetail',
    serviceId: 'svc_pet_walk'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.service.name, '宠物遛弯')
  assert.equal(result.data.service.price, 3900)
  assert.equal(result.data.service.category_name, '宠物服务')
  assert.ok(result.data.service.flow_steps.length >= 3)
})

test('getServiceDetail returns SERVICE_NOT_FOUND for unknown services', async () => {
  const { handleService } = require('../cloudfunctions/service/handler')

  const result = await handleService({
    action: 'getServiceDetail',
    serviceId: 'svc_missing'
  })

  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'SERVICE_NOT_FOUND')
})

test('home and service pages call service APIs and expose navigation hooks', () => {
  const indexJs = fs.readFileSync(path.join(rootDir, 'miniprogram/pages/index/index.js'), 'utf8')
  const listJs = fs.readFileSync(path.join(rootDir, 'miniprogram/pages/service-list/service-list.js'), 'utf8')
  const detailJs = fs.readFileSync(path.join(rootDir, 'miniprogram/pages/service-detail/service-detail.js'), 'utf8')
  const indexWxml = fs.readFileSync(path.join(rootDir, 'miniprogram/pages/index/index.wxml'), 'utf8')
  const listWxml = fs.readFileSync(path.join(rootDir, 'miniprogram/pages/service-list/service-list.wxml'), 'utf8')
  const detailWxml = fs.readFileSync(path.join(rootDir, 'miniprogram/pages/service-detail/service-detail.wxml'), 'utf8')

  assert.match(indexJs, /getCategoryList/)
  assert.match(indexJs, /getServiceList/)
  assert.match(indexJs, /goServiceList/)
  assert.match(indexWxml, /服务分类/)
  assert.match(indexWxml, /推荐服务/)

  assert.match(listJs, /getServiceList/)
  assert.match(listJs, /goServiceDetail/)
  assert.match(listWxml, /service-card/)

  assert.match(detailJs, /getServiceDetail/)
  assert.match(detailWxml, /立即预约/)
  assert.match(detailWxml, /服务流程/)
})
