// Behavioral Signal Collector — Module 1

let keystrokeIntervals: number[] = [];
let lastKeyTime: number | null = null;

let mouseMoves: { x: number; y: number; t: number }[] = [];
let lastMouseTime: number | null = null;
let mouseVelocities: number[] = [];
let mouseAccelerations: number[] = [];

let clickCount = 0;
let actionCount = 0;
let idleCount = 0;
let copyPasteFired = false;
let startTime = Date.now();
let lastUserActivity = Date.now();

let navigationViews = new Set<string>();

function getVisitorId(): string {
  let vid = localStorage.getItem("sach_kavach_visitor_id");
  if (!vid) {
    vid = "fp_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("sach_kavach_visitor_id", vid);
  }
  return vid;
}

function handleKeyDown(e: KeyboardEvent) {
  const now = performance.now();
  actionCount++;
  lastUserActivity = Date.now();

  if (lastKeyTime !== null) {
    const delta = now - lastKeyTime;
    if (delta > 20 && delta < 1500) {
      keystrokeIntervals.push(delta);
    }
  }
  lastKeyTime = now;
}

function handleMouseMove(e: MouseEvent) {
  const now = performance.now();
  actionCount++;
  lastUserActivity = Date.now();

  const currentPoint = { x: e.clientX, y: e.clientY, t: now };

  if (mouseMoves.length > 0) {
    const lastPoint = mouseMoves[mouseMoves.length - 1];
    const dt = now - lastPoint.t;

    if (dt > 10) {
      const dx = currentPoint.x - lastPoint.x;
      const dy = currentPoint.y - lastPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const vel = dist / (dt / 1000);

      mouseVelocities.push(vel);

      if (mouseVelocities.length > 1) {
        const prevVel = mouseVelocities[mouseVelocities.length - 2];
        const accel = (vel - prevVel) / (dt / 1000);
        mouseAccelerations.push(accel);
      }
    }
  }

  if (mouseMoves.length > 50) {
    mouseMoves.shift();
  }
  mouseMoves.push(currentPoint);
}

function handleMouseClick() {
  clickCount++;
  actionCount++;
  lastUserActivity = Date.now();
}

function handleCopyPaste() {
  copyPasteFired = true;
  actionCount++;
  lastUserActivity = Date.now();
}

let idleIntervalId: any = null;
function checkIdle() {
  const diff = Date.now() - lastUserActivity;
  if (diff > 30000) {
    idleCount++;
  }
}

export function startSignalCollection() {
  if (typeof window === "undefined") return;

  keystrokeIntervals = [];
  lastKeyTime = null;
  mouseMoves = [];
  mouseVelocities = [];
  mouseAccelerations = [];
  clickCount = 0;
  actionCount = 0;
  idleCount = 0;
  copyPasteFired = false;
  startTime = Date.now();
  lastUserActivity = Date.now();
  navigationViews.clear();
  navigationViews.add(window.location.pathname);

  window.addEventListener("keydown", handleKeyDown, { passive: true });
  window.addEventListener("mousemove", handleMouseMove, { passive: true });
  window.addEventListener("click", handleMouseClick, { passive: true });
  window.addEventListener("paste", handleCopyPaste, { passive: true });
  window.addEventListener("copy", handleCopyPaste, { passive: true });

  if (!idleIntervalId) {
    idleIntervalId = setInterval(checkIdle, 10000);
  }
}

export function stopSignalCollection() {
  if (typeof window === "undefined") return;

  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("click", handleMouseClick);
  window.removeEventListener("paste", handleCopyPaste);
  window.removeEventListener("copy", handleCopyPaste);

  if (idleIntervalId) {
    clearInterval(idleIntervalId);
    idleIntervalId = null;
  }
}

export function recordNavigationChange(path: string) {
  navigationViews.add(path);
}

export function compileBehaviorPayload(cif: string, sessionId: string): any {
  if (typeof window === "undefined") return null;

  let speedAvg = 300.0;
  let variance = 40.0;

  if (keystrokeIntervals.length > 2) {
    speedAvg = keystrokeIntervals.reduce((a, b) => a + b, 0) / keystrokeIntervals.length;
    const sqDiffs = keystrokeIntervals.map(x => Math.pow(x - speedAvg, 2));
    variance = sqDiffs.reduce((a, b) => a + b, 0) / keystrokeIntervals.length;
  }

  const sessionMinutes = Math.max(0.1, (Date.now() - startTime) / 60000);
  const actionsPerMinute = actionCount / sessionMinutes;

  const deviceInfo = {
    visitorId: getVisitorId(),
    userAgent: navigator.userAgent,
    platform: navigator.platform || "unknown",
    language: navigator.language || "en-US",
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  };

  const payload = {
    cif,
    sessionId,
    deviceInfo,
    behaviorSignals: {
      typingVariance: parseFloat(variance.toFixed(2)),
      typingSpeedAvg: parseFloat(speedAvg.toFixed(2)),
      navigationDepth: navigationViews.size,
      actionsPerMinute: parseFloat(actionsPerMinute.toFixed(2)),
      idlePeriods: idleCount,
      copyPasteDetected: copyPasteFired
    }
  };

  return payload;
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "uuid-" + Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15);
}

export async function flushBehaviorSignals(cif: string, sessionId: string): Promise<any> {
  const payload = compileBehaviorPayload(cif, sessionId);
  if (!payload) return null;

  const correlationId = generateUUID();

  try {
    const res = await fetch("/api/behavior/collect", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Correlation-ID": correlationId
      },
      body: JSON.stringify(payload)
    });
    
    clickCount = 0;
    actionCount = 0;
    idleCount = 0;
    copyPasteFired = false;
    startTime = Date.now();

    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn("[Collector] Local Signals flush failed:", err);
    return null;
  }
}
