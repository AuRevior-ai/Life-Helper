function createUserRepository(db) {
  const users = db.collection('users')

  return {
    async findByOpenid(openid) {
      const result = await users.where({ openid }).limit(1).get()
      return result.data[0] || null
    },

    async findById(id) {
      try {
        const result = await users.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },

    async updateById(id, data) {
      await users.doc(id).update({ data })
      const result = await users.doc(id).get()
      return result.data || null
    }
  }
}

module.exports = {
  createUserRepository
}
