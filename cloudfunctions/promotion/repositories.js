function createMemberPlanRepository(db) {
  const memberPlans = db.collection('member_plans')
  return {
    async create(data) {
      const result = await memberPlans.add({ data })
      return { ...data, _id: result._id }
    },
    async findAll() {
      const result = await memberPlans.orderBy('sort', 'asc').get()
      return result.data || []
    },
    async findById(id) {
      try {
        const result = await memberPlans.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },
    async updateById(id, data) {
      await memberPlans.doc(id).update({ data })
      const result = await memberPlans.doc(id).get()
      return result.data || null
    }
  }
}

function createMembershipRepository(db) {
  const memberships = db.collection('user_memberships')
  return {
    async create(data) {
      const result = await memberships.add({ data })
      return { ...data, _id: result._id }
    },
    async findByUserId(userId) {
      const result = await memberships.where({ user_id: userId }).limit(1).get()
      return result.data && result.data[0] ? result.data[0] : null
    },
    async findActiveByUserId(userId, now) {
      const result = await memberships.where({ user_id: userId, status: 'active' }).limit(1).get()
      const membership = result.data && result.data[0] ? result.data[0] : null
      if (!membership || new Date(membership.expired_at) <= now) return null
      return membership
    },
    async updateById(id, data) {
      await memberships.doc(id).update({ data })
      const result = await memberships.doc(id).get()
      return result.data || null
    }
  }
}

function createCouponTemplateRepository(db) {
  const couponTemplates = db.collection('coupon_templates')
  return {
    async create(data) {
      const result = await couponTemplates.add({ data })
      return { ...data, _id: result._id }
    },
    async findAll() {
      const result = await couponTemplates.orderBy('created_at', 'desc').get()
      return result.data || []
    },
    async findActive() {
      const result = await couponTemplates.where({ status: 'active' }).orderBy('created_at', 'desc').get()
      return result.data || []
    },
    async findById(id) {
      try {
        const result = await couponTemplates.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },
    async updateById(id, data) {
      await couponTemplates.doc(id).update({ data })
      const result = await couponTemplates.doc(id).get()
      return result.data || null
    }
  }
}

function createUserCouponRepository(db) {
  const userCoupons = db.collection('user_coupons')
  return {
    async create(data) {
      const result = await userCoupons.add({ data })
      return { ...data, _id: result._id }
    },
    async findById(id) {
      try {
        const result = await userCoupons.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },
    async findByUserId(userId) {
      const result = await userCoupons.where({ user_id: userId }).orderBy('created_at', 'desc').get()
      return result.data || []
    },
    async findByUserAndTemplate(userId, templateId) {
      const result = await userCoupons.where({ user_id: userId, coupon_template_id: templateId }).get()
      return result.data || []
    },
    async updateById(id, data) {
      await userCoupons.doc(id).update({ data })
      const result = await userCoupons.doc(id).get()
      return result.data || null
    },
    async lockUnusedCoupon(id, userId, orderId, data) {
      const result = await userCoupons.where({ _id: id, user_id: userId, status: 'unused' }).update({
        data: { ...data, status: 'locked', locked_order_id: orderId }
      })
      if (!result.stats || result.stats.updated !== 1) return null
      return this.findById(id)
    },
    async useLockedCoupon(id, orderId, data) {
      const result = await userCoupons.where({ _id: id, status: 'locked', locked_order_id: orderId }).update({
        data: { ...data, status: 'used', used_order_id: orderId }
      })
      if (!result.stats || result.stats.updated !== 1) return null
      return this.findById(id)
    },
    async releaseLockedCoupon(id, orderId, data) {
      const result = await userCoupons.where({ _id: id, status: 'locked', locked_order_id: orderId }).update({
        data: { ...data, status: 'unused', locked_order_id: '' }
      })
      if (!result.stats || result.stats.updated !== 1) return null
      return this.findById(id)
    }
  }
}

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
  createMemberPlanRepository,
  createMembershipRepository,
  createCouponTemplateRepository,
  createUserCouponRepository,
  createUserRepository
}

