'use strict'
const t = require('tap')
const ReadEntry = require('../lib/read-entry.js')
const Header = require('../lib/header.js')

t.test('create read entry', t => {
  const h = new Header({
    path: 'oof.txt',
    mode: 0o755,
    uid: 24561,
    gid: 20,
    size: 100,
    mtime: new Date('2016-04-01T22:00Z'),
    ctime: new Date('2016-04-01T22:00Z'),
    atime: new Date('2016-04-01T22:00Z'),
    type: 'File',
    uname: 'isaacs',
    gname: 'staff'
  })
  h.encode()

  const entry = new ReadEntry(h, { x: 'y', path: 'foo.txt' }, { z: 0, a: null, b: undefined })

  t.ok(entry.header.cksumValid, 'header checksum should be valid')

  t.match(entry, {
    extended: { x: 'y', path: 'foo.txt' },
    globalExtended: { z: 0, a: null, b: undefined },
    header: {
      cksumValid: true,
      needPax: false,
      path: 'oof.txt',
      mode: 0o755,
      uid: 24561,
      gid: 20,
      size: 100,
      mtime: new Date('2016-04-01T22:00:00.000Z'),
      typeKey: '0',
      type: 'File',
      linkpath: null,
      uname: 'isaacs',
      gname: 'staff',
      devmaj: 0,
      devmin: 0,
      atime: new Date('2016-04-01T22:00:00.000Z'),
      ctime: new Date('2016-04-01T22:00:00.000Z')
    },
    blockRemain: 512,
    remain: 100,
    type: 'File',
    meta: false,
    ignore: false,
    path: 'foo.txt',
    mode: 0o755,
    uid: 24561,
    gid: 20,
    uname: 'isaacs',
    gname: 'staff',
    size: 100,
    mtime: new Date('2016-04-01T22:00:00.000Z'),
    atime: new Date('2016-04-01T22:00:00.000Z'),
    ctime: new Date('2016-04-01T22:00:00.000Z'),
    linkpath: null,
    x: 'y',
    z: 0
  })

  let data = ''
  let ended = false
  entry.on('data', c => data += c)
  entry.on('end', _ => ended = true)

  const body = Buffer.alloc(512)
  body.write(new Array(101).join('z'), 0)
  entry.write(body)
  entry.end()

  t.equal(data, new Array(101).join('z'))
  t.ok(ended, 'saw end event')

  t.end()
})

t.test('meta entry', t => {
  const h = new Header({
    path: 'PaxHeader/foo.txt',
    mode: 0o755,
    uid: 24561,
    gid: 20,
    size: 23,
    mtime: new Date('2016-04-01T22:00Z'),
    ctime: new Date('2016-04-01T22:00Z'),
    atime: new Date('2016-04-01T22:00Z'),
    type: 'NextFileHasLongLinkpath',
    uname: 'isaacs',
    gname: 'staff'
  })
  const body = Buffer.alloc(512)
  body.write('not that long, actually')

  const expect = 'not that long, actually'
  let actual = ''

  const entry = new ReadEntry(h)
  entry.on('data', c => actual += c)

  entry.write(body.slice(0, 1))
  entry.write(body.slice(1, 25))
  entry.write(body.slice(25))
  t.throws(_=> entry.write(Buffer.alloc(1024)))

  t.equal(actual, expect)
  t.like(entry, { meta: true, type: 'NextFileHasLongLinkpath' })
  t.end()
})

t.test('unknown entry type', t => {
  const h = new Header({
    path: 'PaxHeader/foo.txt',
    mode: 0o755,
    uid: 24561,
    gid: 20,
    size: 23,
    mtime: new Date('2016-04-01T22:00Z'),
    ctime: new Date('2016-04-01T22:00Z'),
    atime: new Date('2016-04-01T22:00Z'),
    uname: 'isaacs',
    gname: 'staff'
  })
  h.encode()
  h.block.write('9', 156, 1, 'ascii')

  const body = Buffer.alloc(512)
  body.write('not that long, actually')

  const expect = ''
  let actual = ''

  const entry = new ReadEntry(new Header(h.block))

  entry.on('data', c => actual += c)

  entry.write(body.slice(0, 1))
  entry.write(body.slice(1, 25))
  entry.write(body.slice(25))
  t.throws(_=> entry.write(Buffer.alloc(1024)))

  t.equal(actual, expect)
  t.like(entry, { ignore: true })
  t.end()
})

t.test('entry without mode', t => {
  const h = new Header({
    path: 'foo.txt',
    uid: 24561,
    gid: 20,
    size: 100,
    mtime: new Date('2016-04-01T22:00Z'),
    ctime: new Date('2016-04-01T22:00Z'),
    atime: new Date('2016-04-01T22:00Z'),
    type: 'File',
    uname: 'isaacs',
    gname: 'staff'
  })
  h.encode()

  const entry = new ReadEntry(h)

  t.ok(entry.header.cksumValid, 'header checksum should be valid')

  t.match(entry, {
    header: {
      cksumValid: true,
      needPax: false,
      path: 'foo.txt',
      mode: null,
      uid: 24561,
      gid: 20,
      size: 100,
      mtime: new Date('2016-04-01T22:00:00.000Z'),
      typeKey: '0',
      type: 'File',
      linkpath: null,
      uname: 'isaacs',
      gname: 'staff',
      devmaj: 0,
      devmin: 0,
      atime: new Date('2016-04-01T22:00:00.000Z'),
      ctime: new Date('2016-04-01T22:00:00.000Z')
    },
    blockRemain: 512,
    remain: 100,
    type: 'File',
    meta: false,
    ignore: false,
    path: 'foo.txt',
    mode: null,
    uid: 24561,
    gid: 20,
    uname: 'isaacs',
    gname: 'staff',
    size: 100,
    mtime: new Date('2016-04-01T22:00:00.000Z'),
    atime: new Date('2016-04-01T22:00:00.000Z'),
    ctime: new Date('2016-04-01T22:00:00.000Z'),
    linkpath: null
  })

  let data = ''
  let ended = false
  entry.on('data', c => data += c)
  entry.on('end', _ => ended = true)

  const body = Buffer.alloc(512)
  body.write(new Array(101).join('z'), 0)
  entry.write(body)
  entry.end()

  t.equal(data, new Array(101).join('z'))
  t.ok(ended, 'saw end event')

  t.end()
})

t.test('meta entries ignore extended headers', t => {
  // CVE-2026-53655: a pending extended header describes the next *file*
  // entry.  Its fields (notably size) must never be applied to the
  // intermediary x/g/L/K entries that may sit between it and that file.
  const ex = {
    path: 'smuggled/evil.txt',
    linkpath: 'smuggled/target',
    size: 2 * 1024 * 1024,
    uid: 1234,
    x: 'y'
  }
  const gex = { size: 3 * 1024 * 1024, gid: 4321, z: 'w' }
  const metaTypes = [
    'NextFileHasLongLinkpath',
    'NextFileHasLongPath',
    'OldGnuLongPath',
    'GlobalExtendedHeader',
    'ExtendedHeader',
    'OldExtendedHeader'
  ]

  metaTypes.forEach(type => {
    const h = new Header({
      path: '././@LongLink',
      uid: 24561,
      gid: 20,
      size: 23,
      type: type
    })
    h.encode()
    const entry = new ReadEntry(new Header(h.block, 0, ex, gex), ex, gex)
    t.match(entry, {
      extended: ex,
      globalExtended: gex,
      meta: true,
      type: type,
      path: '././@LongLink',
      size: 23,
      remain: 23,
      blockRemain: 512,
      uid: 24561,
      gid: 20
    }, type + ' keeps its own header fields')
    t.equal(entry.linkpath, '', type + ' does not get ex linkpath')
    t.equal(entry.x, undefined, type + ' does not get ex fields')
    t.equal(entry.z, undefined, type + ' does not get gex fields')
  })

  // normal entries still get the extended header fields
  const h = new Header({ path: 'innocent.txt', size: 23, type: 'File' })
  h.encode()
  const entry = new ReadEntry(new Header(h.block, 0, ex, gex), ex, gex)
  t.match(entry, {
    meta: false,
    type: 'File',
    path: 'smuggled/evil.txt',
    linkpath: 'smuggled/target',
    size: gex.size,
    uid: 1234,
    gid: 4321,
    x: 'y',
    z: 'w'
  }, 'file entry respects extended headers')

  t.end()
})
