function createUserRepository(db) {
  const users = db.collection("users");

  return {
    async findByOpenid(openid) {
      const result = await users.where({ openid }).limit(1).get();
      return result.data[0] || null;
    },

    async findById(id) {
      const result = await users.doc(id).get();
      return result.data || null;
    },

    async findByRole(role) {
      const result = await users.where({ role }).limit(1).get();
      return result.data[0] || null;
    },

    async create(data) {
      const result = await users.add({ data });
      return {
        ...data,
        _id: result._id,
      };
    },

    async updateById(id, data) {
      await users.doc(id).update({ data });
      const result = await users.doc(id).get();
      return result.data || null;
    },
  };
}

module.exports = {
  createUserRepository,
};
