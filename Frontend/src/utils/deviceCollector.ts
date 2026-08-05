/**
 * Hardware Fingerprint & Device Telemetry Collector — Module 2
 * Captures browser specifications, canvas signatures, WebGL renderers, hardware concurrency, and RAM.
 */

// Helper to hash string
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// Generate Canvas Fingerprint
export function getCanvasFingerprint(): string {
  if (typeof window === "undefined" || typeof document === "undefined") return "canvas_not_supported";
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "canvas_not_supported";
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("SACH_KAVACH_DEVICE_FP", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("SACH_KAVACH_DEVICE_FP", 4, 17);
    return "c_" + hashString(canvas.toDataURL());
  } catch {
    return "canvas_error";
  }
}

// Extract WebGL Renderer & Vendor
export function getWebGLSignatures(): { vendor: string; renderer: string } {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { vendor: "unknown", renderer: "unknown" };
  }
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { vendor: "unknown", renderer: "unknown" };
    const debugInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return { vendor: "generic_webgl", renderer: "generic_renderer" };
    const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "unknown";
    const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "unknown";
    return { vendor, renderer };
  } catch {
    return { vendor: "error", renderer: "error" };
  }
}

// Extract visitor ID
function getVisitorId(): string {
  let vid = localStorage.getItem("sach_kavach_visitor_id");
  if (!vid) {
    vid = "fp_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("sach_kavach_visitor_id", vid);
  }
  return vid;
}

// Compile complete Module 2 Raw Device Payload
export function compileDevicePayload(cif: string, sessionId?: string, accountNumber?: string): any {
  if (typeof window === "undefined") return null;

  const webgl = getWebGLSignatures();
  const canvasHash = getCanvasFingerprint();
  const nav = window.navigator as any;

  // Extract browser and OS names
  const ua = nav.userAgent || "";
  let browser = "Chrome";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";

  let os = "Windows";
  if (ua.includes("Mac OS")) os = "MacOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  return {
    cif,
    accountNumber: accountNumber || `ACC_${cif}`,
    sessionId: sessionId || `sess_${cif}_${Date.now()}`,
    rawSignals: {
      visitorId: getVisitorId(),
      userAgent: ua,
      platform: nav.platform || "Win32",
      browser,
      os,
      language: nav.language || "en-US",
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
      hardwareConcurrency: nav.hardwareConcurrency || 4,
      deviceMemory: nav.deviceMemory || 8,
      touchSupport: (nav.maxTouchPoints || 0) > 0,
      cookiesEnabled: nav.cookieEnabled ?? true,
      devicePixelRatio: window.devicePixelRatio || 1,
      canvasHash,
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer
    }
  };
}

// Flush Device Signals to Backend
export async function flushDeviceSignals(cif: string, sessionId?: string, accountNumber?: string): Promise<any> {
  const payload = compileDevicePayload(cif, sessionId, accountNumber);
  if (!payload) return null;

  try {
    const res = await fetch("/api/device/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn("[DeviceCollector] Device signals ingestion error:", err);
    return null;
  }
}
