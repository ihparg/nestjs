import { Route } from './interface'

export function getFullPath(route: Route, apiPrefix: string): string {
  const { module, controller, path } = route
  const fullPath = [apiPrefix || '']
  if (module) fullPath.push(module)
  fullPath.push(controller)
  fullPath.push(path)
  return fullPath.join('/')
}
