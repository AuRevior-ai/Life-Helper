const { serviceError } = require("./_shared/response");
const { SUBJECT_TYPE } = require("./qualification.constants");

function trimText(value) {
  return `${value || ""}`.trim();
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value.map((item) => trimText(item)).filter(Boolean)
    : [];
}

function toBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function maskIdentifier(value) {
  const text = trimText(value).replace(/\s+/g, "");
  if (!text) return { masked: "", last4: "" };
  const last4 = text.slice(-4);
  return {
    masked: `${"*".repeat(Math.max(text.length - 4, 0))}${last4}`,
    last4,
  };
}

function normalizeInsuranceInfo(input = {}) {
  const policy = maskIdentifier(
    input.policyNoMock ||
      input.policy_no_mock ||
      input.policyNo ||
      input.policy_no,
  );
  return {
    insured: toBoolean(input.insured),
    company_mock: trimText(input.companyMock || input.company_mock),
    policy_no_masked: policy.masked,
    policy_no_last4: policy.last4,
    effective_date: trimText(input.effectiveDate || input.effective_date),
    expired_date: trimText(input.expiredDate || input.expired_date),
    policy_file: trimText(input.policyFile || input.policy_file),
    review_status:
      trimText(input.reviewStatus || input.review_status) || "PENDING_REVIEW",
    remark: trimText(input.remark),
  };
}

function normalizeQualificationPayload(payload = {}) {
  const idCard = maskIdentifier(
    payload.idCardMock ||
      payload.id_card_mock ||
      payload.idCardNo ||
      payload.id_card_no,
  );
  const businessLicense = maskIdentifier(
    payload.businessLicenseNoMock ||
      payload.business_license_no_mock ||
      payload.businessLicenseNo ||
      payload.business_license_no,
  );
  const legalPersonId = maskIdentifier(
    payload.legalPersonIdMock ||
      payload.legal_person_id_mock ||
      payload.legalPersonId ||
      payload.legal_person_id,
  );
  const subjectType =
    trimText(payload.subjectType || payload.subject_type) ||
    SUBJECT_TYPE.INDIVIDUAL;
  return {
    subject_type: Object.values(SUBJECT_TYPE).includes(subjectType)
      ? subjectType
      : SUBJECT_TYPE.INDIVIDUAL,
    real_name_mock: trimText(payload.realNameMock || payload.real_name_mock),
    id_card_masked: idCard.masked,
    id_card_last4: idCard.last4,
    phone: trimText(payload.phone),
    service_categories: normalizeArray(
      payload.serviceCategories || payload.service_categories,
    ),
    experience_years: Number(
      payload.experienceYears || payload.experience_years || 0,
    ),
    skill_description: trimText(
      payload.skillDescription || payload.skill_description,
    ),
    certificate_files: normalizeArray(
      payload.certificateFiles || payload.certificate_files,
    ),
    emergency_contact_mock: trimText(
      payload.emergencyContactMock || payload.emergency_contact_mock,
    ),
    business_name: trimText(payload.businessName || payload.business_name),
    business_license_no_masked: businessLicense.masked,
    business_license_no_last4: businessLicense.last4,
    legal_person_name_mock: trimText(
      payload.legalPersonNameMock || payload.legal_person_name_mock,
    ),
    legal_person_id_masked: legalPersonId.masked,
    legal_person_id_last4: legalPersonId.last4,
    license_files: normalizeArray(
      payload.licenseFiles || payload.license_files,
    ),
    storefront_files: normalizeArray(
      payload.storefrontFiles || payload.storefront_files,
    ),
    business_address: trimText(
      payload.businessAddress || payload.business_address,
    ),
    insurance_info: normalizeInsuranceInfo(
      payload.insuranceInfo || payload.insurance_info || {},
    ),
    agreement_checked: toBoolean(
      payload.agreementChecked || payload.agreement_checked,
    ),
  };
}

function requireAgreement(qualification) {
  if (!qualification.agreement_checked) {
    throw serviceError("AGREEMENT_REQUIRED", "请先确认平台服务协议");
  }
}

function requireValidQualificationReview(result) {
  if (!["APPROVED", "REJECTED", "NEED_SUPPLEMENT"].includes(result)) {
    throw serviceError("REVIEW_RESULT_INVALID", "资质审核结果不合法");
  }
}

function requireValidRiskLevel(level) {
  if (!["LOW", "MEDIUM", "HIGH", "BLOCKED"].includes(level)) {
    throw serviceError("RISK_LEVEL_INVALID", "风险等级不合法");
  }
}

module.exports = {
  trimText,
  normalizeArray,
  toBoolean,
  maskIdentifier,
  normalizeQualificationPayload,
  requireAgreement,
  requireValidQualificationReview,
  requireValidRiskLevel,
};
