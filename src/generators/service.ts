import { join } from 'path'
import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { compile } from 'nunjucks'
import { getFileName, toCapital } from './utils'

const functionTemplate = `
async {{functionName}}({% if body %}body: {{body}},{% endif %}{% if query %}query: {{query}},{% endif %}): Promise<{{response}}> {
  // Write your code here.
}
`

export interface Service {
  dir: string
  service: string
  functionName: string
  dtos: {
    [key: string]: any
  }
}

const appendToFile = async (data, file) => {
  const content = await readFile(file, 'utf-8')
  const lines = []
  let stage = 0
  content.split('\n').forEach((line) => {
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
    } else if (stage === 2 && line === '}') {
      lines.splice(lines.length - 1, 0, data.funcCode)
    }
  })

  await writeFile(file, lines.join('\n'))
}

const createFile = async (data, file) => {
  const njk = await readFile(join(__dirname, './tpl/service.njk'), 'utf-8')
  const content = compile(njk).render(data)
  await writeFile(file, content)
}

export const resolveService = async (option: Service) => {
  const [service, method] = option.service.split('.')
  const serviceName = getFileName(service, 'service')
  const file = join(option.dir, serviceName + '.ts')
  const funcCode = compile(functionTemplate).render({
    functionName: method,
    response: option.dtos.ResponseDto,
    query: option.dtos.QueryDto,
    body: option.dtos.BodyDto,
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
