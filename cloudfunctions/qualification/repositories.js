async function queryCollectionPage(collection, filters, pageInfo, options = {}) {
  const page = Number(pageInfo.page || 1);
  const pageSize = Number(pageInfo.pageSize || 20);
  const orderByField = options.orderByField || "updated_at";
  const where = Object.keys(filters || {}).reduce((result, key) => {
    if (filters[key]) result[key] = filters[key];
    return result;
  }, {});
  const query =
    Object.keys(where).length > 0 ? collection.where(where) : collection;
  const countResult = await query.count();
  const result = await query
    .orderBy(orderByField, "desc")
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();
  return {
    list: result.data || [],
    total: countResult.total || 0,
    page,
    pageSize,
  };
}

function createCollectionRepository(db, collectionName) {
  const collection = db.collection(collectionName);
  return {
    async findAll() {
      const result = await collection.orderBy("updated_at", "desc").get();
      return result.data || [];
    },
    async queryPage(filters = {}, pageInfo = {}, options = {}) {
      return queryCollectionPage(collection, filters, pageInfo, options);
    },
    async findById(id) {
      try {
        const result = await collection.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },
    async create(data) {
      const result = await collection.add({ data });
      return { ...data, _id: result._id };
    },
    async updateById(id, data) {
      await collection.doc(id).update({ data });
      const result = await collection.doc(id).get();
      return result.data || null;
    },
  };
}

function createOwnerRepository(db, collectionName) {
  const base = createCollectionRepository(db, collectionName);
  const collection = db.collection(collectionName);
  return {
    ...base,
    async findByOwner(query = {}) {
      const where = { provider_type: query.provider_type };
      if (query.merchant_id) where.merchant_id = query.merchant_id;
      if (query.provider_id) where.provider_id = query.provider_id;
      const result = await collection.where(where).limit(1).get();
      return result.data[0] || null;
    },
    async findByMerchantId(merchantId) {
      const result = await collection
        .where({ merchant_id: merchantId })
        .orderBy("updated_at", "desc")
        .get();
      return result.data || [];
    },
  };
}

function createUserRepository(db) {
  const users = db.collection("users");
  return {
    async findByOpenid(openid) {
      const result = await users.where({ openid }).limit(1).get();
      return result.data[0] || null;
    },
  };
}

function createMerchantRepository(db) {
  const merchants = db.collection("merchants");
  return {
    async findByUserId(userId) {
      const result = await merchants.where({ user_id: userId }).limit(1).get();
      return result.data[0] || null;
    },
    async findById(id) {
      try {
        const result = await merchants.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },
  };
}

module.exports = {
  createCollectionRepository,
  createOwnerRepository,
  createUserRepository,
  createMerchantRepository,
  createQualificationRepository: (db) =>
    createOwnerRepository(db, "merchant_qualifications"),
  createDepositRepository: (db) =>
    createOwnerRepository(db, "merchant_deposits"),
  createRiskRecordRepository: (db) =>
    createOwnerRepository(db, "merchant_risk_records"),
  createOnboardingLogRepository: (db) =>
    createCollectionRepository(db, "merchant_onboarding_logs"),
};
