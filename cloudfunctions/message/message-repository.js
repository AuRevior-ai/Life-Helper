function buildMessageWhere(filters = {}) {
  const where = {};
  if (filters.user_id) where.user_id = filters.user_id;
  if (filters.role) where.role = filters.role;
  if (filters.is_read !== undefined) where.is_read = filters.is_read;
  return where;
}

function getMessageQuery(messages, filters = {}) {
  const where = buildMessageWhere(filters);
  return Object.keys(where).length > 0 ? messages.where(where) : messages;
}

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

    async queryPage(filters = {}, pageInfo = {}) {
      const page = Number(pageInfo.page || 1);
      const pageSize = Number(pageInfo.pageSize || 20);
      const query = getMessageQuery(messages, filters);
      const countResult = await query.count();
      const result = await query
        .orderBy("created_at", "desc")
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return {
        list: result.data || [],
        total: countResult.total || 0,
        page,
        pageSize,
      };
    },

    async countUnread(filters = {}) {
      const query = getMessageQuery(messages, { ...filters, is_read: false });
      const result = await query.count();
      return result.total || 0;
    },
  };
}

module.exports = {
  createMessageRepository,
};
