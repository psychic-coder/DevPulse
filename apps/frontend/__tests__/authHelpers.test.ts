import { parseJwtPayload, isTokenExpiringSoon } from '../utils/authHelpers'

function makeToken(payload: object) {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.`;
}

test('parseJwtPayload returns payload object', () => {
  const token = makeToken({ sub: '123', githubUsername: 'alice', exp: Math.floor(Date.now() / 1000) + 60 })
  const p = parseJwtPayload(token)
  expect(p).toMatchObject({ sub: '123', githubUsername: 'alice' })
})

test('isTokenExpiringSoon returns false for valid token', () => {
  const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 60 })
  expect(isTokenExpiringSoon(token)).toBe(false)
})

test('isTokenExpiringSoon returns true for expired token', () => {
  const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 60 })
  expect(isTokenExpiringSoon(token)).toBe(true)
})
