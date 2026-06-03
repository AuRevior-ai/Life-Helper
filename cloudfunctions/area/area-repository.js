function createAreaRepository(db) {
  const areas = db.collection("service_areas");

  return {
    async findAll() {
      const result = await areas
        .orderBy("sort", "asc")
        .orderBy("updated_at", "desc")
        .get();
      return result.data || [];
    },

    async findEnabled() {
      const result = await areas
        .where({ status: "enabled" })
        .orderBy("sort", "asc")
        .orderBy("updated_at", "desc")
        .get();
      return result.data || [];
    },

    async findById(id) {
      try {
        const result = await areas.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },

    async create(data) {
      const result = await areas.add({ data });
      return { ...data, _id: result._id };
    },

    async updateById(id, data) {
      await areas.doc(id).update({ data });
      const result = await areas.doc(id).get();
      return result.data || null;
    },
  };
}

module.exports = {
  createAreaRepository,
};
