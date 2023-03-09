#!/usr/bin/env node

import inquirer from 'inquirer'
import { getClient } from '../lib/client.js'
import { getConfig } from '../lib/config.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { log, logPrefix } from '../lib/log.js'
import { getCommitInfo, isDefaultBranch } from '../lib/repo.js'

const { apiKey, env, projectId } = getConfig()

const questions = [
  {
    type: 'confirm',
    prefix: logPrefix,
    name: 'shouldCreateBranch',
    message: 'Would you like to create a new API branch?',
    default: true,
  },
]

export function postCheckout() {
  if (!apiKey) {
    return
  }

  inquirer.prompt(questions).then(async ({ shouldCreateBranch }) => {
    if (shouldCreateBranch) {
      try {
        const client = getClient({ apiKey })

        const { gitCommitRef } = await getCommitInfo(env)

        if (!gitCommitRef) {
          log.error(`Could not read your repo`)
          return
        }

        if (await isDefaultBranch(gitCommitRef)) {
          log.error(`Default 'production' branch already exists`)
          return
        }

        const result = await client.createBranch({
          input: { projectId, environment: DEVELOPMENT, branchName: gitCommitRef },
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
  })
}
