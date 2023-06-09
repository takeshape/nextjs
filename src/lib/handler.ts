import { CommandModule } from 'yargs'
import { ConfigOptions, getConfig } from './config'

export function isDisabled(options: ConfigOptions = {}): boolean {
  return Boolean(getConfig(options).apiKey)
}

type Handler<T> = CommandModule<unknown, T>['handler']

/**
 * Only execute the handler if the API key is set.
 */
export function runIfConfigured<T>(handler: Handler<T>, handlerIfDisabled?: Handler<T>) {
  return (args: any) => {
    if (isDisabled(...args)) {
      return handlerIfDisabled?.(args)
    }

    return handler(args)
  }
}
