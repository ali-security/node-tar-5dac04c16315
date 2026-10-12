// unix absolute paths are also absolute on win32, so we use this for both
const { isAbsolute, parse } = require('path').win32

// returns [root, stripped]
module.exports = path => {
  let r = ''
  let parsed = parse(path)
  while (isAbsolute(path) || parsed.root) {
    // windows will think that //x/y/z has a "root" of //x/y/
    const root = path.charAt(0) === '/' && path.slice(0, 4) !== '//?/' ? '/' : parsed.root
    path = path.substr(root.length)
    r += root
    parsed = parse(path)
  }
  return [r, path]
}
