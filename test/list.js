'use strict'
const t = require('tap')
const list = require('../lib/list.js')
const path = require('path')
const fs = require('fs')
const mutateFS = require('mutate-fs')

t.test('basic', t => {
  const file = path.resolve(__dirname, 'fixtures/tars/long-paths.tar')
  const expect = require('./fixtures/parse/long-paths.json').filter(
    e => Array.isArray(e) && e[0] === 'entry'
  ).map(e => e[1].path)

  const check = (actual, t) => {
    t.same(actual, expect)
    return Promise.resolve(null)
  }

  ;[1000, null].forEach(maxReadSize => {
    t.test('file maxReadSize=' + maxReadSize, t => {
      t.test('sync', t => {
        const actual = []
        const onentry = entry => actual.push(entry.path)
        list({
          file: file,
          sync: true,
          onentry: onentry,
          maxReadSize: maxReadSize
        })
        return check(actual, t)
      })

      t.test('async promise', t => {
        const actual = []
        const onentry = entry => actual.push(entry.path)
        return list({
          file: file,
          onentry: onentry,
          maxReadSize: maxReadSize
        }).then(_ => check(actual, t))
      })

      t.test('async cb', t => {
        const actual = []
        const onentry = entry => actual.push(entry.path)
        list({
          file: file,
          onentry: onentry,
          maxReadSize: maxReadSize
        }, er => {
          if (er)
            throw er
          check(actual, t)
          t.end()
        })
      })
      t.end()
    })
  })

  t.test('stream', t => {
    t.test('sync', t => {
      const actual = []
      const onentry = entry => actual.push(entry.path)
      const l = list({ sync: true, onentry: onentry })
      l.end(fs.readFileSync(file))
      return check(actual, t)
    })

    t.test('async', t => {
      const actual = []
      const onentry = entry => actual.push(entry.path)
      const l = list()
      l.on('entry', onentry)
      l.on('end', _ => check(actual, t).then(_ => t.end()))
      fs.createReadStream(file).pipe(l)
    })
    t.end()
  })

  t.test('no onentry function', t => list({ file: file }))

  t.test('limit to specific files', t => {
    const fileList = [
      'long-path/r/e/a/l/l/y/-/d/e/e/p/-/f/o/l/d/e/r/-/p/a/t',
      '170-byte-filename-cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc///'
    ]

    const expect = [
      '170-byte-filename-cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'long-path/r/e/a/l/l/y/-/d/e/e/p/-/f/o/l/d/e/r/-/p/a/t/',
      'long-path/r/e/a/l/l/y/-/d/e/e/p/-/f/o/l/d/e/r/-/p/a/t/h/',
      'long-path/r/e/a/l/l/y/-/d/e/e/p/-/f/o/l/d/e/r/-/p/a/t/h/a.txt',
      'long-path/r/e/a/l/l/y/-/d/e/e/p/-/f/o/l/d/e/r/-/p/a/t/h/cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'long-path/r/e/a/l/l/y/-/d/e/e/p/-/f/o/l/d/e/r/-/p/a/t/h/cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'long-path/r/e/a/l/l/y/-/d/e/e/p/-/f/o/l/d/e/r/-/p/a/t/h/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      'long-path/r/e/a/l/l/y/-/d/e/e/p/-/f/o/l/d/e/r/-/p/a/t/h/Ω.txt'
    ]

    t.test('no filter function', t => {
      const check = _ => t.same(actual, expect)
      const actual = []
      return list({
        file: file,
        onentry: entry => actual.push(entry.path)
      }, fileList).then(check)
    })

    t.test('no filter function, stream', t => {
      const check = _ => t.same(actual, expect)
      const actual = []
      const onentry = entry => actual.push(entry.path)
      fs.createReadStream(file).pipe(list(fileList)
        .on('entry', onentry)
        .on('end', _ => {
          check()
          t.end()
        }))
    })

    t.test('filter function', t => {
      const check = _ => t.same(actual, expect.slice(0, 1))
      const actual = []
      return list({
        file: file,
        filter: path => path === expect[0],
        onentry: entry => actual.push(entry.path)
      }, fileList).then(check)
    })

    return t.test('list is unmunged', t => {
      t.same(fileList, [
        'long-path/r/e/a/l/l/y/-/d/e/e/p/-/f/o/l/d/e/r/-/p/a/t',
        '170-byte-filename-cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc///'
      ])
      t.end()
    })
  })

  t.end()
})

t.test('bad args', t => {
  t.throws(_ => list({ file: __filename, sync: true }, _ => _),
           new TypeError('callback not supported for sync tar functions'))
  t.throws(_ => list(_=>_),
           new TypeError('callback only supported with file option'))
  t.end()
})

t.test('stat fails', t => {
  const poop = new Error('poop')
  t.teardown(mutateFS.statFail(poop))
  t.test('sync', t => {
    t.plan(1)
    t.throws(_ => list({ file: __filename, sync: true }), poop)
  })
  t.test('cb', t => {
    t.plan(1)
    list({ file: __filename }, er => t.equal(er, poop))
  })
  t.test('promise', t => {
    t.plan(1)
    list({ file: __filename }).catch(er => t.equal(er, poop))
  })
  t.end()
})

t.test('read fail', t => {
  t.test('sync', t => {
    const poop = new Error('poop')
    t.teardown(mutateFS.fail('read', poop))
    t.plan(1)
    t.throws(_ => list({
      file: __filename,
      sync: true,
      maxReadSize: 10
    }), poop)
  })
  t.test('cb', t => {
    const poop = new Error('poop')
    t.teardown(mutateFS.fail('read', poop))
    t.plan(1)
    list({ file: __filename }, er => t.equal(er, poop))
  })
  t.test('promise', t => {
    const poop = new Error('poop')
    t.teardown(mutateFS.fail('read', poop))
    t.plan(1)
    list({ file: __filename }).catch(er => t.equal(er, poop))
  })
  t.end()
})

// GHSA-r292-9mhp-454m / CVE-2026-73566: mapHas recursion depth must be bounded
t.test('GHSA-r292-9mhp-454m: deep path does not overflow stack', t => {
  const makeTar = require('./make-tar.js')
  // A plain ustar header can only carry ~255 bytes of path, so keep the
  // segments short enough that the whole path survives the encoding.
  const deepPath = Array.from({ length: 45 }, (_, i) => 'x' + i).join('/')
  const data = makeTar([
    { path: deepPath, type: 'File', size: 0 },
    '',
    '',
  ])

  const listed = []
  const ignored = []
  // Pass a files filter that does NOT include deepPath — this triggers mapHas
  // to walk all the way up to root one dirname() at a time.
  const p = list(
    { onentry: e => listed.push(e.path) },
    ['some/other/path'],
  )
  p.on('ignoredEntry', e => ignored.push(e.path))
  p.on('end', () => {
    // deepPath was not in files list; it (and its parents) should be filtered out
    t.equal(listed.length, 0, 'no entries listed for unmatched deep path')
    t.same(ignored, [deepPath], 'full deep path reached the filter')
    t.end()
  })
  p.on('error', er => { throw er })
  p.end(data)
})

t.test('CVE-2026-73566: GNU long path with 100000 segments', t => {
  const makeTar = require('./make-tar.js')
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

  const listed = []
  const ignored = []
  const p = list({ onentry: e => listed.push(e.path) }, ['some/dir'])
  p.on('ignoredEntry', e => ignored.push(e.path))
  p.on('end', () => {
    t.equal(ignored.length, 2, 'two entries ignored')
    t.equal(ignored[0].length, deepPath.length, 'long path applied to entry')
    t.ok(ignored[0] === deepPath, 'deep unmatched path filtered out')
    t.equal(ignored[1], 'other/file.txt', 'unselected sibling filtered out')
    t.same(listed, ['some/dir/', 'some/dir/a/b/c.txt'],
      'selected dir and its children still listed after the deep entry')
    t.end()
  })
  try {
    p.end(data)
  } catch (er) {
    t.fail('listing threw: ' + er.name + ': ' + er.message)
    t.end()
  }
})

t.test('CVE-2026-73566: files filter bounds mapHas recursion', t => {
  const deepPath = 'x/'.repeat(99999) + 'x'
  const p = list({}, ['some/other/path'])
  let ret
  t.doesNotThrow(() => {
    ret = p.filter(deepPath, {})
  }, 'deep path does not overflow the stack')
  t.equal(ret, false, 'deep unmatched path is not selected')

  // legit nesting up to the limit below a selected dir is still selected
  const within = list({}, ['some/dir'])
  t.equal(within.filter('some/dir' + '/y'.repeat(99), {}), true,
    '99 levels below a selected dir is selected')
  t.equal(within.filter('some/other', {}), false,
    'unselected shallow path is not selected')
  t.end()
})

t.test('noResume option', t => {
  const file = path.resolve(__dirname, 'fixtures/tars/file.tar')
  t.test('sync', t => {
    let e
    list({
      file: file,
      onentry: entry => {
        e = entry
        process.nextTick(_ => {
          t.notOk(entry.flowing)
          entry.resume()
        })
      },
      sync: true,
      noResume: true
    })
    t.ok(e)
    t.notOk(e.flowing)
    e.on('end', _ => t.end())
  })

  t.test('async', t => {
    let e
    return list({
      file: file,
      onentry: entry => {
        process.nextTick(_ => {
          t.notOk(entry.flowing)
          entry.resume()
        })
      },
      noResume: true
    })
  })

  t.end()
})
