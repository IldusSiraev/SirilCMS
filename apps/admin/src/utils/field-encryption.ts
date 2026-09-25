import crypto from 'node:crypto'

const ALGO = 'aes-256-gcm'
const VERSION = 'v1'

function getKey(): Buffer {
  const secret = process.env.PAYLOAD_SECRET ?? 'dev-secret'
  return crypto.createHash('sha256').update(`siril-cms:field-encryption:${secret}`).digest()
}

export function encryptField(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [VERSION, iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':')
}

export function decryptField(stored: string): string {
  const parts = stored.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION) return stored
  const [, ivB64, tagB64, dataB64] = parts
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
}
