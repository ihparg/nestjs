import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { exec } from 'child_process'
import { dirname } from 'path'

export const mkdirIfNotExist = (path: string) => {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export const writeFileFix = async (path: string, content: string) => {
  mkdirIfNotExist(path)
  await writeFile(path, content)
}

export const eslintFix = (path) => {
  const cmd = `npx eslint ${path} --fix`
  exec(cmd)
}

export const toCamelCase = (str: string): string => {
  return str.replace(/\_(\w)/g, (_, letter) => letter.toUpperCase())
}

export const toUnderscore = (str: string): string => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export const toCapital = (str: string): string => {
  str = str.toLowerCase()
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
