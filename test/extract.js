'use strict'

const t = require('tap')
const x = require('../lib/extract.js')
const Pax = require('../lib/pax.js')
const makeTar = require('./make-tar.js')
const path = require('path')
const fs = require('fs')
const extractdir = path.resolve(__dirname, 'fixtures/extract')
const tars = path.resolve(__dirname, 'fixtures/tars')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const mutateFS = require('mutate-fs')

t.teardown(_ => rimraf.sync(extractdir))

t.test('basic extracting', t => {
  const file = path.resolve(tars, 'utf8.tar')
  const dir = path.resolve(extractdir, 'basic')

  t.beforeEach(cb => {
    rimraf.sync(dir)
    mkdirp.sync(dir)
    cb()
  })

  const check = t => {
    fs.lstatSync(dir + '/Ω.txt')
    fs.lstatSync(dir + '/🌟.txt')
    t.throws(_ => fs.lstatSync(dir + '/long-path/r/e/a/l/l/y/-/d/e/e/p/-' +
                               '/f/o/l/d/e/r/-/p/a/t/h/Ω.txt'))

    rimraf.sync(dir)
    t.end()
  }

  const files = [ '🌟.txt', 'Ω.txt' ]
  t.test('sync', t => {
    x({ file: file, sync: true, C: dir }, files)
    check(t)
  })

  t.test('async promisey', t => {
    return x({ file: file, cwd: dir }, files).then(_ => {
      check(t)
    })
  })

  t.test('async cb', t => {
    return x({ file: file, cwd: dir }, files, er => {
      if (er)
        throw er
      check(t)
    })
  })

  t.end()
})

t.test('file list and filter', t => {
  const file = path.resolve(tars, 'utf8.tar')
  const dir = path.resolve(extractdir, 'filter')

  t.beforeEach(cb => {
    rimraf.sync(dir)
    mkdirp.sync(dir)
    cb()
  })

  const check = t => {
    fs.lstatSync(dir + '/Ω.txt')
    t.throws(_ => fs.lstatSync(dir + '/🌟.txt'))
    t.throws(_ => fs.lstatSync(dir + '/long-path/r/e/a/l/l/y/-/d/e/e/p/-' +
                               '/f/o/l/d/e/r/-/p/a/t/h/Ω.txt'))

    rimraf.sync(dir)
    t.end()
  }

  const filter = path => path === 'Ω.txt'

  t.test('sync', t => {
    x({ filter: filter, file: file, sync: true, C: dir }, [ '🌟.txt', 'Ω.txt' ])
    check(t)
  })

  t.test('async promisey', t => {
    return x({ filter: filter, file: file, cwd: dir }, [ '🌟.txt', 'Ω.txt' ]).then(_ => {
      check(t)
    })
  })

  t.test('async cb', t => {
    return x({ filter: filter, file: file, cwd: dir }, [ '🌟.txt', 'Ω.txt' ], er => {
      if (er)
        throw er
      check(t)
    })
  })

  t.end()
})

t.test('no file list', t => {
  const file = path.resolve(tars, 'body-byte-counts.tar')
  const dir = path.resolve(extractdir, 'no-list')

  t.beforeEach(cb => {
    rimraf.sync(dir)
    mkdirp.sync(dir)
    cb()
  })

  const check = t => {
    t.equal(fs.lstatSync(path.resolve(dir, '1024-bytes.txt')).size, 1024)
    t.equal(fs.lstatSync(path.resolve(dir, '512-bytes.txt')).size, 512)
    t.equal(fs.lstatSync(path.resolve(dir, 'one-byte.txt')).size, 1)
    t.equal(fs.lstatSync(path.resolve(dir, 'zero-byte.txt')).size, 0)
    rimraf.sync(dir)
    t.end()
  }

  t.test('sync', t => {
    x({ file: file, sync: true, C: dir })
    check(t)
  })

  t.test('async promisey', t => {
    return x({ file: file, cwd: dir }).then(_ => {
      check(t)
    })
  })

  t.test('async cb', t => {
    return x({ file: file, cwd: dir }, er => {
      if (er)
        throw er
      check(t)
    })
  })

  t.end()
})

t.test('read in itty bits', t => {
  const maxReadSize = 1000
  const file = path.resolve(tars, 'body-byte-counts.tar')
  const dir = path.resolve(extractdir, 'no-list')

  t.beforeEach(cb => {
    rimraf.sync(dir)
    mkdirp.sync(dir)
    cb()
  })

  const check = t => {
    t.equal(fs.lstatSync(path.resolve(dir, '1024-bytes.txt')).size, 1024)
    t.equal(fs.lstatSync(path.resolve(dir, '512-bytes.txt')).size, 512)
    t.equal(fs.lstatSync(path.resolve(dir, 'one-byte.txt')).size, 1)
    t.equal(fs.lstatSync(path.resolve(dir, 'zero-byte.txt')).size, 0)
    rimraf.sync(dir)
    t.end()
  }

  t.test('sync', t => {
    x({ file: file, sync: true, C: dir, maxReadSize: maxReadSize })
    check(t)
  })

  t.test('async promisey', t => {
    return x({ file: file, cwd: dir, maxReadSize: maxReadSize }).then(_ => {
      check(t)
    })
  })

  t.test('async cb', t => {
    return x({ file: file, cwd: dir, maxReadSize: maxReadSize }, er => {
      if (er)
        throw er
      check(t)
    })
  })

  t.end()
})

t.test('bad calls', t => {
  t.throws(_=> x(_=>_))
  t.throws(_=> x({sync: true}, _=>_))
  t.throws(_=> x({sync: true}, [], _=>_))
  t.end()
})

t.test('no file', t => {
  const Unpack = require('../lib/unpack.js')
  t.isa(x(), Unpack)
  t.isa(x(['asdf']), Unpack)
  t.isa(x({sync:true}), Unpack.Sync)
  t.end()
})

t.test('nonexistent', t => {
  t.throws(_ => x({sync: true, file: 'does not exist' }))
  x({ file: 'does not exist' }).catch(_ => t.end())
})

t.test('read fail', t => {
  const poop = new Error('poop')
  t.teardown(mutateFS.fail('read', poop))

  t.throws(_ => x({maxReadSize: 10, sync: true, file: __filename }), poop)
  t.end()
})

t.test('sync gzip error edge case test', t => {
  const zlib = require('minizlib')
  const file = path.resolve(__dirname, 'fixtures/sync-gzip-fail.tgz')
  const dir = path.resolve(__dirname, 'sync-gzip-fail')
  const cwd = process.cwd()
  mkdirp.sync(dir + '/x')
  process.chdir(dir)
  t.teardown(() => {
    process.chdir(cwd)
    rimraf.sync(dir)
  })

  x({
    sync: true,
    file: file,
    onwarn: (c, m, er) => { throw er }
  })

  t.same(fs.readdirSync(dir + '/x').sort(),
    [ '1', '10', '2', '3', '4', '5', '6', '7', '8', '9' ])

  t.end()
})

// A PAX header entry with a numeric-looking path (e.g. "12345") must be
// extracted as a file named "12345", not crash or skip, in strict and non-strict.
const makePaxExtractData = (paxName, entryName) => {
  const paxHeader = new Pax({ path: paxName, size: '12345\n'.length }, false)
  const paxData = paxHeader.encode()
  return makeTar([
    paxData,
    {
      type: 'File',
      path: entryName,
      mode: 0o755,
      ctime: new Date('2000-01-01T00:00:00.000Z'),
      mtime: new Date('2000-01-01T00:00:00.000Z'),
      size: '12345\n'.length,
    },
    '12345\n',
    '',
    '',
  ])
}

const numericPaxDir = leg => {
  const dir = path.resolve(extractdir, 'numeric-pax-name', leg)
  rimraf.sync(dir)
  mkdirp.sync(dir)
  return dir
}

for (const strict of [true, false]) {
  for (const paxName of ['12345', 'abcde']) {
    for (const entryName of ['12345', 'abcde']) {
      const label = `numeric pax/entry name discernment strict=${strict} paxName=${paxName} entryName=${entryName}`
      const data = makePaxExtractData(paxName, entryName)
      const leg = `${strict}-${paxName}-${entryName}`

      t.test(label + ' sync', t => {
        const dir = numericPaxDir(leg + '-sync')
        fs.writeFileSync(dir + '/tarFile', data)
        x({ strict, sync: true, cwd: dir, file: dir + '/tarFile' })
        t.equal(fs.readFileSync(dir + '/' + paxName, 'utf8'), '12345\n')
        t.end()
      })

      t.test(label + ' async', t => {
        const dir = numericPaxDir(leg + '-async')
        fs.writeFileSync(dir + '/tarFile', data)
        return x({ strict, cwd: dir, file: dir + '/tarFile' }).then(() => {
          t.equal(fs.readFileSync(dir + '/' + paxName, 'utf8'), '12345\n')
        })
      })
    }
  }
}

t.test('max decompression ratio', t => {
  const zlib = require('zlib')
  const size = 8 * 1024 * 1024
  const dir = path.resolve(extractdir, 'decompression-bomb')
  const file = path.resolve(dir, 'bomb.tgz')
  rimraf.sync(dir)
  mkdirp.sync(dir)
  t.teardown(_ => rimraf.sync(dir))

  // NB: make-tar.js truncates every chunk to a single 512 byte block, so the
  // bomb payload has to be concatenated onto the header blocks by hand.
  fs.writeFileSync(file, zlib.gzipSync(Buffer.concat([
    makeTar([
      {
        path: 'bomb',
        size: size,
        type: 'File'
      }
    ]),
    Buffer.alloc(size),
    makeTar(['', ''])
  ])))

  // each case gets its own cwd, since an aborted async extraction may still
  // be flushing out what it had already read when the next case starts
  const setup = name => {
    const cwd = path.resolve(dir, name)
    mkdirp.sync(cwd)
    return cwd
  }

  const expectAbort = {
    tarCode: 'TAR_ABORT',
    recoverable: false,
    message: /^max decompression ratio exceeded: /
  }

  t.test('file extraction aborts by default', t => {
    t.throws(() => x({ sync: true, file, cwd: setup('sync') }), expectAbort,
      'sync throws')
    return x({ file, cwd: setup('async') }).then(() => {
      t.fail('extraction should not have completed')
    }, er => t.match(er, expectAbort, 'async rejects'))
  })

  t.test('file extraction stops writing at a low limit', t => {
    const cwd = setup('low')
    t.throws(() => x({ sync: true, file, cwd, maxDecompressionRatio: 4 }),
      expectAbort, 'sync throws')
    const bomb = path.resolve(cwd, 'bomb')
    const written = fs.existsSync(bomb) ? fs.statSync(bomb).size : 0
    t.ok(written < size / 100,
      `stopped writing the payload early (${written} < ${size / 100})`)
    t.end()
  })

  t.test('file extraction can disable the limit explicitly', t => {
    const cwd = setup('disabled')
    return x({
      file,
      cwd,
      maxDecompressionRatio: Infinity
    }).then(() => {
      t.equal(fs.statSync(path.resolve(cwd, 'bomb')).size, size)
    })
  })

  t.end()
})

// GHSA-r292-9mhp-454m / CVE-2026-73566: mapHas recursion depth must be bounded
t.test('GHSA-r292-9mhp-454m: deep path does not overflow stack', t => {
  const dir = path.resolve(extractdir, 'ghsa-r292')
  rimraf.sync(dir)
  mkdirp.sync(dir)
  t.teardown(() => rimraf.sync(dir))

  // A plain ustar header can only carry ~255 bytes of path, so keep the
  // segments short enough that the whole path survives the encoding.
  const deepPath = Array.from({ length: 45 }, (_, i) => 'x' + i).join('/')
  const data = makeTar([
    { path: deepPath, type: 'File', size: 0 },
    '',
    '',
  ])

  const ignored = []
  // Pass a files filter that does NOT include deepPath — this triggers mapHas
  // to walk all the way up to root one dirname() at a time.
  const u = x(
    { cwd: dir },
    ['some/other/path'],
  )
  u.on('ignoredEntry', e => ignored.push(e.path))
  u.on('error', er => { throw er })
  u.on('close', () => {
    // deepPath was not in the files list, nothing extracted
    t.same(fs.readdirSync(dir), [], 'no files extracted for unmatched deep path')
    t.same(ignored, [deepPath], 'full deep path reached the filter')
    t.end()
  })
  u.end(data)
})

t.test('CVE-2026-73566: GNU long path with 100000 segments', t => {
  const dir = path.resolve(extractdir, 'cve-2026-73566')
  rimraf.sync(dir)
  mkdirp.sync(dir)
  t.teardown(() => rimraf.sync(dir))

  // far deeper than the call stack can recurse, well under maxMetaEntrySize
  const deepPath = 'x/'.repeat(99999) + 'x'
  const size = Buffer.byteLength(deepPath)
  const body = Buffer.alloc(Math.ceil(size / 512) * 512)
  body.write(deepPath)
  // make-tar.js clips each chunk to 512 bytes, so the long body of the
  // NextFileHasLongPath ('L') meta entry is concatenated around it.
  const data = Buffer.concat([
    makeTar([{ path: '././@LongLink', type: 'NextFileHasLongPath', size }]),
    body,
    makeTar([
      { path: 'placeholder', type: 'File', size: 0 },
      { path: 'some/dir/', type: 'Directory', mode: 0o755 },
      { path: 'some/dir/a/b/c.txt', type: 'File', size: 0, mode: 0o644 },
      { path: 'other/file.txt', type: 'File', size: 0, mode: 0o644 },
      '',
      '',
    ]),
  ])

  const ignored = []
  const u = x({ cwd: dir }, ['some/dir'])
  u.on('ignoredEntry', e => ignored.push(e.path))
  u.on('close', () => {
    t.equal(ignored.length, 2, 'two entries ignored')
    t.equal(ignored[0].length, deepPath.length, 'long path applied to entry')
    t.ok(ignored[0] === deepPath, 'deep unmatched path filtered out')
    t.equal(ignored[1], 'other/file.txt', 'unselected sibling filtered out')
    t.same(fs.readdirSync(dir), ['some'], 'only the selected tree extracted')
    t.ok(fs.statSync(path.resolve(dir, 'some/dir/a/b/c.txt')).isFile(),
      'selected dir and its children still extracted after the deep entry')
    t.end()
  })
  try {
    u.end(data)
  } catch (er) {
    t.fail('extraction threw: ' + er.name + ': ' + er.message)
    t.end()
  }
})

t.test('CVE-2026-73566: files filter bounds mapHas recursion', t => {
  const dir = path.resolve(extractdir, 'cve-2026-73566-filter')
  const deepPath = 'x/'.repeat(99999) + 'x'
  const u = x({ cwd: dir }, ['some/other/path'])
  let ret
  t.doesNotThrow(() => {
    ret = u.filter(deepPath, {})
  }, 'deep path does not overflow the stack')
  t.equal(ret, false, 'deep unmatched path is not selected')

  // legit nesting up to the limit below a selected dir is still selected
  const within = x({ cwd: dir }, ['some/dir'])
  t.equal(within.filter('some/dir' + '/y'.repeat(99), {}), true,
    '99 levels below a selected dir is selected')
  t.equal(within.filter('some/other', {}), false,
    'unselected shallow path is not selected')
  t.end()
})
