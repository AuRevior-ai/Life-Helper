function parsePositiveInteger(value, fallback) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    return fallback;
  }
  return number;
}

function normalizePage(payload = {}, options = {}) {
  const defaultPageSize = options.defaultPageSize || 20;
  const maxPageSize = options.maxPageSize || 50;
  const page = parsePositiveInteger(payload.page, 1);
  const pageSize = Math.min(
    parsePositiveInteger(payload.pageSize, defaultPageSize),
    maxPageSize,
  );
  return { page, pageSize };
}

function buildPageResult(list, pageInfo = {}, options = {}) {
  const page = parsePositiveInteger(pageInfo.page, 1);
  const pageSize = parsePositiveInteger(pageInfo.pageSize, 20);
  const total = parsePositiveInteger(pageInfo.total, 0);
  const result = {
    list,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };

  if (options.listKey) {
    result[options.listKey] = list;
  }

  return result;
}

function paginateList(records, payload = {}, options = {}) {
  const { page, pageSize } = normalizePage(payload, options);
  const total = records.length;
  const start = (page - 1) * pageSize;
  const list = records.slice(start, start + pageSize);
  return buildPageResult(list, { total, page, pageSize }, options);
}

module.exports = {
  normalizePage,
  buildPageResult,
  paginateList,
};
