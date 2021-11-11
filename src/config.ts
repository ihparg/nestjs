import { readFileSync } from 'fs'
import * as yaml from 'js-yaml'

export default () => {
  return yaml.load(readFileSync('./config.yaml', 'utf8')) as Record<string, any>
}
