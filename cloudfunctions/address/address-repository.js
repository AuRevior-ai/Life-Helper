function createAddressRepository(db) {
  const addresses = db.collection("addresses");

  return {
    async findByUserId(userId) {
      const result = await addresses
        .where({ user_id: userId })
        .orderBy("is_default", "desc")
        .orderBy("updated_at", "desc")
        .get();
      return result.data || [];
    },

    async findById(id) {
      try {
        const result = await addresses.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },

    async create(data) {
      const result = await addresses.add({ data });
      return {
        ...data,
        _id: result._id,
      };
    },

    async updateById(id, data) {
      await addresses.doc(id).update({ data });
      const result = await addresses.doc(id).get();
      return result.data || null;
    },

    async deleteById(id) {
      await addresses.doc(id).remove();
      return true;
    },

    async clearDefaultForUser(userId, updatedAt) {
      await addresses.where({ user_id: userId, is_default: true }).update({
        data: {
          is_default: false,
          updated_at: updatedAt,
        },
      });
    },
  };
}

module.exports = {
  createAddressRepository,
};
