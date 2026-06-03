const cloud = require("wx-server-sdk");
const { handleQualification } = require("./handler");
const {
  createUserRepository,
  createMerchantRepository,
  createQualificationRepository,
  createDepositRepository,
  createRiskRecordRepository,
  createOnboardingLogRepository,
} = require("./repositories");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  return handleQualification(event, {
    openid: wxContext.OPENID,
    users: createUserRepository(db),
    merchants: createMerchantRepository(db),
    qualifications: createQualificationRepository(db),
    deposits: createDepositRepository(db),
    riskRecords: createRiskRecordRepository(db),
    onboardingLogs: createOnboardingLogRepository(db),
  });
};
