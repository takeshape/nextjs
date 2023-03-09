import chalk from 'chalk'
import { getConfig } from './config.js'

export const logPrefix = `${chalk.cyan('takeshape')} -`

export function logWithPrefix(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(`${logPrefix} `, ...args)
}

export class Log {
  debug(...args: any[]) {
    const { logLevel } = getConfig()

    if (logLevel <= 20) {
      logWithPrefix('[DEBUG]', ...args)
    }
  }

  info(...args: any[]) {
    const { logLevel } = getConfig()

    if (logLevel <= 30) {
      logWithPrefix(...args)
    }
  }

  error(...args: any[]) {
    const { logLevel } = getConfig()

    if (logLevel <= 50) {
      logWithPrefix('[ERROR]', ...args)
    }
  }
}

export const log = new Log()
