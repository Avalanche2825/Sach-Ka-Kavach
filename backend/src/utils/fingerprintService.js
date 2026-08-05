/**
 * Hardware Fingerprinting & Profile Comparator — SACH Kavach Module 2
 * Generates deterministic SHA-256 device hashes and evaluates device profile matches.
 */

import crypto from 'crypto';

/**
 * Computes deterministic SHA-256 hash from raw browser hardware signals.
 */
export function generateDeviceHash(rawSignals = {}) {
  const {
    visitorId = '',
    userAgent = '',
    platform = '',
    language = '',
    screenResolution = '',
    timezone = '',
    canvasHash = '',
    webglRenderer = ''
  } = rawSignals;

  const rawString = `${visitorId}|${userAgent}|${platform}|${language}|${screenResolution}|${timezone}|${canvasHash}|${webglRenderer}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * Detects whether the device signature originates from an emulator or headless browser environment.
 */
export function detectEmulatorOrVM(rawSignals = {}, userAgent = '') {
  const ua = (userAgent || '').toLowerCase();
  const plat = (rawSignals.platform || '').toLowerCase();
  const renderer = (rawSignals.webglRenderer || '').toLowerCase();

  const isBluestacks = ua.includes('bluestacks') || renderer.includes('bluestacks');
  const isGenymotion = ua.includes('genymotion') || renderer.includes('genymotion');
  const isVirtualBox = renderer.includes('virtualbox') || renderer.includes('vmware') || renderer.includes('llvmpipe');
  const isAndroidEmulator = ua.includes('sdk_gphone') || ua.includes('emulator') || renderer.includes('swiftshader');
  const isHeadless = ua.includes('headless') || plat === 'unknown' || rawSignals.canvasHash === 'canvas_not_supported';

  return {
    isEmulator: isBluestacks || isGenymotion || isVirtualBox || isAndroidEmulator || isHeadless,
    isHeadless,
    emulatorType: isBluestacks ? 'BlueStacks' : isGenymotion ? 'Genymotion' : isVirtualBox ? 'VirtualBox/VMWare' : isHeadless ? 'Headless Browser' : isAndroidEmulator ? 'Android Emulator' : null
  };
}

/**
 * Compares current device telemetry against customer's known Device Profile.
 */
export function evaluateDeviceProfileMatch(profile, currentSignals) {
  if (!profile) {
    return {
      isNewDevice: true,
      isNewBrowser: true,
      isNewOS: true,
      isNewNetwork: true,
      isNewISP: true,
      isNewASN: true,
      isNewCity: true
    };
  }

  const { deviceHash, browser, os, ipAddress, isp, asn, city } = currentSignals;

  const isNewDevice = !profile.trustedDeviceHashes?.includes(deviceHash);
  const isNewBrowser = browser ? !profile.knownBrowsers?.includes(browser) : false;
  const isNewOS = os ? !profile.knownOS?.includes(os) : false;
  const isNewNetwork = ipAddress ? !profile.knownIPRanges?.some(range => ipAddress.startsWith(range.split('/')[0])) : false;
  const isNewISP = isp ? !profile.knownISPs?.includes(isp) : false;
  const isNewASN = asn ? !profile.knownASNs?.includes(asn) : false;
  const isNewCity = city ? !profile.knownCities?.includes(city) : false;

  return {
    isNewDevice,
    isNewBrowser,
    isNewOS,
    isNewNetwork,
    isNewISP,
    isNewASN,
    isNewCity
  };
}

/**
 * Checks if customer has experienced a SIM swap within the last 72 hours.
 */
export function checkSimSwapWithin72Hours(profile) {
  if (!profile || !profile.simSwapHistory || profile.simSwapHistory.length === 0) {
    return { isSimSwapRecent: false, hoursAgo: null };
  }

  const latestSwap = profile.simSwapHistory[profile.simSwapHistory.length - 1];
  if (!latestSwap.simSwappedAt || latestSwap.verifiedAtBranch) {
    return { isSimSwapRecent: false, hoursAgo: null };
  }

  const hoursAgo = (Date.now() - new Date(latestSwap.simSwappedAt).getTime()) / (1000 * 60 * 60);
  return {
    isSimSwapRecent: hoursAgo <= 72,
    hoursAgo: Math.round(hoursAgo)
  };
}
