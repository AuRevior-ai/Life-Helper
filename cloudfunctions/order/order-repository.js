function createOrderRepository(db) {
  const orders = db.collection('orders')

  return {
    async findByUserId(userId) {
      const result = await orders
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    },

    async findById(id) {
      try {
        const result = await orders.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },

    async create(data) {
      const result = await orders.add({ data })
      return {
        ...data,
        _id: result._id
      }
    },

    async updateById(id, data) {
      await orders.doc(id).update({ data })
      const result = await orders.doc(id).get()
      return result.data || null
    }
  }
}

function createAddressReadRepository(db) {
  const addresses = db.collection('addresses')

  return {
    async findById(id) {
      try {
        const result = await addresses.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    }
  }
}

module.exports = {
  createOrderRepository,
  createAddressReadRepository
}
