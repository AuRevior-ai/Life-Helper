const { success, fail, serviceError } = require('./_shared/response')
const { getPayload } = require('./_shared/payload')
const { getNow } = require('./_shared/time')
const { paginateList } = require('./_shared/pagination')

function requireOpenid(env) {
  if (!env.openid) {
    throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  }
  return env.openid
}

const USER_ROLE_MESSAGE_TYPES = Object.freeze({
  worker_review_reply: 'user'
})

function getEffectiveMessageRole(message = {}) {
  return USER_ROLE_MESSAGE_TYPES[message.type] || message.role || ''
}

function normalizeMessageRole(message = {}) {
  const role = getEffectiveMessageRole(message)
  return role ? { ...message, role } : message
}

function messageMatchesRole(message = {}, role) {
  if (!role) return true
  const effectiveRole = getEffectiveMessageRole(message)
  return !effectiveRole || effectiveRole === role
}

async function getMessageList(event, env) {
  const payload = getPayload(event)
  const userId = requireOpenid(env)
  let messages = await env.messages.findByUserId(userId)
  if (payload.role) {
    messages = messages.filter((message) => messageMatchesRole(message, payload.role))
  }
  messages = messages.map(normalizeMessageRole)

  if (payload.is_read !== undefined || payload.isRead !== undefined) {
    const isRead = payload.is_read !== undefined ? payload.is_read : payload.isRead
    messages = messages.filter((message) => message.is_read === isRead)
  }

  const unreadCount = messages.filter((message) => !message.is_read).length
  return success({
    ...paginateList(messages, payload, { listKey: 'messages' }),
    unread_count: unreadCount
  })
}

async function markMessageRead(event, env) {
  const payload = getPayload(event)
  if (!payload.messageId) {
    throw serviceError('MESSAGE_ID_MISSING', '缺少消息 ID')
  }

  const message = await env.messages.findById(payload.messageId)
  if (!message) {
    throw serviceError('MESSAGE_NOT_FOUND', '消息不存在')
  }
  if (message.user_id !== requireOpenid(env)) {
    throw serviceError('PERMISSION_DENIED', '无权操作该消息')
  }

  const updatedMessage = await env.messages.updateById(message._id, {
    is_read: true,
    updated_at: getNow(env)
  })
  return success({ message: updatedMessage })
}

async function markAllMessagesRead(event, env) {
  const userId = requireOpenid(env)
  const payload = getPayload(event)
  if (payload.role) {
    const messages = await env.messages.findByUserId(userId)
    const targetMessages = messages.filter((message) => messageMatchesRole(message, payload.role))
    for (const message of targetMessages) {
      if (!message.is_read) {
        await env.messages.updateById(message._id, {
          is_read: true,
          updated_at: getNow(env)
        })
      }
    }
    return success({ updated: true })
  }
  await env.messages.markAllRead(userId, {
    is_read: true,
    updated_at: getNow(env)
  })
  return success({ updated: true })
}

async function getUnreadCount(event, env) {
  const messages = await env.messages.findByUserId(requireOpenid(env))
  return success({
    unread_count: messages.filter((message) => !message.is_read).length
  })
}

const actions = Object.freeze({
  getMessageList,
  markMessageRead,
  markAllMessagesRead,
  getUnreadCount
})

async function handleMessage(event = {}, env) {
  const action = actions[event.action]
  if (!action) {
    return fail('ACTION_NOT_FOUND', '未知消息操作')
  }

  try {
    return await action(event, env)
  } catch (error) {
    return fail(error.errorCode || 'INTERNAL_ERROR', error.message || '消息操作失败')
  }
}

module.exports = {
  handleMessage,
  getMessageList,
  markMessageRead,
  markAllMessagesRead,
  getUnreadCount
}
