function pad(value) {
  return `${value}`.padStart(2, "0");
}

function formatDateTime(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function nowIsoString() {
  return new Date().toISOString();
}

module.exports = {
  formatDateTime,
  nowIsoString,
};
