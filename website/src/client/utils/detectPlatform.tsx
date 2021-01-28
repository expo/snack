export function isAndroid(userAgent: string) {
  return /Android/i.test(userAgent);
}

export function isIOS(userAgent: string) {
  return /iPhone|iPad|iPod/i.test(userAgent);
}

export function isMobile(
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''
) {
  return isAndroid(userAgent) || isIOS(userAgent);
}
