function withDocId(record, id) {
  if (!record) return null;
  return {
    _id: record._id || id,
    ...record,
  };
}

function createCollectionRepository(db, collectionName) {
  const collection = db.collection(collectionName);

  return {
    async findAll() {
      const result = await collection.orderBy("sort", "asc").get();
      return result.data || [];
    },

    async findById(id) {
      try {
        const result = await collection.doc(id).get();
        return withDocId(result.data, id);
      } catch (error) {
        return null;
      }
    },

    async findByCategoryId(categoryId) {
      const result = await collection.where({ category_id: categoryId }).get();
      return result.data || [];
    },

    async create(data) {
      const result = await collection.add({ data });
      return {
        ...data,
        _id: result._id,
      };
    },

    async upsert(data) {
      if (!data._id) {
        return this.create(data);
      }

      const { _id, ...docData } = data;
      await collection.doc(_id).set({ data: docData });
      return {
        ...data,
      };
    },

    async updateById(id, data) {
      await collection.doc(id).update({ data });
      return this.findById(id);
    },

    async deleteById(id) {
      try {
        await collection.doc(id).remove();
        return true;
      } catch (error) {
        return false;
      }
    },
  };
}

function createUserReadRepository(db) {
  const users = db.collection("users");

  return {
    async findByOpenid(openid) {
      const result = await users.where({ openid }).limit(1).get();
      return result.data[0] || null;
    },
  };
}

function createOrderReadRepository(db) {
  const orders = db.collection("orders");

  return {
    async findByServiceId(serviceId) {
      const result = await orders
        .where({ service_id: serviceId })
        .limit(1)
        .get();
      return result.data || [];
    },
  };
}

module.exports = {
  createCategoryRepository: (db) =>
    createCollectionRepository(db, "service_categories"),
  createServiceRepository: (db) => createCollectionRepository(db, "services"),
  createUserReadRepository,
  createOrderReadRepository,
};
