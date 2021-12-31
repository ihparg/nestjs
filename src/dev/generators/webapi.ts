import { readFile } from 'fs/promises'
import { join } from 'path'
import { compile } from 'nunjucks'
import { RouteResult } from './interface'
import { writeFileFix } from './utils'

export default async (route: RouteResult, path: string) => {
  const njk = await readFile(join(__dirname, '../tpl/webapi.njk'), 'utf-8')
  const content = compile(njk).render({
    dtos: route.dtos,
    response: route.ResponseDto,
    request: route.BodyDto || route.QueryDto,
    method: route.method.toLowerCase(),
    url: route.pathname,
  })

  await writeFileFix(path, content)
}
