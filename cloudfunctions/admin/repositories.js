function withDocId(record, id) {
  if (!record) return null
  return {
    _id: record._id || id,
    ...record
  }
}

function createUserRepository(db) {
  const users = db.collection('users')

  return {
    async findByOpenid(openid) {
      const result = await users.where({ openid }).limit(1).get()
      return result.data[0] || null
    },

    async findById(id) {
      try {
        const result = await users.doc(id).get()
        return withDocId(result.data, id)
      } catch (error) {
        return null
      }
    },

    async findAll() {
      const result = await users.orderBy('created_at', 'desc').get()
      return result.data || []
    },

    async updateById(id, data) {
      await users.doc(id).update({ data })
      return this.findById(id)
    }
  }
}

function createOrderRepository(db) {
  const orders = db.collection('orders')

  return {
    async findAll() {
      const result = await orders.orderBy('created_at', 'desc').get()
      return result.data || []
    },

    async findById(id) {
      try {
        const result = await orders.doc(id).get()
        return withDocId(result.data, id)
      } catch (error) {
        return null
      }
    },

    async updateById(id, data) {
      await orders.doc(id).update({ data })
      return this.findById(id)
    }
  }
}

function createWorkerRepository(db) {
  const workers = db.collection('workers')

  return {
    async findAll() {
      const result = await workers.orderBy('created_at', 'desc').get()
      return result.data || []
    },

    async findByAuditStatus(status) {
      const result = await workers
        .where({ audit_status: status })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    }
  }
}

function createReadRepository(db, collectionName) {
  const collection = db.collection(collectionName)

  return {
    async findAll() {
      const result = await collection.orderBy('sort', 'asc').get()
      return result.data || []
    }
  }
}

function createAdminOperationLogRepository(db) {
  const logs = db.collection('admin_operation_logs')

  return {
    async create(data) {
      const result = await logs.add({ data })
      return {
        ...data,
        _id: result._id
      }
    }
  }
}

module.exports = {
  createUserRepository,
  createOrderRepository,
  createWorkerRepository,
  createCategoryRepository: (db) => createReadRepository(db, 'service_categories'),
  createServiceRepository: (db) => createReadRepository(db, 'services'),
  createAdminOperationLogRepository
}
