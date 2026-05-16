const React = require('react')
module.exports = function Link(props) {
  const { children, href } = props
  return React.createElement('a', { href }, children)
}
