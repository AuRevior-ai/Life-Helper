const test = require('node:test')
const assert = require('node:assert/strict')
const { createQualificationEnv } = require('./_phase20.helpers')

test('qualification draft, submit, review, and sensitive masking follow mock state machine', async () => {
  const { handleQualification } = require('../cloudfunctions/qualification/handler')
  const env = createQualificationEnv()

  const initial = await handleQualification({ action: 'getMyQualification' }, env)
  assert.equal(initial.success, true)
  assert.equal(initial.data.qualification_status, 'NOT_SUBMITTED')

  const draft = await handleQualification({
    action: 'saveQualificationDraft',
    subjectType: 'individual',
    realNameMock: '张师傅',
    idCardMock: '330102199001019876',
    phone: '13800138000',
    serviceCategories: ['家政保洁'],
    agreementChecked: true
  }, env)
  assert.equal(draft.success, true)
  assert.equal(draft.data.qualification.qualification_status, 'DRAFT')
  assert.equal(draft.data.qualification.id_card_last4, '9876')
  assert.equal(draft.data.qualification.id_card_masked, '**************9876')
  assert.equal(Object.prototype.hasOwnProperty.call(draft.data.qualification, 'idCardMock'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(draft.data.qualification, 'id_card_mock'), false)

  const submit = await handleQualification({ action: 'submitQualification' }, env)
  assert.equal(submit.success, true)
  assert.equal(submit.data.qualification.qualification_status, 'PENDING_REVIEW')
  assert.equal(submit.data.qualification.submit_count, 1)

  const deny = await handleQualification({
    action: 'adminReviewQualification',
    qualificationId: submit.data.qualification._id,
    reviewResult: 'APPROVED',
    reason: '资料符合 mock 审核要求'
  }, env)
  assert.equal(deny.success, false)
  assert.equal(deny.errorCode, 'PERMISSION_DENIED')

  const approved = await handleQualification({
    action: 'adminReviewQualification',
    qualificationId: submit.data.qualification._id,
    reviewResult: 'APPROVED',
    reason: '资料符合 mock 审核要求'
  }, { ...env, openid: 'openid_admin' })
  assert.equal(approved.success, true)
  assert.equal(approved.data.qualification.qualification_status, 'APPROVED')
  assert.equal(approved.data.qualification.reviewer_openid, 'openid_admin')
  assert.equal(env.onboardingLogs.records.at(-1).event_type, 'qualification_review')
})

test('rejected or supplement-required qualification can be resubmitted by owner only', async () => {
  const { handleQualification } = require('../cloudfunctions/qualification/handler')
  const env = createQualificationEnv()
  const draft = await handleQualification({ action: 'saveQualificationDraft', agreementChecked: true }, env)
  const submitted = await handleQualification({ action: 'submitQualification' }, env)
  await handleQualification({
    action: 'adminReviewQualification',
    qualificationId: submitted.data.qualification._id,
    reviewResult: 'NEED_SUPPLEMENT',
    reason: '请补充 mock 保险信息',
    supplementRequiredFields: ['insurance_info']
  }, { ...env, openid: 'openid_admin' })

  const otherResubmit = await handleQualification({ action: 'resubmitQualification' }, { ...env, openid: 'openid_other' })
  assert.equal(otherResubmit.success, false)
  assert.equal(otherResubmit.errorCode, 'QUALIFICATION_NOT_FOUND')

  const ownerResubmit = await handleQualification({ action: 'resubmitQualification' }, env)
  assert.equal(ownerResubmit.success, true)
  assert.equal(ownerResubmit.data.qualification._id, draft.data.qualification._id)
  assert.equal(ownerResubmit.data.qualification.qualification_status, 'PENDING_REVIEW')
  assert.equal(ownerResubmit.data.qualification.submit_count, 2)
})
