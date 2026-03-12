export const backendBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(
  /\/api$/,
  ""
);

export const assetUrl = (relativeUrl = "") =>
  relativeUrl.startsWith("http") ? relativeUrl : `${backendBaseUrl}${relativeUrl}`;
