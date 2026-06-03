function createMessageRepository(db) {
  const messages = db.collection("messages");

  return {
    async findByUserId(userId) {
      const result = await messages
        .where({ user_id: userId })
        .orderBy("created_at", "desc")
        .get();
      return result.data || [];
    },

    async findById(id) {
      try {
        const result = await messages.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },

    async updateById(id, data) {
      await messages.doc(id).update({ data });
      return this.findById(id);
    },

    async markAllRead(userId, data) {
      await messages
        .where({ user_id: userId, is_read: false })
        .update({ data });
      return true;
    },
  };
}

module.exports = {
  createMessageRepository,
};
