'use strict'
const t = require('tap')
const Header = require('../lib/header.js')
const types = require('../lib/types.js')

t.test('ustar format', t => {
  const buf = Buffer.from(
    '666f6f2e74787400000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000030303037353520003035373736312000303030303234200037373737' +
    '3737373737373700313236373735363735343000303133303531200030000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0075737461720030306973616163730000000000000000000000000000000000' +
    '0000000000000000007374616666000000000000000000000000000000000000' +
    '0000000000000000003030303030302000303030303030200000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000',
    'hex')

  const h = new Header({
    path: 'foo.txt'
  })
  const slab = Buffer.alloc(1024)
  h.set({
    mode: 0o755,
    uid: 24561,
    gid: 20,
    size: 0o77777777777,
    mtime: new Date('2016-04-01T22:00Z'),
    type: 'File',
    uname: 'isaacs',
    gname: 'staff'
  })
  h.encode(slab)

  t.equal(slab.slice(0, 512).toString('hex'), buf.toString('hex'))
  t.equal(slab.toString('hex'), buf.toString('hex') +
          (new Array(1025).join('0')))

  const h2 = new Header(buf)

  t.match(h2, {
    path: 'foo.txt',
    mode: 0o755,
    uid: 24561,
    gid: 20,
    size: 0o77777777777,
    ctime: null,
    atime: null,
    uname: 'isaacs',
    gname: 'staff',
    cksumValid: true,
    cksum: 5673
  })

  t.end()
})

t.test('xstar format', t => {
  const buf = Buffer.from(
    '666f6f2e74787400000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000030303037353520003035373736312000303030303234200030303030' +
    '3030303134342000313236373735363735343000303135313331200030000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0075737461720030306973616163730000000000000000000000000000000000' +
    '0000000000000000007374616666000000000000000000000000000000000000' +
    '0000000000000000003030303030302000303030303030200000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000031323637' +
    '3735363735343000313236373735363735343000000000000000000000000000' +
    // just some junk
    '420420420420420420420420420420420420420420420420420420420420',
    'hex')

  const h = new Header({
    path: 'foo.txt'
  })

  h.set({
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
  const slab = h.block

  t.equal(slab.toString('hex'), buf.slice(0, 512).toString('hex'))

  const h2 = new Header(buf)

  t.match(h2, {
    path: 'foo.txt',
    mode: 0o755,
    uid: 24561,
    gid: 20,
    size: 100,
    mtime: new Date('2016-04-01T22:00Z'),
    ctime: new Date('2016-04-01T22:00Z'),
    atime: new Date('2016-04-01T22:00Z'),
    type: 'File',
    uname: 'isaacs',
    gname: 'staff',
    cksumValid: true,
    cksum: 6745
  })

  t.end()
})

t.test('prefix handling', t => {
  t.plan(4)

  t.test('no times', t => {
    const buf = Buffer.from(
      '666f6f2e74787400000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000030303037353520003035373736312000303030303234200030303030' +
      '3030303134342000313236373735363735343000303337323734200030000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0075737461720030306973616163730000000000000000000000000000000000' +
      '0000000000000000007374616666000000000000000000000000000000000000' +
      '00000000000000000030303030303020003030303030302000722f652f612f6c' +
      '2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f722f652f612f6c2f6c2f79' +
      '2f2d2f722f652f612f6c2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f72' +
      '2f652f612f6c2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f722f652f61' +
      '2f6c2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f642f652f652f702f2d' +
      '2f702f612f742f68000000000000000000000000000000000000000000000000',
      'hex')

    const h = new Header({
      path: 'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/' +
        'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-' +
        '/r/e/a/l/l/y/-/r/e/a/l/l/y/-/d/e/e/p/-/p/a/t/h/foo.txt',
      mode: 0o755,
      uid: 24561,
      gid: 20,
      size: 100,
      mtime: new Date('2016-04-01T22:00Z'),
      ctime: null,
      atime: undefined,
      type: '0',
      uname: 'isaacs',
      gname: 'staff'
    })
    const b2 = Buffer.alloc(512)
    h.encode(b2, 0)

    t.equal(b2.toString().replace(/\0+/g, ' '),
            buf.toString().replace(/\0+/g, ' '))
    t.equal(b2.toString('hex'), buf.toString('hex'))

    const h2 = new Header(buf)

    t.match(h2, {
      path: 'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/' + 
        'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-' +
        '/r/e/a/l/l/y/-/r/e/a/l/l/y/-/d/e/e/p/-/p/a/t/h/foo.txt',
      mode: 0o755,
      uid: 24561,
      gid: 20,
      size: 100,
      mtime: new Date('2016-04-01T22:00Z'),
      ctime: null,
      atime: null,
      type: 'File',
      uname: 'isaacs',
      gname: 'staff',
      cksumValid: true,
      cksum: 16060,
      needPax: false
    })

    t.equal(b2.toString().replace(/\0.*$/, ''), 'foo.txt')
    t.equal(b2.slice(345).toString().replace(/\0.*$/, ''), 'r/e/a/l/l/y/-' +
            '/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-' +
            '/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-' +
            '/d/e/e/p/-/p/a/t/h')

    t.end()
  })

  t.test('a/c times, use shorter prefix field', t => {
    const buf = Buffer.from(
      '652f702f2d2f702f612f742f682f666f6f2e7478740000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000030303037353520003035373736312000303030303234200030303030' +
      '3030303134342000313236373735363735343000303431353030200030000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0075737461720030306973616163730000000000000000000000000000000000' +
      '0000000000000000007374616666000000000000000000000000000000000000' +
      '00000000000000000030303030303020003030303030302000722f652f612f6c' +
      '2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f722f652f612f6c2f6c2f79' +
      '2f2d2f722f652f612f6c2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f72' +
      '2f652f612f6c2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f722f652f61' +
      '2f6c2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f642f65000031323637' +
      '3735363735343000313236373735363735343000000000000000000000000000',
      'hex')

    const h = new Header()
    h.path = 'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/' +
        'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-' +
        '/r/e/a/l/l/y/-/r/e/a/l/l/y/-/d/e/e/p/-/p/a/t/h/foo.txt'
    h.mode = 0o755
    h.uid = 24561
    h.gid = 20
    h.size = 100
    h.mtime = new Date('2016-04-01T22:00Z')
    h.ctime = new Date('2016-04-01T22:00Z')
    h.atime = new Date('2016-04-01T22:00Z')
    h.type = 'File'
    h.uname = 'isaacs'
    h.gname = 'staff'
    const b2 = Buffer.alloc(512)
    h.encode(b2, 0)

    t.equal(b2.toString('hex'), buf.toString('hex'))

    const b3 = Buffer.alloc(1024)
    h.encode(b3, 100)
    t.equal(b2.toString('hex'), b3.slice(100, 612).toString('hex'))

    const h2 = new Header(b3, 100)

    t.match(h2, {
      path: 'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/' +
        'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-' +
        '/r/e/a/l/l/y/-/r/e/a/l/l/y/-/d/e/e/p/-/p/a/t/h/foo.txt',
      mode: 0o755,
      uid: 24561,
      gid: 20,
      size: 100,
      mtime: new Date('2016-04-01T22:00Z'),
      ctime: new Date('2016-04-01T22:00Z'),
      atime: new Date('2016-04-01T22:00Z'),
      type: 'File',
      uname: 'isaacs',
      gname: 'staff',
      cksumValid: true,
      cksum: 17216,
      needPax: false
    }, 'header from buffer')

    t.equal(b2.toString().replace(/\0.*$/, ''), 'e/p/-/p/a/t/h/foo.txt')
    t.equal(b2.slice(345).toString().replace(/\0.*$/, ''), 'r/e/a/l/l/y/-' +
            '/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-' +
            '/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/d/e')

    t.end()
  })

  t.test('hella long basename', t => {
    const buf = Buffer.from(
      '6c6f6e672d66696c652d6c6f6e672d66696c652d6c6f6e672d66696c652d6c6f' +
      '6e672d66696c652d6c6f6e672d66696c652d6c6f6e672d66696c652d6c6f6e67' +
      '2d66696c652d6c6f6e672d66696c652d6c6f6e672d66696c652d6c6f6e672d66' +
      '696c650030303037353520003035373736312000303030303234200030303030' +
      '3030303134342000313236373735363735343000303630313431200030000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0075737461720030306973616163730000000000000000000000000000000000' +
      '0000000000000000007374616666000000000000000000000000000000000000' +
      '00000000000000000030303030303020003030303030302000722f652f612f6c' +
      '2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f722f652f612f6c2f6c2f79' +
      '2f2d2f722f652f612f6c2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f72' +
      '2f652f612f6c2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f722f652f61' +
      '2f6c2f6c2f792f2d2f722f652f612f6c2f6c2f792f2d2f642f652f652f702f2d' +
      '2f702f612f742f68000000000000000000000000000000000000000000000000',
      'hex')
    const h = new Header({
      path: 'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/' + 
        'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/' +
        'r/e/a/l/l/y/-/r/e/a/l/l/y/-/d/e/e/p/-/p/a/t/h/' +
        (new Array(20).join('long-file-')) + 'long-file.txt',
      mode: 0o755,
      uid: 24561,
      gid: 20,
      size: 100,
      mtime: new Date('2016-04-01T22:00Z'),
      ctime: null,
      atime: undefined,
      type: '0',
      uname: 'isaacs',
      gname: 'staff'
    })
    const b2 = Buffer.alloc(513)
    h.encode(b2, 1)

    t.equal(b2.toString('hex'), '00' + buf.toString('hex'))
    t.ok(h.needPax, 'need pax because long filename')

    const h2 = new Header(b2, 1)

    t.match(h2, {
      cksumValid: true,
      cksum: 24673,
      path: 'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/' +
        'r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/r/e/a/l/l/y/-/' +
        'r/e/a/l/l/y/-/d/e/e/p/-/p/a/t/h/long-file-long-file-long-' +
        'file-long-file-long-file-long-file-long-file-long-file-long-' +
        'file-long-file',
      needPax: false
    })

    t.end()
  })

  t.test('long basename, long dirname', t => {
    const buf = Buffer.from(
      '6c6f6e672d6469726e616d652d6c6f6e672d6469726e616d652d6c6f6e672d64' +
      '69726e616d652d6c6f6e672d6469726e616d652d6c6f6e672d6469726e616d65' +
      '2d6c6f6e672d6469726e616d652d6c6f6e672d6469726e616d652d6c6f6e672d' +
      '6469720030303037353520003035373736312000303030303234200030303030' +
      '3030303134342000313236373735363735343000303334323035200030000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0075737461720030306973616163730000000000000000000000000000000000' +
      '0000000000000000007374616666000000000000000000000000000000000000' +
      '0000000000000000003030303030302000303030303030200000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000',
      'hex')

    const h = new Header({
      path: (new Array(30).join('long-dirname-')) + 'long-dirname/' +
        (new Array(20).join('long-file-')) + 'long-file.txt',
      mode: 0o755,
      uid: 24561,
      gid: 20,
      size: 100,
      mtime: new Date('2016-04-01T22:00Z'),
      ctime: null,
      atime: undefined,
      type: '0',
      uname: 'isaacs',
      gname: 'staff'
    })
    const b2 = Buffer.alloc(512)
    h.encode(b2, 0)

    t.equal(h.type, 'File')
    t.equal(h.typeKey, '0')

    t.equal(b2.toString('hex'), buf.toString('hex'))
    t.equal(h.cksum, 14469)
    t.ok(h.needPax, 'need pax because long filename')

    const h2 = new Header(b2)

    t.match(h2, {
      path: 'long-dirname-long-dirname-long-dirname-long-dirname-' +
        'long-dirname-long-dirname-long-dirname-long-dir',
      cksum: 14469,
      cksumValid: true,
      needPax: false
    })

    t.end()
  })
})

t.test('throwers', t => {
  t.throws(_ => new Header(Buffer.alloc(100)),
           new Error('need 512 bytes for header'))

  t.throws(_ => new Header({}).encode(Buffer.alloc(100)),
           new Error('need 512 bytes for header'))

  t.end()
})

t.test('null block', t => {
  const h = new Header(Buffer.alloc(512))
  t.match(h, {
    cksumValid: false,
    needPax: false,
    path: '',
    type: 'File',
    mode: null,
    uid: null,
    gid: null,
    size: null,
    mtime: null,
    cksum: null,
    linkpath: '',
    uname: null,
    gname: null,
    devmaj: 0,
    devmin: 0,
    atime: null,
    ctime: null,
    nullBlock: true
  })
  t.end()
})

t.test('unknown type', t => {
  const h = new Header(Buffer.from(
    '666f6f2e74787400000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000030303037353520003035373736312000303030303234200030303030' +
    '303030313434200031323637373536373534300030303630373620005a000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000',
    'hex'))

  t.equal(h.type, 'Z')
  t.equal(h.typeKey, 'Z')
  t.end()
})

t.test('dir as file with trailing /', t => {
  const b = Buffer.from(
    '782f792f00000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000030303030' +
    '3030303030302000000000000000000000000000303034363136200030000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0075737461720030300000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000003030303030302000303030303030200000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000',
    'hex')
  const h = new Header(b)
  t.equal(h.type, 'Directory')
  b[156] = '0'.charCodeAt(0)
  const h2 = new Header(b)
  t.equal(h2.type, 'Directory')
  t.end()
})

t.test('null numeric values do not get written', t => {
  const b = Buffer.alloc(512)
  const h = new Header()
  h.encode(b, 0)
  t.equal(
    b.toString('hex'),
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000303033303737200030000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0075737461720030300000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000003030303030302000303030303030200000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000')
  const h2 = new Header(b)
  t.match(h2, {
    type: 'File',
    cksumValid: true,
    needPax: false,
    nullBlock: false,
    path: '',
    mode: null,
    uid: null,
    gid: null,
    size: null,
    mtime: null,
    cksum: 1599,
    linkpath: '',
    uname: '',
    gname: '',
    devmaj: 0,
    devmin: 0,
    atime: null,
    ctime: null
  })
  t.end()
})

t.test('big numbers', t => {
  const b = Buffer.alloc(512)
  const h = new Header({
    path: 'bignum',
    size: 0o77777777777 + 1
  })
  h.encode(b, 0)
  const h2 = new Header(b)
  t.equal(h2.size, 0o77777777777 + 1)
  t.end()
})

t.test('dir with long body', t => {
  const b = Buffer.from(
    '7061636b6167652f76656e646f72000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000030303037353520003030303030302000303030303030200030303030' +
    '3030313030303020313330363133303232343120303132303236200035000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0075737461720030300000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000003030303030302000303030303030200000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000',
    'hex')
  const h = new Header(b)
  t.equal(h.type, 'Directory')
  t.equal(h.size, 0)
  t.end()
})

t.test('null block, global extended header', t => {
  const h = new Header(Buffer.alloc(512), 0, {
    undef: undefined,
    blerg: 'bloo',
  }, {
    path: '/global.path',
    foo: 'global foo'
  })
  t.match(h, {
    cksumValid: false,
    needPax: false,
    path: '',
    type: 'File',
    mode: null,
    uid: null,
    gid: null,
    size: null,
    mtime: null,
    cksum: null,
    linkpath: '',
    uname: null,
    gname: null,
    devmaj: 0,
    devmin: 0,
    atime: null,
    ctime: null,
    nullBlock: true,
    blerg: 'bloo',
    foo: 'global foo',
  })
  t.end()
})

t.test('gnutar-generated 10gb file size', t => {
  const b = Buffer.from(
    '313067622e696d67000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000030303030363634003030303137353000303030313735300080000000' +
    '0000000280000000313334373434303132303500303131313437002030000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0075737461722020006973616163730000000000000000000000000000000000' +
    '0000000000000000006973616163730000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000', 'hex')
  const h = new Header(b)
  t.equal(h.size, 1024 * 1024 * 1024 * 10, 'should be 10gb file')
  t.end()
})

t.test('do not apply ex/gex to meta entries', t => {
  // Per POSIX pax, a PAX extended header describes the *next file entry*,
  // not intermediary extension headers (L/K/x/g). Applying pending PAX
  // overrides (notably `size`) to an intervening L/K/x/g header
  // desynchronizes the stream and enables file-smuggling attacks (CVE-2026-53655).
  const normalEntryTypes = new Set([
    'File',
    'OldFile',
    'Link',
    'SymbolicLink',
    'CharacterDevice',
    'BlockDevice',
    'Directory',
    'FIFO',
    'ContiguousFile',
    'GNUDumpDir',
  ])

  for (const type of types.name.values()) {
    const data = new Header({
      path: 'x',
      type,
      size: 1,
    })
    data.encode()
    const h = new Header(data.block, 0, {
      size: 100,
      dev: 5678,
      ino: 9876,
    })
    if (normalEntryTypes.has(type)) {
      if (h.type === 'Directory') {
        t.equal(h.size, 0, 'Directories always size=0, no matter what')
      } else {
        t.equal(h.size, 100, `expect ${type} to respect extended header`)
      }
      t.equal(h.dev, 5678, `expect ${type} to respect extended header`)
      t.equal(h.ino, 9876, `expect ${type} to respect extended header`)
    } else {
      t.equal(h.size, 1, `expect ${type} to ignore extended header`)
      t.equal(h.dev, undefined, `expect ${type} to ignore extended header`)
      t.equal(h.ino, undefined, `expect ${type} to ignore extended header`)
    }
  }

  t.end()
})

t.test('do not apply any ex/gex field to meta entries', t => {
  // Every field a pending extended header can override must be honored on a
  // normal file system entry and ignored on an intermediary meta entry,
  // whether it arrives via a local (ex) or a global (gex) extended header.
  const normalEntryTypes = new Set([
    'File',
    'OldFile',
    'Link',
    'SymbolicLink',
    'CharacterDevice',
    'BlockDevice',
    'Directory',
    'FIFO',
    'ContiguousFile',
    'GNUDumpDir',
  ])

  const mtime = new Date('2016-04-01T22:00:00.000Z')
  const ext = {
    path: 'extended/path',
    mode: 0o751,
    uid: 1234,
    gid: 4321,
    size: 100,
    mtime: mtime,
    uname: 'ext-user',
    gname: 'ext-group',
    devmaj: 7,
    devmin: 9,
    dev: 5678,
    ino: 9876,
  }

  for (const global of [false, true]) {
    for (const type of types.name.values()) {
      const data = new Header({
        path: 'x',
        type,
        size: 1,
      })
      data.encode()
      const h = global ? new Header(data.block, 0, undefined, ext)
        : new Header(data.block, 0, ext)
      const name = `${type} (${global ? 'global ' : ''}extended header)`
      if (normalEntryTypes.has(type)) {
        // a global extended header never sets the path
        t.equal(h.path, global ? 'x' : 'extended/path', `${name} path`)
        t.equal(h.mode, 0o751, `${name} mode`)
        t.equal(h.uid, 1234, `${name} uid`)
        t.equal(h.gid, 4321, `${name} gid`)
        t.equal(h.size, h.type === 'Directory' ? 0 : 100, `${name} size`)
        t.equal(h.mtime.getTime(), mtime.getTime(), `${name} mtime`)
        t.equal(h.uname, 'ext-user', `${name} uname`)
        t.equal(h.gname, 'ext-group', `${name} gname`)
        t.equal(h.devmaj, 7, `${name} devmaj`)
        t.equal(h.devmin, 9, `${name} devmin`)
        t.equal(h.dev, 5678, `${name} dev`)
        t.equal(h.ino, 9876, `${name} ino`)
      } else {
        t.equal(h.path, 'x', `${name} path ignored`)
        t.equal(h.mode, null, `${name} mode ignored`)
        t.equal(h.uid, null, `${name} uid ignored`)
        t.equal(h.gid, null, `${name} gid ignored`)
        t.equal(h.size, 1, `${name} size ignored`)
        t.equal(h.mtime, null, `${name} mtime ignored`)
        t.equal(h.uname, '', `${name} uname ignored`)
        t.equal(h.gname, '', `${name} gname ignored`)
        t.equal(h.devmaj, 0, `${name} devmaj ignored`)
        t.equal(h.devmin, 0, `${name} devmin ignored`)
        t.equal(h.dev, undefined, `${name} dev ignored`)
        t.equal(h.ino, undefined, `${name} ino ignored`)
      }
    }
  }

  t.end()
})

t.test('no negative size', t => {
  const i = new Header({ size: -1000 })
  // stubbornly refuse
  t.equal(i.size, null)
  t.end()
})

t.test('no negative size in a decoded header', t => {
  // A negative size means a negative body length, which no consumer can
  // ever read past (CVE-2026-59874).  Drop it however the block encodes it.

  // base-256 (0xff prefix) negative size, the way a hostile archive would
  // carry it.  Set it on the instance so it goes around the guard in set().
  const h = new Header({ path: 'negative-size', size: 0 })
  h.size = -1000
  const b256 = Buffer.alloc(512)
  h.encode(b256, 0)
  t.equal(b256[124], 0xff, 'size field is base-256 negative')
  const d = new Header(b256)
  t.equal(d.cksumValid, true, 'block is otherwise a valid header')
  t.equal(d.path, 'negative-size', 'the rest of the header is read')
  t.equal(d.size, null, 'base-256 negative size is dropped')

  // octal size field with a leading minus sign
  const oct = Buffer.alloc(512)
  new Header({ path: 'negative-size', size: 0 }).encode(oct, 0)
  oct.write('-0000001750\0', 124, 12, 'ascii')
  const o = new Header(oct)
  t.equal(o.path, 'negative-size', 'the rest of the header is read')
  t.equal(o.size, null, 'octal negative size is dropped')

  // non-negative sizes are still read
  const p = new Header({ path: 'positive-size', size: 1000 })
  p.encode()
  t.equal(new Header(p.block).size, 1000, 'positive size is kept')
  t.end()
})
