function withDocId(record, id) {
  if (!record) return null;
  return {
    _id: record._id || id,
    ...record,
  };
}

function escapeRegExp(value) {
  return `${value || ""}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function queryCollectionPage(collection, where, pageInfo, orderByField) {
  const page = Number(pageInfo.page || 1);
  const pageSize = Number(pageInfo.pageSize || 20);
  const query = where ? collection.where(where) : collection;
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

function buildOrderWhere(db, filters = {}) {
  const exactWhere = {};
  if (filters.status) exactWhere.status = filters.status;
  if (filters.category_id) exactWhere.category_id = filters.category_id;

  const conditions = [];
  if (Object.keys(exactWhere).length > 0) conditions.push(exactWhere);

  const keyword = `${filters.keyword || ""}`.trim();
  if (keyword && db.RegExp && db.command && db.command.or) {
    const keywordRegExp = db.RegExp({
      regexp: escapeRegExp(keyword),
      options: "i",
    });
    conditions.push(
      db.command.or([
        { order_no: keywordRegExp },
        { service_name: keywordRegExp },
        { contact_name: keywordRegExp },
        { contact_phone: keywordRegExp },
      ]),
    );
  }

  if (conditions.length === 0) return null;
  if (conditions.length === 1) return conditions[0];
  if (db.command && db.command.and) return db.command.and(conditions);
  return exactWhere;
}

function createUserRepository(db) {
  const users = db.collection("users");

  return {
    async findByOpenid(openid) {
      const result = await users.where({ openid }).limit(1).get();
      return result.data[0] || null;
    },

    async findById(id) {
      try {
        const result = await users.doc(id).get();
        return withDocId(result.data, id);
      } catch (error) {
        return null;
      }
    },

    async findAll() {
      const result = await users.orderBy("created_at", "desc").get();
      return result.data || [];
    },

    async queryPage(filters = {}, pageInfo = {}) {
      const where = {};
      if (filters.role) where.role = filters.role;
      if (filters.status) where.status = filters.status;
      return queryCollectionPage(
        users,
        Object.keys(where).length > 0 ? where : null,
        pageInfo,
        "created_at",
      );
    },

    async countNormalAdmins() {
      const result = await users
        .where({ role: "admin", status: "normal" })
        .count();
      return result.total || 0;
    },

    async updateById(id, data) {
      await users.doc(id).update({ data });
      return this.findById(id);
    },
  };
}

function createOrderRepository(db) {
  const orders = db.collection("orders");

  return {
    async findAll() {
      const result = await orders.orderBy("created_at", "desc").get();
      return result.data || [];
    },

    async queryPage(filters = {}, pageInfo = {}) {
      return queryCollectionPage(
        orders,
        buildOrderWhere(db, filters),
        pageInfo,
        "created_at",
      );
    },

    async findById(id) {
      try {
        const result = await orders.doc(id).get();
        return withDocId(result.data, id);
      } catch (error) {
        return null;
      }
    },

    async updateById(id, data) {
      await orders.doc(id).update({ data });
      return this.findById(id);
    },
  };
}

function createWorkerRepository(db) {
  const workers = db.collection("workers");

  return {
    async findAll() {
      const result = await workers.orderBy("created_at", "desc").get();
      return result.data || [];
    },

    async findByAuditStatus(status) {
      const result = await workers
        .where({ audit_status: status })
        .orderBy("created_at", "desc")
        .get();
      return result.data || [];
    },
  };
}

function createReadRepository(db, collectionName) {
  const collection = db.collection(collectionName);

  return {
    async findAll() {
      const result = await collection.orderBy("sort", "asc").get();
      return result.data || [];
    },
  };
}

function createAdminOperationLogRepository(db) {
  const logs = db.collection("admin_operation_logs");

  return {
    async create(data) {
      const result = await logs.add({ data });
      return {
        ...data,
        _id: result._id,
      };
    },
  };
}

module.exports = {
  createUserRepository,
  createOrderRepository,
  createWorkerRepository,
  createCategoryRepository: (db) =>
    createReadRepository(db, "service_categories"),
  createServiceRepository: (db) => createReadRepository(db, "services"),
  createAdminOperationLogRepository,
};
