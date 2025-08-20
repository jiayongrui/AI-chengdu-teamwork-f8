/**
 * Minimal MD5 implementation in TS (no third-party), returns lowercase hex.
 * This is intentionally simple for demo purposes and NOT for production use.
 * Ref: RFC 1321 algorithm steps encoded in JS.
 */
export function md5(input: string): string {
  function toBytes(str: string) {
    // 使用TextEncoder来正确处理UTF-8编码
    if (typeof TextEncoder !== 'undefined') {
      const encoder = new TextEncoder()
      return Array.from(encoder.encode(str))
    }
    
    // 降级处理：手动UTF-8编码
    const utf8: number[] = []
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i)
      if (c < 128) {
        utf8.push(c)
      } else if (c < 2048) {
        utf8.push((c >> 6) | 192, (c & 63) | 128)
      } else if ((c & 0xfc00) === 0xd800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
        // 处理代理对（surrogate pairs）
        c = 0x10000 + ((c & 0x3ff) << 10) + (str.charCodeAt(++i) & 0x3ff)
        utf8.push((c >> 18) | 240, ((c >> 12) & 63) | 128, ((c >> 6) & 63) | 128, (c & 63) | 128)
      } else {
        utf8.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128)
      }
    }
    return utf8
  }

  function rhex(n: number) {
    const s = "0123456789abcdef"
    let j, str = ""
    for (j = 0; j < 4; j++) str += s.charAt((n >> (j * 8 + 4)) & 0x0f) + s.charAt((n >> (j * 8)) & 0x0f)
    return str
  }

  function add(x: number, y: number) {
    return (x + y) & 0xffffffff
  }
  function rol(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt))
  }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return add(rol(add(add(a, q), add(x, t)), s), b)
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t)
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~b), a, b, x, s, t)
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t)
  }

  // Convert to words
  const bytes = toBytes(input)
  const len = bytes.length
  const words: number[] = []
  let i: number
  for (i = 0; i < len; i++) {
    words[i >> 2] = words[i >> 2] || 0
    words[i >> 2] |= bytes[i] << ((i % 4) * 8)
  }
  // padding
  words[len >> 2] = words[len >> 2] || 0
  words[len >> 2] |= 0x80 << ((len % 4) * 8)
  words[(((len + 8) >> 6) + 1) * 16 - 2] = len * 8

  // Initial values
  let a = 1732584193
  let b = -271733879
  let c = -1732584194
  let d = 271733878

  for (i = 0; i < words.length; i += 16) {
    const olda = a, oldb = b, oldc = c, oldd = d

    a = ff(a, b, c, d, words[i + 0] || 0, 7, -680876936)
    d = ff(d, a, b, c, words[i + 1] || 0, 12, -389564586)
    c = ff(c, d, a, b, words[i + 2] || 0, 17, 606105819)
    b = ff(b, c, d, a, words[i + 3] || 0, 22, -1044525330)
    a = ff(a, b, c, d, words[i + 4] || 0, 7, -176418897)
    d = ff(d, a, b, c, words[i + 5] || 0, 12, 1200080426)
    c = ff(c, d, a, b, words[i + 6] || 0, 17, -1473231341)
    b = ff(b, c, d, a, words[i + 7] || 0, 22, -45705983)
    a = ff(a, b, c, d, words[i + 8] || 0, 7, 1770035416)
    d = ff(d, a, b, c, words[i + 9] || 0, 12, -1958414417)
    c = ff(c, d, a, b, words[i + 10] || 0, 17, -42063)
    b = ff(b, c, d, a, words[i + 11] || 0, 22, -1990404162)
    a = ff(a, b, c, d, words[i + 12] || 0, 7, 1804603682)
    d = ff(d, a, b, c, words[i + 13] || 0, 12, -40341101)
    c = ff(c, d, a, b, words[i + 14] || 0, 17, -1502002290)
    b = ff(b, c, d, a, words[i + 15] || 0, 22, 1236535329)

    a = gg(a, b, c, d, words[i + 1] || 0, 5, -165796510)
    d = gg(d, a, b, c, words[i + 6] || 0, 9, -1069501632)
    c = gg(c, d, a, b, words[i + 11] || 0, 14, 643717713)
    b = gg(b, c, d, a, words[i + 0] || 0, 20, -373897302)
    a = gg(a, b, c, d, words[i + 5] || 0, 5, -701558691)
    d = gg(d, a, b, c, words[i + 10] || 0, 9, 38016083)
    c = gg(c, d, a, b, words[i + 15] || 0, 14, -660478335)
    b = gg(b, c, d, a, words[i + 4] || 0, 20, -405537848)
    a = gg(a, b, c, d, words[i + 9] || 0, 5, 568446438)
    d = gg(d, a, b, c, words[i + 14] || 0, 9, -1019803690)
    c = gg(c, d, a, b, words[i + 3] || 0, 14, -187363961)
    b = gg(b, c, d, a, words[i + 8] || 0, 20, 1163531501)
    a = gg(a, b, c, d, words[i + 13] || 0, 5, -1444681467)
    d = gg(d, a, b, c, words[i + 2] || 0, 9, -51403784)
    c = gg(c, d, a, b, words[i + 7] || 0, 14, 1735328473)
    b = gg(b, c, d, a, words[i + 12] || 0, 20, -1926607734)

    a = hh(a, b, c, d, words[i + 5] || 0, 4, -378558)
    d = hh(d, a, b, c, words[i + 8] || 0, 11, -2022574463)
    c = hh(c, d, a, b, words[i + 11] || 0, 16, 1839030562)
    b = hh(b, c, d, a, words[i + 14] || 0, 23, -35309556)
    a = hh(a, b, c, d, words[i + 1] || 0, 4, -1530992060)
    d = hh(d, a, b, c, words[i + 4] || 0, 11, 1272893353)
    c = hh(c, d, a, b, words[i + 7] || 0, 16, -155497632)
    b = hh(b, c, d, a, words[i + 10] || 0, 23, -1094730640)
    a = hh(a, b, c, d, words[i + 13] || 0, 4, 681279174)
    d = hh(d, a, b, c, words[i + 0] || 0, 11, -358537222)
    c = hh(c, d, a, b, words[i + 3] || 0, 16, -722521979)
    b = hh(b, c, d, a, words[i + 6] || 0, 23, 76029189)
    a = hh(a, b, c, d, words[i + 9] || 0, 4, -640364487)
    d = hh(d, a, b, c, words[i + 12] || 0, 11, -421815835)
    c = hh(c, d, a, b, words[i + 15] || 0, 16, 530742520)
    b = hh(b, c, d, a, words[i + 2] || 0, 23, -995338651)

    a = ii(a, b, c, d, words[i + 0] || 0, 6, -198630844)
    d = ii(d, a, b, c, words[i + 7] || 0, 10, 1126891415)
    c = ii(c, d, a, b, words[i + 14] || 0, 15, -1416354905)
    b = ii(b, c, d, a, words[i + 5] || 0, 21, -57434055)
    a = ii(a, b, c, d, words[i + 12] || 0, 6, 1700485571)
    d = ii(d, a, b, c, words[i + 3] || 0, 10, -1894986606)
    c = ii(c, d, a, b, words[i + 10] || 0, 15, -1051523)
    b = ii(b, c, d, a, words[i + 1] || 0, 21, -2054922799)
    a = ii(a, b, c, d, words[i + 8] || 0, 6, 1873313359)
    d = ii(d, a, b, c, words[i + 15] || 0, 10, -30611744)
    c = ii(c, d, a, b, words[i + 6] || 0, 15, -1560198380)
    b = ii(b, c, d, a, words[i + 13] || 0, 21, 1309151649)
    a = add(a, olda)
    b = add(b, oldb)
    c = add(c, oldc)
    d = add(d, oldd)
  }
  return rhex(a) + rhex(b) + rhex(c) + rhex(d)
}
