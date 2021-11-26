import { join } from 'path'
import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { compile } from 'nunjucks'
import { getFileName, toCapital } from './utils'

const functionTemplate = `
  async {{functionName}}({{params}}): Promise<{{response}}> {
    // Write your code here.
    return null
  }
`

export interface Service {
  dir: string
  service: string
  functionName: string
  params: { [key: string]: any }
  dtos: { [key: string]: any }
}

const appendToFile = async (data, file) => {
  const content = await readFile(file, 'utf-8')
  const lines = []
  let stage = 0
  const list = content.replace(/[\s|\n]+$/g, '').split('\n')
  list.forEach((line, i) => {
    lines.push(line)
    if (line.indexOf('import ') < 0 && stage === 0) {
      if (data.imports && content.indexOf(data.dtoFileName) < 0) {
        lines.splice(lines.length - 1, 0, data.imports)
      }
      stage = 1
    } else if (line.indexOf(`class ${data.serviceName}`) >= 0 && stage === 1) {
      stage = 2
    } else if (stage === 2 && line.indexOf(`async ${data.funcName}`) >= 0) {
      stage = 3
    } else if (stage === 2 && i === list.length - 1) {
      lines.splice(lines.length - 1, 0, data.funcCode)
      stage = 4
    }
  })

  if (stage === 4) await writeFile(file, lines.join('\n'))
}

const createFile = async (data, file) => {
  const njk = await readFile(join(__dirname, '../tpl/service.njk'), 'utf-8')
  const content = compile(njk).render(data)
  await writeFile(file, content)
}

export const resolveService = async (option: Service) => {
  const [service, method] = option.service.split('.')
  const serviceName = getFileName(service, 'service')
  const file = join(option.dir, serviceName + '.ts')

  const params = []
  Object.keys(option.params ?? {}).forEach((n) => {
    params.push(`${n}:${option.params[n].type}`)
  })
  if (option.dtos.BodyDto) params.push(`body:${option.dtos.BodyDto}`)
  if (option.dtos.QueryDto) params.push(`query:${option.dtos.QueryDto}`)

  const funcCode = compile(functionTemplate).render({
    functionName: method,
    response: option.dtos.ResponseDto,
    params: params.join(','),
  })

  const data = {
    servicePath: './' + serviceName,
    serviceName: toCapital(service),
    funcCode,
    funcName: method,
    imports: option.dtos.imports,
    dtoFileName: option.dtos.fileName,
  }

  if (existsSync(file)) {
    await appendToFile(data, file)
  } else {
    await createFile(data, file)
  }
}
