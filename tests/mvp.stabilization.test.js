const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function fixedNow() {
  return new Date('2026-05-30T18:00:00.000Z')
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

function createMemoryUsers(initialUsers = []) {
  const records = initialUsers.map((user) => ({ ...user }))

  return {
    records,

    async findByOpenid(openid) {
      return records.find((user) => user.openid === openid) || null
    },

    async findById(id) {
      return records.find((user) => user._id === id) || null
    },

    async findByRole(role) {
      return records.find((user) => user.role === role) || null
    },

    async updateById(id, data) {
      const record = records.find((user) => user._id === id)
      if (!record) return null
      Object.assign(record, data)
      return { ...record }
    }
  }
}

test('first normal user can claim initial admin when no admin exists', async () => {
  const { handleUser } = require('../cloudfunctions/user/handler')
  const users = createMemoryUsers([
    {
      _id: 'user_1',
      openid: 'openid_user',
      nickname: '首个用户',
      role: 'user',
      status: 'normal'
    }
  ])

  const result = await handleUser(
    { action: 'claimInitialAdmin' },
    {
      openid: 'openid_user',
      users,
      now: fixedNow
    }
  )

  assert.equal(result.success, true)
  assert.equal(result.data.user.role, 'admin')
  assert.equal(users.records[0].role, 'admin')
})

test('claimInitialAdmin is rejected after an admin already exists', async () => {
  const { handleUser } = require('../cloudfunctions/user/handler')
  const users = createMemoryUsers([
    {
      _id: 'admin_1',
      openid: 'openid_admin',
      nickname: '管理员',
      role: 'admin',
      status: 'normal'
    },
    {
      _id: 'user_1',
      openid: 'openid_user',
      nickname: '普通用户',
      role: 'user',
      status: 'normal'
    }
  ])

  const result = await handleUser(
    { action: 'claimInitialAdmin' },
    {
      openid: 'openid_user',
      users,
      now: fixedNow
    }
  )

  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'ADMIN_ALREADY_EXISTS')
  assert.equal(users.records[1].role, 'user')
})

test('identity selection page differentiates user, worker, admin, and partner placeholders', () => {
  const roleSelectJs = read('miniprogram/pages/role-select/role-select.js')
  const roleSelectWxml = read('miniprogram/pages/role-select/role-select.wxml')
  const roleSelectWxss = read('miniprogram/pages/role-select/role-select.wxss')
  const profileWxml = read('miniprogram/pages/profile/profile.wxml')
  const appJson = read('miniprogram/app.json')
  const userService = read('miniprogram/services/user.service.js')

  assert.match(appJson, /pages\/profile-edit\/profile-edit/)
  assert.match(appJson, /pages\/role-select\/role-select/)
  assert.match(userService, /claimInitialAdmin/)
  assert.match(roleSelectJs, /enterUserRole/)
  assert.match(roleSelectJs, /enterWorkerRole/)
  assert.match(roleSelectJs, /enterAdminRole/)
  assert.match(roleSelectJs, /claimInitialAdmin/)
  assert.match(roleSelectJs, /enterCommunityPartnerRole/)
  assert.match(roleSelectJs, /enterCityPartnerRole/)
  assert.match(roleSelectWxml, /普通用户端/)
  assert.match(roleSelectWxml, /师傅\/商家端/)
  assert.match(roleSelectWxml, /管理员端/)
  assert.match(roleSelectWxml, /小区合伙人端/)
  assert.match(roleSelectWxml, /城市合伙人端/)
  assert.match(roleSelectWxss, /identity-card\.worker/)
  assert.match(roleSelectWxss, /identity-card\.admin/)
  assert.match(profileWxml, /完善资料/)
  assert.match(profileWxml, /选择登录身份/)
})

test('profile edit page lets users update nickname and phone through user service', () => {
  const profileEditJs = read('miniprogram/pages/profile-edit/profile-edit.js')
  const profileEditWxml = read('miniprogram/pages/profile-edit/profile-edit.wxml')

  assert.match(profileEditJs, /updateUserInfo/)
  assert.match(profileEditJs, /setCurrentUser/)
  assert.match(profileEditJs, /PHONE_INVALID/)
  assert.match(profileEditWxml, /昵称/)
  assert.match(profileEditWxml, /手机号/)
  assert.match(profileEditWxml, /保存资料/)
})

test('admin category and service edit pages provide minimal create and update forms', () => {
  const categoryListJs = read('miniprogram/pages/admin/category-list/category-list.js')
  const categoryEditJs = read('miniprogram/pages/admin/category-edit/category-edit.js')
  const categoryEditWxml = read('miniprogram/pages/admin/category-edit/category-edit.wxml')
  const serviceListJs = read('miniprogram/pages/admin/service-list/service-list.js')
  const serviceEditJs = read('miniprogram/pages/admin/service-edit/service-edit.js')
  const serviceEditWxml = read('miniprogram/pages/admin/service-edit/service-edit.wxml')

  assert.match(categoryListJs, /goCreateCategory/)
  assert.match(categoryListJs, /goEditCategory/)
  assert.match(categoryEditJs, /createCategory/)
  assert.match(categoryEditJs, /updateCategory/)
  assert.match(categoryEditWxml, /分类名称/)
  assert.match(categoryEditWxml, /保存分类/)
  assert.doesNotMatch(categoryEditWxml, /MVP 阶段暂不开放分类编辑/)

  assert.match(serviceListJs, /goCreateService/)
  assert.match(serviceListJs, /goEditService/)
  assert.match(serviceEditJs, /createService/)
  assert.match(serviceEditJs, /updateService/)
  assert.match(serviceEditWxml, /服务名称/)
  assert.match(serviceEditWxml, /保存服务/)
  assert.doesNotMatch(serviceEditWxml, /MVP 阶段暂不开放服务编辑/)
})
