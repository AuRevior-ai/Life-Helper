function createOrderRepository(db) {
  const orders = db.collection("orders");

  return {
    async findById(id) {
      try {
        const result = await orders.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },

    async updateById(id, data) {
      await orders.doc(id).update({ data });
      return this.findById(id);
    },
  };
}

module.exports = {
  createOrderRepository,
};
