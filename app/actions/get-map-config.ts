"use server"

export async function getMapConfig() {
  const apiKey = process.env.GEOAPIFY_API_KEY

  if (!apiKey) {
    throw new Error("Geoapify API key not configured")
  }

  return {
    apiKey,
    tileUrl: `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`,
  }
}
