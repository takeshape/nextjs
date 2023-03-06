#!/usr/bin/env node

import inquirer from 'inquirer'
import { getClient } from '../lib/client.js'
import { DEVELOPMENT_ENUM } from '../lib/constants.js'
import { getBranchInfo } from '../lib/repo.js'
import { getConfig, logPrefix, logWithPrefix as log } from '../lib/util.js'

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
    const takeshape = getClient()
    const { projectId } = getConfig()

    const branchInfo = await getBranchInfo()

    if (!branchInfo) {
      log(`Could not read your repo`)
      return
    }

    const { headBranchName, isDefaultBranch } = branchInfo

    if (isDefaultBranch) {
      log('Default production branch already exists')
      return
    }

    const result = await takeshape.createBranch({
      input: { projectId, environment: DEVELOPMENT_ENUM, branchName: headBranchName },
    })

    if (result?.branch) {
      log(`Created a new API branch '${result.branch.branchName}'`)
      return
    }

    log('Unable to create a new API branch')
  }
})
