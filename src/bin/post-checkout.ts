#!/usr/bin/env node

import inquirer from 'inquirer'
import { isDefaultBranch } from '../lib/branches.js'
import { getClient } from '../lib/client.js'
import { getConfig } from '../lib/config.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { log, logPrefix } from '../lib/log.js'
import { getHeadBranchName } from '../lib/repo.js'

const { apiKey, projectId } = getConfig()

if (!apiKey) {
  process.exit()
}

type Questions = {
  shouldCreateBranch: boolean
}

const questions = [
  {
    type: 'confirm',
    prefix: logPrefix,
    name: 'shouldCreateBranch',
    message: 'Would you like to create a new API branch?',
    default: true,
  },
]

inquirer.prompt(questions).then(async ({ shouldCreateBranch }: Questions) => {
  if (shouldCreateBranch) {
    try {
      const client = getClient({ apiKey })

      const headBranchName = await getHeadBranchName()

      if (!headBranchName) {
        log.error(`Could not read your repo`)
        return
      }

      if (await isDefaultBranch(headBranchName)) {
        log.error(`Default 'production' branch already exists`)
        return
      }

      const result = await client.createBranch({
        input: { projectId, environment: DEVELOPMENT, branchName: headBranchName },
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
