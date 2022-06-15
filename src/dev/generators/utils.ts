import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { customAlphabet } from 'nanoid'

export const nextUid = customAlphabet('1234567890abcdef', 10)

export const mkdirIfNotExist = (path: string) => {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export const writeFileFix = async (path: string, content: string) => {
  mkdirIfNotExist(path)
  console.log(`save file: ${path}`)
  //await writeFile(path, content)
  writeFileSync(path, content)
}

export const toCamelCase = (str: string): string => {
  return str.replace(/\_(\w)/g, (_, letter) => letter.toUpperCase())
}

export const toUnderscore = (str: string): string => {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

export const toCapital = (str: string, sub = false): string => {
  if (!str || str.length === 0) return ''
  if (sub) str = str.replace(/\-(\w)/g, (_, letter) => letter.toUpperCase())
  return str[0].toUpperCase() + str.slice(1)
}

export const getInstanceName = (str: string): string => {
  return str[0].toLowerCase() + str.slice(1)
}

export const getFileName = (str: string, type?: string): string => {
  const ss = str
    .replace(/.ts$/, '')
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .replace(/\./g, '_')
    .toLowerCase()
    .split('_')
  if (type && ss[ss.length - 1] === type) {
    ss.pop()
  }
  const endFix = type ? '.' + type : ''
  return ss.join('-') + endFix
}
