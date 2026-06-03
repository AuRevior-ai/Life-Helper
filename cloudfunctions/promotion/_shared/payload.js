function getPayload(event = {}) {
  if (event.payload && typeof event.payload === "object") {
    return event.payload;
  }

  const { action, ...payload } = event;
  return payload;
}

module.exports = {
  getPayload,
};
