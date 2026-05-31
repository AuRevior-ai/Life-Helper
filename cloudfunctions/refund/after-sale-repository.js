function createAfterSaleRepository(db) {
  const afterSales = db.collection('after_sales')

  return {
    async create(data) {
      const result = await afterSales.add({ data })
      return {
        ...data,
        _id: result._id
      }
    },

    async findById(id) {
      try {
        const result = await afterSales.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },

    async findActiveByOrderId(orderId) {
      const result = await afterSales
        .where({
          order_id: orderId,
          status: db.command.in(['pending', 'approved'])
        })
        .limit(1)
        .get()
      return result.data[0] || null
    },

    async findByUserId(userId) {
      const result = await afterSales
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    },

    async findAll() {
      const result = await afterSales.orderBy('created_at', 'desc').get()
      return result.data || []
    },

    async updateById(id, data) {
      await afterSales.doc(id).update({ data })
      return this.findById(id)
    }
  }
}

module.exports = {
  createAfterSaleRepository
}
