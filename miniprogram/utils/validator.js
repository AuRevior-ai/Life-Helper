function isNonEmpty(value) {
  return `${value || ""}`.trim().length > 0;
}

function isPhone(value) {
  return /^1[3-9]\d{9}$/.test(`${value || ""}`.trim());
}

function validateRequiredFields(data, fields) {
  const missing = fields.filter((field) => !isNonEmpty(data[field]));
  return {
    valid: missing.length === 0,
    missing,
  };
}

function validateAddressForm(data) {
  const required = [
    "contact_name",
    "phone",
    "city",
    "community",
    "detail_address",
  ];
  const result = validateRequiredFields(data, required);
  if (!result.valid) return result;
  if (!isPhone(data.phone)) {
    return {
      valid: false,
      missing: [],
      message: "手机号格式不正确",
    };
  }
  return {
    valid: true,
    missing: [],
  };
}

module.exports = {
  isNonEmpty,
  isPhone,
  validateRequiredFields,
  validateAddressForm,
};
