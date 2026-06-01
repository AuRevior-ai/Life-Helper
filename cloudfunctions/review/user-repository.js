function createUserRepository(db) {
  const users = db.collection('users')

  return {
    async findByOpenid(openid) {
      const result = await users.where({ openid }).limit(1).get()
      return result.data && result.data[0] ? result.data[0] : null
    }
  }
}

module.exports = {
  createUserRepository
}
