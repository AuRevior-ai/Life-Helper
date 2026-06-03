function createDispatchLogRepository(db) {
  const logs = db.collection("dispatch_logs");

  return {
    async create(data) {
      const result = await logs.add({ data });
      return { ...data, _id: result._id };
    },
  };
}

module.exports = {
  createDispatchLogRepository,
};
