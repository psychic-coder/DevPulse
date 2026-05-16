module.exports = {
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(null),
    }
  }
}
