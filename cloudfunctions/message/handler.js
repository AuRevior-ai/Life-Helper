function success(data, message = 'success') {
  return {
    success: true,
    data,
    message
  }
}

function fail(errorCode, message) {
  return {
    success: false,
    errorCode,
    message
  }
}

function serviceError(errorCode, message) {
  const error = new Error(message)
  error.errorCode = errorCode
  return error
}

function getNow(env) {
  return env.now ? env.now() : new Date()
}

function getPayload(event = {}) {
  if (event.payload && typeof event.payload === 'object') {
    return event.payload
  }

  const { action, ...payload } = event
  return payload
}

function requireOpenid(env) {
  if (!env.openid) {
    throw serviceError('OPENID_MISSING', '无法获取用户 openid')
  }
  return env.openid
}

function parsePositiveInteger(value, fallback) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) {
    return fallback
  }
  return number
}

function paginateList(records, payload = {}) {
  const page = parsePositiveInteger(payload.page, 1)
  const pageSize = Math.min(parsePositiveInteger(payload.pageSize, 20), 50)
  const total = records.length
  const start = (page - 1) * pageSize
  const list = records.slice(start, start + pageSize)
  return {
    list,
    messages: list,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total
  }
}

async function getMessageList(event, env) {
  const payload = getPayload(event)
  const userId = requireOpenid(env)
  let messages = await env.messages.findByUserId(userId)

  if (payload.is_read !== undefined || payload.isRead !== undefined) {
    const isRead = payload.is_read !== undefined ? payload.is_read : payload.isRead
    messages = messages.filter((message) => message.is_read === isRead)
  }

  const unreadCount = messages.filter((message) => !message.is_read).length
  return success({
    ...paginateList(messages, payload),
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
