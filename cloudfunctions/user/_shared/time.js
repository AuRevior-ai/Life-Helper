function getNow(env = {}) {
  return env.now ? env.now() : new Date()
}

module.exports = {
  getNow
}
