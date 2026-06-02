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
    }
  }
}

module.exports = {
  createServiceProviderRepository
}
