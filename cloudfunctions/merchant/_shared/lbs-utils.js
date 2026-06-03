const SERVICE_RANGE_MODE = Object.freeze({
  ADMIN_AREA: "admin_area",
  RADIUS: "radius",
});

const MAP_POINT_SOURCE = Object.freeze({
  MANUAL_PICK: "manual_pick",
  ADDRESS_PARSE: "address_parse",
  LEGACY_TEXT: "legacy_text",
});

const LBS_MATCH_RESULT = Object.freeze({
  MATCHED_BY_RADIUS: "matched_by_radius",
  MATCHED_BY_ADMIN_AREA: "matched_by_admin_area",
  NOT_MATCHED: "not_matched",
  LOCATION_MISSING: "location_missing",
  LEGACY_COMPAT: "legacy_compat",
});

const DISTANCE_UNIT = Object.freeze({
  METER: "meter",
  KILOMETER: "kilometer",
});

function trimText(value) {
  return `${value || ""}`.trim();
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasPoint(point = {}) {
  return (
    toNumberOrNull(point.latitude) !== null &&
    toNumberOrNull(point.longitude) !== null
  );
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  const aLat = toNumberOrNull(lat1);
  const aLng = toNumberOrNull(lng1);
  const bLat = toNumberOrNull(lat2);
  const bLng = toNumberOrNull(lng2);
  if ([aLat, aLng, bLat, bLng].some((item) => item === null)) return null;
  const earthRadius = 6371000;
  const deltaLat = toRadians(bLat - aLat);
  const deltaLng = toRadians(bLng - aLng);
  const startLat = toRadians(aLat);
  const endLat = toRadians(bLat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
  return (
    2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const meters = calculateDistanceMeters(lat1, lng1, lat2, lng2);
  return meters === null ? null : meters / 1000;
}

function isWithinRadius(pointA = {}, pointB = {}, radiusKm) {
  const radius = Number(radiusKm);
  if (!Number.isFinite(radius) || radius <= 0) return false;
  const distance = calculateDistanceKm(
    pointA.latitude,
    pointA.longitude,
    pointB.latitude,
    pointB.longitude,
  );
  return distance !== null && distance <= radius;
}

function normalizeList(value) {
  if (Array.isArray(value))
    return value.map((item) => trimText(item)).filter(Boolean);
  const text = trimText(value);
  return text ? [text] : [];
}

function listMatches(value, list) {
  const text = trimText(value);
  return Boolean(text) && normalizeList(list).includes(text);
}

function matchAdminArea(orderAddress = {}, provider = {}) {
  const orderAdcode = trimText(
    orderAddress.adcode || orderAddress.district_code,
  );
  const providerAdcodes = normalizeList(
    provider.service_adcodes || provider.adcodes || provider.adcode,
  );
  if (orderAdcode && providerAdcodes.length) {
    return providerAdcodes.includes(orderAdcode)
      ? {
          matched: true,
          match_type: "admin_area",
          distance_km: null,
          reason: LBS_MATCH_RESULT.MATCHED_BY_ADMIN_AREA,
        }
      : {
          matched: false,
          match_type: "none",
          distance_km: null,
          reason: LBS_MATCH_RESULT.NOT_MATCHED,
        };
  }

  if (
    listMatches(
      orderAddress.community,
      provider.service_communities ||
        provider.communities ||
        provider.service_area,
    )
  ) {
    return {
      matched: true,
      match_type: "legacy_text",
      distance_km: null,
      reason: LBS_MATCH_RESULT.LEGACY_COMPAT,
    };
  }
  if (
    listMatches(
      orderAddress.street,
      provider.service_streets || provider.streets,
    )
  ) {
    return {
      matched: true,
      match_type: "admin_area",
      distance_km: null,
      reason: LBS_MATCH_RESULT.MATCHED_BY_ADMIN_AREA,
    };
  }
  if (
    listMatches(
      orderAddress.district,
      provider.service_districts || provider.districts,
    )
  ) {
    return {
      matched: true,
      match_type: "admin_area",
      distance_km: null,
      reason: LBS_MATCH_RESULT.MATCHED_BY_ADMIN_AREA,
    };
  }
  const city = trimText(provider.service_city || provider.city);
  if (city && city === trimText(orderAddress.city)) {
    return {
      matched: true,
      match_type: "admin_area",
      distance_km: null,
      reason: LBS_MATCH_RESULT.MATCHED_BY_ADMIN_AREA,
    };
  }
  return {
    matched: false,
    match_type: "none",
    distance_km: null,
    reason: LBS_MATCH_RESULT.NOT_MATCHED,
  };
}

function getProviderPoint(provider = {}) {
  return {
    latitude:
      provider.base_latitude ?? provider.latitude ?? provider.center_latitude,
    longitude:
      provider.base_longitude ??
      provider.longitude ??
      provider.center_longitude,
  };
}

function matchProviderServiceRange(orderAddress = {}, provider = {}) {
  const mode = provider.service_range_mode || SERVICE_RANGE_MODE.ADMIN_AREA;
  if (mode === SERVICE_RANGE_MODE.RADIUS) {
    const providerPoint = getProviderPoint(provider);
    if (hasPoint(orderAddress) && hasPoint(providerPoint)) {
      const distance = calculateDistanceKm(
        orderAddress.latitude,
        orderAddress.longitude,
        providerPoint.latitude,
        providerPoint.longitude,
      );
      const matched =
        distance !== null &&
        distance <= Number(provider.service_radius_km || 0);
      return {
        matched,
        match_type: matched ? "radius" : "none",
        distance_km: distance,
        reason: matched
          ? LBS_MATCH_RESULT.MATCHED_BY_RADIUS
          : LBS_MATCH_RESULT.NOT_MATCHED,
      };
    }
    const fallback = matchAdminArea(orderAddress, provider);
    if (fallback.matched) return fallback;
    return {
      matched: false,
      match_type: "none",
      distance_km: null,
      reason: LBS_MATCH_RESULT.LOCATION_MISSING,
    };
  }
  return matchAdminArea(orderAddress, provider);
}

function sortProvidersByDistance(point = {}, providers = []) {
  return [...providers]
    .map((provider) => {
      const providerPoint = getProviderPoint(provider);
      const distance =
        hasPoint(point) && hasPoint(providerPoint)
          ? calculateDistanceKm(
              point.latitude,
              point.longitude,
              providerPoint.latitude,
              providerPoint.longitude,
            )
          : null;
      return { ...provider, distance_km: distance };
    })
    .sort((a, b) => {
      if (a.distance_km === null && b.distance_km === null) return 0;
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });
}

module.exports = {
  SERVICE_RANGE_MODE,
  MAP_POINT_SOURCE,
  LBS_MATCH_RESULT,
  DISTANCE_UNIT,
  calculateDistanceMeters,
  calculateDistanceKm,
  isWithinRadius,
  matchAdminArea,
  matchProviderServiceRange,
  sortProvidersByDistance,
  toNumberOrNull,
};
