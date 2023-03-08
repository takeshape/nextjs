import chalk from 'chalk'
import { getConfig } from './config.js'

const { logLevel } = getConfig()

export const logPrefix = `${chalk.cyan('takeshape')} -`

export function logWithPrefix(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(`${logPrefix} `, ...args)
}

export class Log {
  debug(...args: any[]) {
    if (logLevel <= 20) {
      return logWithPrefix(...args)
    }
  }

  info(...args: any[]) {
    if (logLevel <= 30) {
      return logWithPrefix(...args)
    }
  }

  error(...args: any[]) {
    if (logLevel <= 50) {
      return logWithPrefix(...args)
    }
  }
}

export const log = new Log()
