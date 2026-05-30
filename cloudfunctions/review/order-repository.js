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
    },

    async updateById(id, data) {
      await orders.doc(id).update({ data })
      const result = await orders.doc(id).get()
      return result.data || null
    },

    async completePendingReviewOrder(id, data) {
      const result = await orders
        .where({
          _id: id,
          status: 'pending_review'
        })
        .update({ data })

      if (!result.stats || result.stats.updated !== 1) {
        return null
      }

      return this.findById(id)
    }
  }
}

module.exports = {
  createOrderRepository
}
