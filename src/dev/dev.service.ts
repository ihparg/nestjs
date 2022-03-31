import { join } from 'path'
import { customAlphabet } from 'nanoid'
import { Inject, Injectable } from '@nestjs/common'
import { readdir, readFile, writeFile, unlink } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { UidFunction, DevOption } from './interface'
import { Swagger } from './swagger'
import { DEV_OPTION } from './constants'

@Injectable()
export class DevService {
  nextUid: UidFunction

  constructor(@Inject(DEV_OPTION) private readonly option: DevOption) {
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
    return Promise.all(files.filter((file) => !file.startsWith('.')).map((file) => this.getJsonFile(join(dir, file))))
  }

  async saveFile(path: string, data: any) {
    await writeFile(path, JSON.stringify(data, null, 2))
  }

  async deleteFile(path: string) {
    await unlink(path)
  }

  async getSwagger() {
    const { schemaPath, routePath, apiPrefix } = this.option
    const schemas = await this.getJsonFileList(schemaPath || 'data/schemas')
    const routes = await this.getJsonFileList(routePath || 'data/routes')

    return new Swagger(schemas, routes, apiPrefix).getDocument()
  }
}
