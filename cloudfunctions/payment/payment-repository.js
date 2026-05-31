function createPaymentLogRepository(db) {
  const paymentLogs = db.collection('payment_logs')

  return {
    async create(data) {
      const result = await paymentLogs.add({ data })
      return {
        ...data,
        _id: result._id
      }
    }
  }
}

module.exports = {
  createPaymentLogRepository
}
