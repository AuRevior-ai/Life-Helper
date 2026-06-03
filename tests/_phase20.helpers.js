function fixedNow() {
  return new Date("2026-06-02T08:00:00.000Z");
}

function createMemoryCollection(initialRecords = []) {
  const records = initialRecords.map((record) => ({ ...record }));
  return {
    records,
    async findAll() {
      return records.map((record) => ({ ...record }));
    },
    async findById(id) {
      const record = records.find((item) => item._id === id);
      return record ? { ...record } : null;
    },
    async create(data) {
      const record = { ...data, _id: data._id || `id_${records.length + 1}` };
      records.push(record);
      return { ...record };
    },
    async updateById(id, data) {
      const record = records.find((item) => item._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
  };
}

function createMemoryUsers(initialUsers = []) {
  const collection = createMemoryCollection(initialUsers);
  return {
    ...collection,
    async findByOpenid(openid) {
      const user = collection.records.find((item) => item.openid === openid);
      return user ? { ...user } : null;
    },
  };
}

function createMemoryMerchants(initialMerchants = []) {
  const collection = createMemoryCollection(initialMerchants);
  return {
    ...collection,
    async findByUserId(userId) {
      const merchant = collection.records.find(
        (item) => item.user_id === userId,
      );
      return merchant ? { ...merchant } : null;
    },
  };
}

function createOwnerRepository(
  collection,
  ownerKeys = ["merchant_id", "provider_id"],
) {
  return {
    ...collection,
    async findByOwner(query = {}) {
      const record = collection.records.find(
        (item) =>
          ownerKeys.every((key) => !query[key] || item[key] === query[key]) &&
          (!query.provider_type || item.provider_type === query.provider_type),
      );
      return record ? { ...record } : null;
    },
    async findByStatus(status) {
      return collection.records
        .filter(
          (item) =>
            item.qualification_status === status ||
            item.deposit_status === status,
        )
        .map((item) => ({ ...item }));
    },
    async findByMerchantId(merchantId) {
      return collection.records
        .filter((item) => item.merchant_id === merchantId)
        .map((item) => ({ ...item }));
    },
  };
}

function createQualificationEnv(overrides = {}) {
  const qualifications = createOwnerRepository(createMemoryCollection());
  const deposits = createOwnerRepository(createMemoryCollection());
  const riskRecords = createMemoryCollection();
  const onboardingLogs = createMemoryCollection();
  return {
    openid: "openid_merchant",
    now: fixedNow,
    users: createMemoryUsers([
      {
        _id: "user_merchant",
        openid: "openid_merchant",
        role: "user",
        status: "normal",
      },
      {
        _id: "user_other",
        openid: "openid_other",
        role: "user",
        status: "normal",
      },
      {
        _id: "user_admin",
        openid: "openid_admin",
        role: "admin",
        status: "normal",
      },
    ]),
    merchants: createMemoryMerchants([
      {
        _id: "merchant_1",
        user_id: "openid_merchant",
        store_name: "未来家政店",
        audit_status: "approved",
        status: "normal",
      },
      {
        _id: "merchant_2",
        user_id: "openid_other",
        store_name: "其他店",
        audit_status: "approved",
        status: "normal",
      },
    ]),
    qualifications,
    deposits,
    riskRecords,
    onboardingLogs,
    ...overrides,
  };
}

module.exports = {
  fixedNow,
  createMemoryCollection,
  createMemoryUsers,
  createMemoryMerchants,
  createOwnerRepository,
  createQualificationEnv,
};
