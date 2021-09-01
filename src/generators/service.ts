import { join } from 'path'
import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { compile } from 'nunjucks'
import { getFileName, getInstanceName } from './utils'

const functionTemplate = `
async {{functionName}}(): Promise<{{response}}> {
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
    line = line.trim()
    if (line.indexOf('import ') >= 0) {
      lines.push(line)
      return
    } else if (stage === 0) {
      if (data.imports) lines.push(data.imports)
      stage = 1
    }
  })
}

const createFile = async (data, file) => {
  const njk = await readFile(join(__dirname, './tpl/service.njk'), 'utf-8')
  const content = compile(njk).render(data)
  await writeFile(file, content)
}

export const resolveService = async (option: Service) => {
  const [service] = option.service.split('.')
  const serviceName = getFileName(service, 'service')
  const file = join(option.dir, serviceName + '.ts')
  const funcCode = compile(functionTemplate).render({
    functionName: option.functionName,
    response: option.dtos.ResponseDto,
  })

  const data = {
    servicePath: './' + serviceName,
    serviceName: getInstanceName(service),
    funcCode,
    imports: option.dtos.imports,
  }

  if (existsSync(file)) {
    await appendToFile(data, file)
  } else {
    await createFile(data, file)
  }

  console.log(funcCode, file, option.dtos)
}
