const { success, fail, serviceError } = require("./_shared/response");
const { getPayload } = require("./_shared/payload");
const { getNow } = require("./_shared/time");

const USER_ROLE = Object.freeze({
  ADMIN: "admin",
});

const USER_STATUS = Object.freeze({
  NORMAL: "normal",
  DISABLED: "disabled",
});

const SERVICE_AREA_STATUS = Object.freeze({
  ENABLED: "enabled",
  DISABLED: "disabled",
});

function trimText(value) {
  return `${value || ""}`.trim();
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isMissingCollectionError(error = {}) {
  return (
    error.errCode === -502005 ||
    error.code === -502005 ||
    /-502005|database collection not|collection .*not/i.test(
      error.message || "",
    )
  );
}

function requireOpenid(env) {
  if (!env.openid) {
    throw serviceError("OPENID_MISSING", "无法获取用户 openid");
  }
  return env.openid;
}

async function requireCurrentUser(env) {
  const user =
    env.users && env.users.findByOpenid
      ? await env.users.findByOpenid(requireOpenid(env))
      : null;
  if (!user || user.status === USER_STATUS.DISABLED) {
    throw serviceError("USER_NOT_FOUND", "用户不存在或已禁用");
  }
  return user;
}

async function requireAdmin(env) {
  const user = await requireCurrentUser(env);
  if (user.role !== USER_ROLE.ADMIN) {
    throw serviceError("PERMISSION_DENIED", "当前操作需要管理员权限");
  }
  return user;
}

function buildFullName(area = {}) {
  return [area.city, area.district, area.street, area.community]
    .map((item) => trimText(item))
    .filter(Boolean)
    .join(" ");
}

function normalizeAreaPayload(payload = {}) {
  return {
    city: trimText(payload.city),
    district: trimText(payload.district),
    street: trimText(payload.street),
    community: trimText(payload.community),
    latitude: toNumberOrNull(payload.latitude),
    longitude: toNumberOrNull(payload.longitude),
    center_latitude: toNumberOrNull(
      payload.center_latitude || payload.centerLatitude || payload.latitude,
    ),
    center_longitude: toNumberOrNull(
      payload.center_longitude || payload.centerLongitude || payload.longitude,
    ),
    adcode: trimText(payload.adcode),
    city_code: trimText(payload.city_code || payload.cityCode),
    district_code: trimText(payload.district_code || payload.districtCode),
    map_address: trimText(payload.map_address || payload.mapAddress),
    map_poi_name: trimText(payload.map_poi_name || payload.mapPoiName),
    sort: Number.isFinite(Number(payload.sort)) ? Number(payload.sort) : 0,
  };
}

function validateAreaPayload(area) {
  if (!area.city || !area.community) {
    throw serviceError("SERVICE_AREA_REQUIRED", "请填写城市和小区");
  }
}

async function getServiceAreaList(event, env) {
  const payload = getPayload(event);
  const includeDisabled = payload.includeDisabled === true;
  if (includeDisabled) {
    await requireAdmin(env);
    try {
      const areas = await env.areas.findAll();
      return success({ areas });
    } catch (error) {
      if (isMissingCollectionError(error)) {
        return success({
          areas: [],
          collection_missing: true,
          collection_name: "service_areas",
        });
      }
      throw error;
    }
  }

  try {
    const areas = env.areas.findEnabled
      ? await env.areas.findEnabled()
      : (await env.areas.findAll()).filter(
          (area) => area.status === SERVICE_AREA_STATUS.ENABLED,
        );
    return success({ areas });
  } catch (error) {
    if (isMissingCollectionError(error)) {
      return success({
        areas: [],
        collection_missing: true,
        collection_name: "service_areas",
      });
    }
    throw error;
  }
}

async function adminCreateServiceArea(event, env) {
  await requireAdmin(env);
  const payload = normalizeAreaPayload(getPayload(event));
  validateAreaPayload(payload);
  const now = getNow(env);
  const area = await env.areas.create({
    ...payload,
    full_name: buildFullName(payload),
    status: SERVICE_AREA_STATUS.ENABLED,
    created_at: now,
    updated_at: now,
  });
  return success({ area });
}

async function adminUpdateServiceArea(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  if (!payload.areaId) {
    throw serviceError("SERVICE_AREA_ID_MISSING", "缺少服务区域 ID");
  }
  const current = await env.areas.findById(payload.areaId);
  if (!current) {
    throw serviceError("SERVICE_AREA_NOT_FOUND", "服务区域不存在");
  }
  const nextArea = {
    ...current,
    ...normalizeAreaPayload({ ...current, ...payload }),
  };
  validateAreaPayload(nextArea);
  const area = await env.areas.updateById(payload.areaId, {
    city: nextArea.city,
    district: nextArea.district,
    street: nextArea.street,
    community: nextArea.community,
    latitude: nextArea.latitude,
    longitude: nextArea.longitude,
    center_latitude: nextArea.center_latitude,
    center_longitude: nextArea.center_longitude,
    adcode: nextArea.adcode,
    city_code: nextArea.city_code,
    district_code: nextArea.district_code,
    map_address: nextArea.map_address,
    map_poi_name: nextArea.map_poi_name,
    full_name: buildFullName(nextArea),
    sort: nextArea.sort,
    updated_at: getNow(env),
  });
  return success({ area });
}

async function adminUpdateServiceAreaLocation(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  if (!payload.areaId) {
    throw serviceError("SERVICE_AREA_ID_MISSING", "缺少服务区域 ID");
  }
  const area = await env.areas.updateById(payload.areaId, {
    latitude: toNumberOrNull(payload.latitude),
    longitude: toNumberOrNull(payload.longitude),
    center_latitude: toNumberOrNull(
      payload.center_latitude || payload.centerLatitude || payload.latitude,
    ),
    center_longitude: toNumberOrNull(
      payload.center_longitude || payload.centerLongitude || payload.longitude,
    ),
    adcode: trimText(payload.adcode),
    city_code: trimText(payload.city_code || payload.cityCode),
    district_code: trimText(payload.district_code || payload.districtCode),
    map_address: trimText(payload.map_address || payload.mapAddress),
    map_poi_name: trimText(payload.map_poi_name || payload.mapPoiName),
    updated_at: getNow(env),
  });
  if (!area) {
    throw serviceError("SERVICE_AREA_NOT_FOUND", "服务区域不存在");
  }
  return success({ area });
}

async function adminGetServiceAreaMapList(event, env) {
  await requireAdmin(env);
  const areas = await env.areas.findAll();
  return success({ areas });
}

async function updateAreaStatus(event, env, status) {
  await requireAdmin(env);
  const payload = getPayload(event);
  if (!payload.areaId) {
    throw serviceError("SERVICE_AREA_ID_MISSING", "缺少服务区域 ID");
  }
  const area = await env.areas.updateById(payload.areaId, {
    status,
    updated_at: getNow(env),
  });
  if (!area) {
    throw serviceError("SERVICE_AREA_NOT_FOUND", "服务区域不存在");
  }
  return success({ area });
}

function adminEnableServiceArea(event, env) {
  return updateAreaStatus(event, env, SERVICE_AREA_STATUS.ENABLED);
}

function adminDisableServiceArea(event, env) {
  return updateAreaStatus(event, env, SERVICE_AREA_STATUS.DISABLED);
}

const actions = Object.freeze({
  getServiceAreaList,
  adminCreateServiceArea,
  adminUpdateServiceArea,
  adminUpdateServiceAreaLocation,
  adminGetServiceAreaMapList,
  adminEnableServiceArea,
  adminDisableServiceArea,
});

async function handleArea(event = {}, env) {
  const action = actions[event.action];
  if (!action) {
    return fail("ACTION_NOT_FOUND", "未知区域操作");
  }

  try {
    return await action(event, env);
  } catch (error) {
    return fail(
      error.errorCode || "INTERNAL_ERROR",
      error.message || "区域操作失败",
    );
  }
}

module.exports = {
  handleArea,
  getServiceAreaList,
  adminCreateServiceArea,
  adminUpdateServiceArea,
  adminUpdateServiceAreaLocation,
  adminGetServiceAreaMapList,
  adminEnableServiceArea,
  adminDisableServiceArea,
  SERVICE_AREA_STATUS,
};
