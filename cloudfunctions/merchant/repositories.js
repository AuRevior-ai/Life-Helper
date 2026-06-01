function createCollectionRepository(db, collectionName) {
  const collection = db.collection(collectionName)

  return {
    async findAll() {
      const result = await collection.orderBy('updated_at', 'desc').get()
      return result.data || []
    },

    async findById(id) {
      try {
        const result = await collection.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },

    async create(data) {
      const result = await collection.add({ data })
      return {
        ...data,
        _id: result._id
      }
    },

    async updateById(id, data) {
      await collection.doc(id).update({ data })
      const result = await collection.doc(id).get()
      return result.data || null
    }
  }
}

function createMerchantRepository(db) {
  const base = createCollectionRepository(db, 'merchants')
  const merchants = db.collection('merchants')
  return {
    ...base,
    async findByUserId(userId) {
      const result = await merchants.where({ user_id: userId }).limit(1).get()
      return result.data[0] || null
    },
    async findByAuditStatus(status) {
      const result = await merchants.where({ audit_status: status }).orderBy('updated_at', 'desc').get()
      return result.data || []
    }
  }
}

function createMerchantServiceRepository(db) {
  const base = createCollectionRepository(db, 'merchant_services')
  const merchantServices = db.collection('merchant_services')
  return {
    ...base,
    async findByMerchantId(merchantId) {
      const result = await merchantServices
        .where({ merchant_id: merchantId })
        .orderBy('sort', 'asc')
        .get()
      return result.data || []
    }
  }
}

function createServiceProviderRepository(db) {
  const base = createCollectionRepository(db, 'service_providers')
  const serviceProviders = db.collection('service_providers')
  return {
    ...base,
    async findByRef(providerType, refId) {
      const result = await serviceProviders
        .where({ provider_type: providerType, ref_id: refId })
        .limit(1)
        .get()
      return result.data[0] || null
    },
    async upsertByRef(providerType, refId, data) {
      const existing = await this.findByRef(providerType, refId)
      if (existing) {
        return this.updateById(existing._id, data)
      }
      return this.create({ ...data, provider_type: providerType, ref_id: refId })
    }
  }
}

function createMerchantLogRepository(db) {
  return createCollectionRepository(db, 'merchant_action_logs')
}

function createUserRepository(db) {
  const users = db.collection('users')
  return {
    async findByOpenid(openid) {
      const result = await users.where({ openid }).limit(1).get()
      return result.data[0] || null
    }
  }
}

function createServiceRepository(db) {
  const services = db.collection('services')
  return {
    async findById(id) {
      try {
        const result = await services.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    }
  }
}

function createOrderRepository(db) {
  const base = createCollectionRepository(db, 'orders')
  const orders = db.collection('orders')
  return {
    ...base,
    async findByMerchantId(merchantId) {
      const result = await orders
        .where({ merchant_id: merchantId })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    }
  }
}

function createMessageRepository(db) {
  return createCollectionRepository(db, 'messages')
}

module.exports = {
  createMerchantRepository,
  createMerchantServiceRepository,
  createServiceProviderRepository,
  createMerchantLogRepository,
  createUserRepository,
  createServiceRepository,
  createOrderRepository,
  createMessageRepository
}
