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

    async findByOutTradeNo(outTradeNo) {
      const result = await orders.where({ out_trade_no: outTradeNo }).limit(1).get()
      return result.data[0] || null
    },

    async updateById(id, data) {
      await orders.doc(id).update({ data })
      return this.findById(id)
    },

    async markPaidIfUnpaid(id, data) {
      const result = await orders
        .where({
          _id: id,
          pay_status: db.command.neq('paid')
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
