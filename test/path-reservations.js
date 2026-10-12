const t = require('tap')
const path = require('path')

// load up the posix and windows versions of the reserver
if (process.platform === 'win32')
  process.env.TESTING_TAR_FAKE_PLATFORM = 'posix'
const { reserve } = require('../lib/path-reservations.js')()
delete process.env.TESTING_TAR_FAKE_PLATFORM
const winReserve = (() => {
  // load fresh copies of the lib modules with the platform faked as win32,
  // then put the original modules back so other tests are not affected.
  const libdir = path.resolve(__dirname, '../lib') + path.sep
  const libKeys = () => Object.keys(require.cache)
    .filter(k => k.indexOf(libdir) === 0)
  const saved = {}
  libKeys().forEach(k => {
    saved[k] = require.cache[k]
    delete require.cache[k]
  })
  if (process.platform !== 'win32')
    process.env.TESTING_TAR_FAKE_PLATFORM = 'win32'
  const { reserve } = require('../lib/path-reservations.js')()
  delete process.env.TESTING_TAR_FAKE_PLATFORM
  libKeys().forEach(k => delete require.cache[k])
  Object.assign(require.cache, saved)
  return reserve
})()

t.test('basic race', t => {
  // simulate the race conditions we care about
  let didFile = false
  const file = done => {
    t.equal(didFile, false, 'only call file once')
    didFile = true
    t.equal(didLink, false, 'do file before link')
    setTimeout(done)
  }

  let didLink = false
  const link = done => {
    t.equal(didLink, false, 'only call once')
    t.equal(didFile, true, 'do file before link')
    didLink = true
    // make sure this one is super duper cleared lol
    // the subsequent calls are no-ops, but verify as much
    done()
    done()
    done()
  }

  let didDir = false
  const dir = done => {
    t.equal(didDir, false, 'only do dir once')
    t.equal(didLink, true, 'do link before dir')
    didDir = true
    done()
  }

  let didDir2 = false
  const dir2 = done => {
    t.equal(didDir, true, 'did dir before dir2')
    t.equal(didDir2, false, 'only do dir2 once')
    didDir2 = true
    done()
  }

  let didDir3 = false
  const dir3 = done => {
    t.equal(didDir2, true, 'did dir2 before dir3')
    t.equal(didDir3, false, 'only do dir3 once')
    didDir3 = true
    done()
    t.end()
  }

  t.ok(reserve(['a/b/c/d'], file), 'file starts right away')
  t.notOk(reserve(['a/B/c////D', 'a/b/e'], link), 'link waits')
  t.notOk(reserve(['a/b/e/f'], dir), 'dir waits')
  t.notOk(reserve(['a/b'], dir2), 'dir2 waits')
  t.notOk(reserve(['a/b/x'], dir3), 'dir3 waits')
})

t.test('unicode shenanigans', t => {
  const e1 = Buffer.from([0xc3, 0xa9])
  const e2 = Buffer.from([0x65, 0xcc, 0x81])
  let didCafe1 = false
  const cafe1 = done => {
    t.equal(didCafe1, false, 'did cafe1 only once')
    t.equal(didCafe2, false, 'did cafe1 before cafe2')
    didCafe1 = true
    setTimeout(done)
  }
  let didCafe2 = false
  const cafe2 = done => {
    t.equal(didCafe1, true, 'did cafe1 before cafe2')
    t.equal(didCafe2, false, 'did cafe2 only once')
    didCafe2 = true
    done()
    t.end()
  }
  const cafePath1 = `c/a/f/${e1}`
  const cafePath2 = `c/a/f/${e2}`
  t.ok(reserve([cafePath1], cafe1))
  t.notOk(reserve([cafePath2], cafe2))
})

t.test('unicode shenanigans in parent dirs', t => {
  // a file under one spelling of a dir must wait for a symlink being
  // created at the other spelling of that same dir.
  const cafeNFC = Buffer.from([0x63, 0x61, 0x66, 0xc3, 0xa9]).toString()
  const cafeNFD = Buffer.from([0x63, 0x61, 0x66, 0x65, 0xcc, 0x81]).toString()
  let didLink = false
  const link = done => {
    t.equal(didLink, false, 'did link only once')
    t.equal(didFile, false, 'did link before file')
    didLink = true
    setTimeout(done)
  }
  let didFile = false
  const file = done => {
    t.equal(didLink, true, 'did link before file')
    t.equal(didFile, false, 'did file only once')
    didFile = true
    done()
    setTimeout(() => t.end())
  }
  t.ok(reserve([cafeNFC], link))
  t.notOk(reserve([`${cafeNFD}/pwned`], file))
})

t.test('absolute paths and trailing slash', t => {
  let calledA1 = false
  let calledA2 = false
  const a1 = done => {
    t.equal(calledA1, false, 'called a1 only once')
    t.equal(calledA2, false, 'called a1 before 2')
    calledA1 = true
    setTimeout(done)
  }
  const a2 = done => {
    t.equal(calledA1, true, 'called a1 before 2')
    t.equal(calledA2, false, 'called a2 only once')
    calledA2 = true
    done()
    if (calledR2)
      t.end()
  }
  let calledR1 = false
  let calledR2 = false
  const r1 = done => {
    t.equal(calledR1, false, 'called r1 only once')
    t.equal(calledR2, false, 'called r1 before 2')
    calledR1 = true
    setTimeout(done)
  }
  const r2 = done => {
    t.equal(calledR1, true, 'called r1 before 2')
    t.equal(calledR2, false, 'called r1 only once')
    calledR2 = true
    done()
    if (calledA2)
      t.end()
  }
  t.ok(reserve(['/p/a/t/h'], a1))
  t.notOk(reserve(['/p/a/t/h/'], a2))
  t.ok(reserve(['p/a/t/h'], r1))
  t.notOk(reserve(['p/a/t/h/'], r2))
})

t.test('on windows, everything collides with everything', t => {
  const reserve = winReserve
  let called1 = false
  let called2 = false
  const f1 = done => {
    t.equal(called1, false, 'only call 1 once')
    t.equal(called2, false, 'call 1 before 2')
    called1 = true
    setTimeout(done)
  }
  const f2 = done => {
    t.equal(called1, true, 'call 1 before 2')
    t.equal(called2, false, 'only call 2 once')
    called2 = true
    done()
    t.end()
  }
  t.equal(reserve(['some/path'], f1), true)
  t.equal(reserve(['other/path'], f2), false)
})

t.test('treat backslash as a separator on windows', t => {
  // load fresh copies of the modules with the platform faked as win32
  const normPathModule = require.resolve('../lib/normalize-windows-path.js')
  const resModule = require.resolve('../lib/path-reservations.js')
  const saved = {
    [normPathModule]: require.cache[normPathModule],
    [resModule]: require.cache[resModule],
  }
  delete require.cache[normPathModule]
  delete require.cache[resModule]
  const fakePlatform = process.env.TESTING_TAR_FAKE_PLATFORM
  process.env.TESTING_TAR_FAKE_PLATFORM = 'win32'
  const { reserve } = require('../lib/path-reservations.js')()
  if (fakePlatform === undefined)
    delete process.env.TESTING_TAR_FAKE_PLATFORM
  else
    process.env.TESTING_TAR_FAKE_PLATFORM = fakePlatform
  Object.assign(require.cache, saved)

  let didFirst = false
  const first = done => {
    didFirst = true
    setTimeout(done)
  }
  const second = done => {
    t.equal(didFirst, true, 'second waits for first')
    done()
    t.end()
  }
  t.ok(reserve(['a/b/c'], first), 'first starts right away')
  t.notOk(reserve(['A\\B\\c\\d'], second), 'second waits')
})
