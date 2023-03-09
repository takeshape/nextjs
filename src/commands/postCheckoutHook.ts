#!/usr/bin/env node

import inquirer from 'inquirer'
import { getClient } from '../lib/client.js'
import { getConfig } from '../lib/config.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { log, logPrefix } from '../lib/log.js'
import { getCommitInfo, isDefaultBranch } from '../lib/repo.js'
import { CliFlags } from '../lib/types.js'
import { isInteractive } from '../lib/util.js'

const questions = [
  {
    type: 'confirm',
    prefix: logPrefix,
    name: 'shouldCreateBranch',
    message: 'Would you like to create a new API branch?',
    default: true,
  },
]

export async function postCheckoutHook({ name }: CliFlags) {
  try {
    const { apiKey, env, projectId } = getConfig()

    if (!apiKey) {
      log.error('No API key found')
      return
    }

    if (!isInteractive()) {
      log.debug('Non-interactive shell detected')
      return
    }

    const { shouldCreateBranch } = await inquirer.prompt(questions)

    if (!shouldCreateBranch) {
      log.debug('User does not want to create branch')
      return
    }

    const client = getClient({ apiKey })

    let branchName: string | undefined

    if (name) {
      branchName = name
    } else {
      const { gitCommitRef } = await getCommitInfo(env)
      branchName = gitCommitRef
    }

    log.debug('Proceding with branchName:', branchName)

    if (!branchName) {
      log.error(`Could not read your repo`)
      return
    }

    if (isDefaultBranch(branchName)) {
      log.error(`Default 'production' branch already exists`)
      return
    }

    const result = await client.createBranch({
      input: { projectId, environment: DEVELOPMENT, branchName },
    })

    if (result?.branch) {
      log.info(`Created a new API branch '${result.branch.branchName}'`)
      return
    }
  } catch (error) {
    log.debug(error)

    if (error instanceof Error) {
      log.error(error.message)
      return
    }
  }
}
