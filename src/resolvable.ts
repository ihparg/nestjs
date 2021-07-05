export const resolves = []

export const resolvable = (target) => {
  const service = target.name
  Object.getOwnPropertyNames(target.prototype).forEach((f) => {
    if (f === 'constructor') return
    resolves.push(`${service}.${f}`)
  })
}
