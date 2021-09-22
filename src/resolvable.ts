export const resolves = []
export const resolvePath = {}

export const Resolvable = (dir?: string) => (target) => {
  const service = target.name
  resolvePath[service] = dir
  Object.getOwnPropertyNames(target.prototype).forEach((f) => {
    if (f === 'constructor') return
    resolves.push(`${service}.${f}`)
  })
}
