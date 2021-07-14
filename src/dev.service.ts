import { join } from 'path'
import { customAlphabet } from 'nanoid'
import { readdir, readFile, writeFile, unlink } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { UidFunction } from './interface'
import { resolvable } from './resolvable'

@resolvable('src/dev.service')
export class DevService {
  nextUid: UidFunction

  constructor() {
    this.nextUid = customAlphabet('1234567890abcdef', 10)
  }

  resolvePath(...x: string[]): string {
    return join(process.cwd(), ...x)
  }

  async getStaticFile(path: string): Promise<string> {
    const file = await readFile(join(__dirname, path), 'utf-8')
    return file
  }

  async getJsonFile(path: string): Promise<any> {
    const text = await readFile(path, 'utf-8')
    return JSON.parse(text)
  }

  async getJsonFileList(path: string): Promise<Array<any>> {
    const dir = join(process.cwd(), path)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const files = await readdir(join(process.cwd(), path))
    return Promise.all(files.map((file) => this.getJsonFile(join(dir, file))))
  }

  async saveFile(path: string, data: any) {
    await writeFile(path, JSON.stringify(data, null, 2))
  }

  async deleteFile(path: string) {
    await unlink(path)
  }
}
