const t = require('tap')

const realPlatform = process.platform
const fakePlatform = realPlatform === 'win32' ? 'posix' : 'win32'

const modulePath = require.resolve('../lib/normalize-windows-path.js')
const loadNormPath = () => {
  delete require.cache[modulePath]
  return require(modulePath)
}

t.teardown(() => {
  delete process.env.TESTING_TAR_FAKE_PLATFORM
  delete require.cache[modulePath]
})

t.test('posix', t => {
  if (realPlatform === 'win32')
    process.env.TESTING_TAR_FAKE_PLATFORM = fakePlatform
  else
    delete process.env.TESTING_TAR_FAKE_PLATFORM
  const normPath = loadNormPath()
  t.equal(normPath('/some/path/back\\slashes'), '/some/path/back\\slashes')
  t.equal(normPath('c:\\foo\\bar'), 'c:\\foo\\bar')
  t.equal(normPath(null), null, 'null passes through')
  t.equal(normPath(undefined), undefined, 'undefined passes through')
  t.equal(normPath(12345), '12345', 'numbers are coerced to strings')
  t.end()
})

t.test('win32', t => {
  if (realPlatform !== 'win32')
    process.env.TESTING_TAR_FAKE_PLATFORM = fakePlatform
  else
    delete process.env.TESTING_TAR_FAKE_PLATFORM
  const normPath = loadNormPath()
  t.equal(normPath('/some/path/back\\slashes'), '/some/path/back/slashes')
  t.equal(normPath('c:\\foo\\bar'), 'c:/foo/bar')
  t.equal(normPath(null), null, 'null linkpath passes through')
  t.equal(normPath(''), '', 'empty string passes through')
  t.equal(normPath(undefined), undefined, 'undefined passes through')
  t.equal(normPath(12345), '12345', 'numbers are coerced to strings')
  t.end()
})
