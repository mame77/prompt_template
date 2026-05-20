export function uuidv7(): string {
  const ms = Date.now()
  const rand = new Uint8Array(10)
  crypto.getRandomValues(rand)

  const bytes = new Uint8Array(16)

  bytes[0] = (ms >>> 40) & 0xff
  bytes[1] = (ms >>> 32) & 0xff
  bytes[2] = (ms >>> 24) & 0xff
  bytes[3] = (ms >>> 16) & 0xff
  bytes[4] = (ms >>> 8) & 0xff
  bytes[5] = ms & 0xff

  bytes[6] = 0x70 | (rand[0] & 0x0f)
  bytes[7] = rand[1]

  bytes[8] = (rand[2] & 0x3f) | 0x80
  bytes[9] = rand[3]
  bytes[10] = rand[4]
  bytes[11] = rand[5]
  bytes[12] = rand[6]
  bytes[13] = rand[7]
  bytes[14] = rand[8]
  bytes[15] = rand[9]

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
