#!/usr/bin/env node

import inquirer from 'inquirer'
import { getConfig } from '../lib/config.js'
import { log, logPrefix } from '../lib/log.js'
import { CliFlags } from '../lib/types.js'
import { createBranch } from './createBranch.js'

export async function postCheckoutHook({ name, tty }: CliFlags) {
  try {
    const { noTtyShouldCreateBranch, promptCreateBranch } = getConfig()

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

    return createBranch({ name })
  } catch (error) {
    log.debug(error)

    if (error instanceof Error) {
      log.error(error.message)
    }

    return
  }
}
