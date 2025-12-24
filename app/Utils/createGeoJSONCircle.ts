export function createGeoJSONCircle(
  center: { latitude: number; longitude: number },
  radiusInMeters: number,
  points = 16, // Reduced points for dotted effect
): {
  type: 'Feature';
  properties: {};
  geometry: { type: 'Polygon'; coordinates: [number, number][][] };
} {
  const coords = {
    latitude: center.latitude,
    longitude: center.longitude,
  };
  const km = radiusInMeters / 1000;
  const ret: [number, number][] = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;
  let theta, x, y;
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [ret],
    },
  };
}
