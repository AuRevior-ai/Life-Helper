function createTipLogRepository(db) {
  const tipLogs = db.collection('tip_logs')
  return {
    async create(data) {
      const result = await tipLogs.add({ data })
      return { ...data, _id: result._id }
    },
    async findById(id) {
      try {
        const result = await tipLogs.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },
    async findAll() {
      const result = await tipLogs.orderBy('created_at', 'desc').get()
      return result.data || []
    },
    async findByOrderId(orderId) {
      const result = await tipLogs.where({ order_id: orderId }).orderBy('created_at', 'desc').get()
      return result.data || []
    },
    async findByUserId(userId) {
      const result = await tipLogs.where({ user_id: userId }).orderBy('created_at', 'desc').get()
      return result.data || []
    },
    async findByWorkerId(workerId) {
      const result = await tipLogs.where({ worker_id: workerId }).orderBy('created_at', 'desc').get()
      return result.data || []
    },
    async updateById(id, data) {
      await tipLogs.doc(id).update({ data })
      const result = await tipLogs.doc(id).get()
      return result.data || null
    }
  }
}

function createOrderRepository(db) {
  const orders = db.collection('orders')
  return {
    async findById(id) {
      try {
        const result = await orders.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    }
  }
}

function createUserRepository(db) {
  const users = db.collection('users')
  return {
    async findByOpenid(openid) {
      const result = await users.where({ openid }).limit(1).get()
      return result.data && result.data[0] ? result.data[0] : null
    }
  }
}

function createMessageRepository(db) {
  const messages = db.collection('messages')
  return {
    async create(data) {
      const result = await messages.add({ data })
      return { ...data, _id: result._id }
    }
  }
}

function createFinanceLogRepository(db) {
  const financeLogs = db.collection('finance_logs')
  return {
    async create(data) {
      const result = await financeLogs.add({ data })
      return { ...data, _id: result._id }
    }
  }
}

function createWorkerEarningRepository(db) {
  const workerEarnings = db.collection('worker_earnings')
  return {
    async create(data) {
      const result = await workerEarnings.add({ data })
      return { ...data, _id: result._id }
    },
    async findActiveByTipId(tipId) {
      const result = await workerEarnings.where({ tip_id: tipId }).orderBy('created_at', 'desc').get()
      const records = result.data || []
      return records.find((item) => item.status !== 'reversed') || null
    }
  }
}

module.exports = {
  createTipLogRepository,
  createOrderRepository,
  createUserRepository,
  createMessageRepository,
  createFinanceLogRepository,
  createWorkerEarningRepository
}
