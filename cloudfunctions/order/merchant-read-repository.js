function createMerchantServiceReadRepository(db) {
  const merchantServices = db.collection('merchant_services')
  return {
    async findById(id) {
      try {
        const result = await merchantServices.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    }
  }
}

function createMerchantReadRepository(db) {
  const merchants = db.collection('merchants')
  return {
    async findById(id) {
      try {
        const result = await merchants.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    }
  }
}

function createServiceProviderReadRepository(db) {
  const serviceProviders = db.collection('service_providers')
  return {
    async findById(id) {
      try {
        const result = await serviceProviders.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },
    async findByRef(providerType, refId) {
      const result = await serviceProviders
        .where({ provider_type: providerType, ref_id: refId })
        .limit(1)
        .get()
      return result.data[0] || null
    }
  }
}

module.exports = {
  createMerchantServiceReadRepository,
  createMerchantReadRepository,
  createServiceProviderReadRepository
}
