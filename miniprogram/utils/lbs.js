const EARTH_RADIUS_KM = 6371

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function hasLocation(point = {}) {
  return toNumberOrNull(point.latitude) !== null && toNumberOrNull(point.longitude) !== null
}

function calculateDistanceKm(from = {}, to = {}) {
  if (!hasLocation(from) || !hasLocation(to)) {
    return null
  }
  const lat1 = toNumberOrNull(from.latitude) * Math.PI / 180
  const lat2 = toNumberOrNull(to.latitude) * Math.PI / 180
  const deltaLat = lat2 - lat1
  const deltaLng = (toNumberOrNull(to.longitude) - toNumberOrNull(from.longitude)) * Math.PI / 180
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(distanceKm) {
  const number = toNumberOrNull(distanceKm)
  if (number === null) {
    return '距离未知'
  }
  if (number < 1) {
    return `${Math.round(number * 1000)}m`
  }
  return `${number.toFixed(1)}km`
}

function sortByDistance(origin = {}, providers = []) {
  return providers.map((provider) => {
    const distance = calculateDistanceKm(origin, {
      latitude: provider.base_latitude || provider.latitude,
      longitude: provider.base_longitude || provider.longitude
    })
    return {
      ...provider,
      distance_km: distance === null ? null : Number(distance.toFixed(2)),
      distance_text: formatDistance(distance)
    }
  }).sort((left, right) => {
    if (left.distance_km === null && right.distance_km === null) return 0
    if (left.distance_km === null) return 1
    if (right.distance_km === null) return -1
    return left.distance_km - right.distance_km
  })
}

module.exports = {
  calculateDistanceKm,
  formatDistance,
  hasLocation,
  sortByDistance,
  toNumberOrNull
}
