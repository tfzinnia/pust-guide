export function clearOfflineData({ includeProfile = true } = {}) {
  for (const key of Object.keys(localStorage))
    if (
      key.startsWith("pust_offline_") ||
      (includeProfile && key === "pust_profile")
    )
      localStorage.removeItem(key);
  globalThis.caches?.delete("pust-documents-v1");
  navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_DOCUMENTS" });
}
export function cacheKey(url) {
  let userId = "guest";
  try {
    userId = JSON.parse(localStorage.getItem("pust_profile"))?.id || "guest";
  } catch {
    /* Ignore an invalid old profile. */
  }
  return `pust_offline_${userId}_${url}`;
}
export function canCache(url = "") {
  return /^\/(directory(?:\/(?:people|offices)(?:\/\d+)?)?|departments(?:\/\d+)?|syllabus(?:\/my)?|routines\/my|emergency|map|portal\/dashboard)(?:\?|$)/.test(
    url,
  );
}
