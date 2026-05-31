function createAreaReadRepository(db) {
  const areas = db.collection('service_areas')

  return {
    async findById(id) {
      try {
        const result = await areas.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    }
  }
}

module.exports = {
  createAreaReadRepository
}
