export function parseJwtPayload(token: string | null) {
  if (!token) return null;
  try {
    const b64 = token.split('.')[1] || '';
    let json = '';
    if (typeof window !== 'undefined' && typeof atob === 'function') {
      // Browser environment
      json = decodeURIComponent(
        Array.prototype.map
          .call(atob(b64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
    } else {
      // Node.js / test environment
      json = Buffer.from(b64, 'base64').toString('utf8');
    }
    const payload = JSON.parse(json);
    return payload as any;
  } catch (e) {
    return null;
  }
}

export function isTokenExpiringSoon(token: string | null, bufferSeconds = 30) {
  const p = parseJwtPayload(token);
  if (!p || !p.exp) return true;
  const expMs = p.exp * 1000;
  return Date.now() + bufferSeconds * 1000 >= expMs;
}
