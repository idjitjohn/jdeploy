import { getPaths } from '@/server/utils/paths'
import fs from 'fs'
import path from 'path'

export async function writeCertificateFiles(domainName: string, certificate: string, privateKey: string) {
  const paths = await getPaths()
  const certPath = path.join(paths.certificate, domainName)
  
  if (!fs.existsSync(certPath)) {
    fs.mkdirSync(certPath, { recursive: true })
  }
  
  fs.writeFileSync(path.join(certPath, 'crt'), certificate || '', 'utf-8')
  fs.writeFileSync(path.join(certPath, 'key'), privateKey || '', 'utf-8')
}
