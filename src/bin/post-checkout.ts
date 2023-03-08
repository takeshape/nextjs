#!/usr/bin/env node

import inquirer from 'inquirer'
import { isDefaultBranch } from '../lib/branches.js'
import { getClient } from '../lib/client.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { getHeadBranchName } from '../lib/repo.js'
import { getConfig, logPrefix, logWithPrefix as log } from '../lib/util.js'

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
        log(`Could not read your repo`)
        return
      }

      if (await isDefaultBranch(headBranchName)) {
        log(`Default 'production' branch already exists`)
        return
      }

      const result = await client.createBranch({
        input: { projectId, environment: DEVELOPMENT, branchName: headBranchName },
      })

      if (result?.branch) {
        log(`Created a new API branch '${result.branch.branchName}'`)
        return
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Branch already exists') {
        log('API branch already exists')
        return
      }

      log('Unable to create a new API branch')
    }
  }
})
