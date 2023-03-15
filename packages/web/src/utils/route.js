export const getFieldByRef = (schemas, path) => {
  path = path.split('.')
  let key = path.shift()
  let temp = schemas[key].content
  while (path.length > 0) {
    key = path.shift()
    temp = temp.type === 'array' || temp.type === 'map' ? temp.items[key] : temp.properties[key]
  }

  return temp
}

export const getParentByPath = (root, path) => {
  let key = path.shift()
  let temp = root
  while (path.length > 0) {
    key = path.shift()
    temp = temp.items ? temp.items[key] : temp.properties[key]
  }

  return temp
}

export const getRouteParamsKeys = (path = '') => {
  const keys = []

  path.split('/').forEach(p => {
    if (p[0] === ':') keys.push(p.substring(1))
  })

  return keys
}

const getRefs = (props, refs) => {
  if (!props) return
  if (props.ref) refs[props.ref] = true
  if (props.properties) {
    Object.keys(props.properties).forEach(k => {
      getRefs(props.properties[k], refs)
    })
  }
  if (props.items) {
    getRefs(props.items[0], refs)
  }
}

export const getAllRefs = route => {
  const refs = {}
  ;['requestBody', 'requestHeaders', 'queryString', 'responseBody', 'responseHeaders'].forEach(
    name => {
      getRefs(route[name], refs)
    },
  )

  return Object.keys(refs)
}

export const getFullPath = (value, apiPrefix) => {
  const { method, module, controller, path } = value
  const fullPath = [apiPrefix]
  if (module) fullPath.push(module)
  fullPath.push(controller)
  fullPath.push(path)
  return `${method}:${fullPath.join('/')}`
}

export const toCapital = (str, sub = false) => {
  if (!str || str.length === 0) return ''
  if (sub) str = str.replace(/-(\w)/g, (_, letter) => letter.toUpperCase())
  return str[0].toUpperCase() + str.slice(1)
}

export const getFunctionName = (path, method) => {
  const splitedPath = path.replace(/^\/|\/$/g, '').split('/')
  const prefix = path.indexOf(':') >= 0 ? method.toLowerCase() : ''
  if (prefix) void splitedPath.unshift(prefix)

  const fn = (sp, param = '') => {
    if (sp.length === 0) return param
    const name = `${sp.pop()}${param}`
    if (name && name.indexOf(':') >= 0) return fn(sp, `By${toCapital(name.replace(/:/g, ''))}`)
    return fn(sp, toCapital(name, true))
  }

  return fn(splitedPath)
}
