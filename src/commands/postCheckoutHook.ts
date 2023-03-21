#!/usr/bin/env node

import inquirer from 'inquirer'
import { CommandModule } from 'yargs'
import { getConfig } from '../lib/config.js'
import { log, logPrefix } from '../lib/log.js'
import { isInteractive } from '../lib/util.js'
import { handler as createBranch } from './createBranch.js'

type Args = {
  debug?: boolean
  name?: string
  tty: boolean
}

export async function handler({ name, ...flags }: Args) {
  try {
    const { noTtyShouldCreateBranch, promptCreateBranch, tty } = getConfig({ flags })

    let shouldCreateBranch = noTtyShouldCreateBranch

    if (tty && promptCreateBranch) {
      log.debug('Interactive shell detected, prompting user')
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          prefix: logPrefix,
          name: 'shouldCreateBranch',
          message: 'Would you like to create a new API branch?',
          default: true,
        },
      ])
      shouldCreateBranch = answers.shouldCreateBranch
    }

    if (!shouldCreateBranch) {
      log.debug('User does not want to create branch')
      return
    }

    return createBranch({ name } as any)
  } catch (error) {
    log.debug(error)

    if (error instanceof Error) {
      log.error(error.message)
    }

    return
  }
}

export const postCheckoutHook: CommandModule<unknown, Args> = {
  command: 'post-checkout-hook',
  describe: 'Typically invoked by the git post-checkout hook',
  builder: {
    name: {
      describe: 'A specific branch name to use, instead of finding a value from your env',
      type: 'string',
      demand: false,
    },
    tty: {
      describe: 'Does your terminal have tty support?',
      type: 'boolean',
      demand: false,
      default: isInteractive(),
    },
    debug: {
      describe: 'Provide debug logging',
      type: 'boolean',
      demand: false,
    },
  },
  handler,
}
