export function parseJwtPayload(token: string | null) {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
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
