function createMessageRepository(db) {
  const messages = db.collection("messages");

  return {
    async create(data) {
      const result = await messages.add({ data });
      return {
        ...data,
        _id: result._id,
      };
    },
  };
}

module.exports = {
  createMessageRepository,
};
