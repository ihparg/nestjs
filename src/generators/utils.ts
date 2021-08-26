import { writeFile, rename } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'
import { dirname } from 'path'
import { customAlphabet } from 'nanoid'

const promisedExec = promisify(exec)

export const nextUid = customAlphabet('1234567890abcdef', 10)

export const mkdirIfNotExist = (path: string) => {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

let fileCache = []

export const writeFileDelay = async (path: string, content: string) => {
  mkdirIfNotExist(path)

  const temp = path + '.tmp.ts'
  await writeFile(temp, content)
  fileCache.push([temp, path])
}

export const writeFileFix = async () => {
  const temp = [...fileCache]
  fileCache = []

  await Promise.all(temp.map(([file]) => promisedExec(`npx eslint ${file} --fix`)))
  await Promise.all(temp.map(([oldFile, newFile]) => rename(oldFile, newFile)))
}

export const toCamelCase = (str: string): string => {
  return str.replace(/\_(\w)/g, (_, letter) => letter.toUpperCase())
}

export const toUnderscore = (str: string): string => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export const toCapital = (str: string): string => {
  if (!str || str.length === 0) return ''
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
