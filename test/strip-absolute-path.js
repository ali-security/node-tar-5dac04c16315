const t = require('tap')
const stripAbsolutePath = require('../lib/strip-absolute-path.js')

const cwd = process.cwd()

t.test('basic', t => {
  const cases = {
    '/': ['/', ''],
    '////': ['////', ''],
    'c:///a/b/c': ['c:///', 'a/b/c'],
    '\\\\foo\\bar\\baz': ['\\\\foo\\bar\\', 'baz'],
    '//foo//bar//baz': ['//', 'foo//bar//baz'],
    'c:\\c:\\c:\\c:\\\\d:\\e/f/g': ['c:\\c:\\c:\\c:\\\\d:\\', 'e/f/g'],
  }

  for (const [input, [root, stripped]] of Object.entries(cases))
    t.strictSame(stripAbsolutePath(input, cwd), [root, stripped], input)
  t.end()
})

t.test('drive-local paths', t => {
  const env = process.env
  t.teardown(() => process.env = env)
  const cwd = 'D:\\safety\\land'
  // be windowsy: load a fresh copy of the module.  It always parses with
  // path.win32, so it behaves the same here as it does on windows.
  const modulePath = require.resolve('../lib/strip-absolute-path.js')
  const saved = require.cache[modulePath]
  delete require.cache[modulePath]
  const stripAbsolutePath = require(modulePath)
  require.cache[modulePath] = saved
  const cases = {
    '/': ['/', ''],
    '////': ['////', ''],
    'c:///a/b/c': ['c:///', 'a/b/c'],
    '\\\\foo\\bar\\baz': ['\\\\foo\\bar\\', 'baz'],
    '//foo//bar//baz': ['//', 'foo//bar//baz'],
    'c:\\c:\\c:\\c:\\\\d:\\e/f/g': ['c:\\c:\\c:\\c:\\\\d:\\', 'e/f/g'],
    'c:..\\system\\explorer.exe': ['c:', '..\\system\\explorer.exe'],
    'd:..\\..\\unsafe\\land': ['d:', '..\\..\\unsafe\\land'],
    'c:foo': ['c:', 'foo'],
    'D:mark': ['D:', 'mark'],
    '//?/X:/y/z': ['//?/X:/', 'y/z'],
    '\\\\?\\X:\\y\\z': ['\\\\?\\X:\\', 'y\\z'],
  }
  for (const [input, [root, stripped]] of Object.entries(cases)) {
    if (!t.strictSame(stripAbsolutePath(input, cwd), [root, stripped], input))
      break
  }
  t.end()
})
