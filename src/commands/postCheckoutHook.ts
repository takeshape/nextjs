#!/usr/bin/env node

import inquirer from 'inquirer'
import { getClient } from '../lib/client.js'
import { getConfig } from '../lib/config.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { log, logPrefix } from '../lib/log.js'
import { getCommitInfo, isDefaultBranch } from '../lib/repo.js'
import { CliFlags } from '../lib/types.js'

export async function postCheckoutHook({ name, tty }: CliFlags) {
  try {
    const { apiKey, env, noTtyShouldCreateBranch, projectId } = getConfig()

    if (!projectId) {
      log.error('No projectId found, check your API url')
      return
    }

    if (!apiKey) {
      log.error('No API key found')
      return
    }

    let shouldCreateBranch = noTtyShouldCreateBranch

    if (tty) {
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
