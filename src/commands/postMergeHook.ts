#!/usr/bin/env node

import inquirer from 'inquirer'
import { getClient } from '../lib/client.js'
import { ensureCoreConfig, getConfig } from '../lib/config.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { log, logPrefix } from '../lib/log.js'
import { getMergedBranchName, isDefaultBranch } from '../lib/repo.js'
import { CliFlags } from '../lib/types.js'
import { promoteBranch } from './promoteBranch.js'

export async function postMergeHook({ name, tty }: CliFlags) {
  try {
    const { apiKey, projectId } = ensureCoreConfig()
    const { noTtyShouldPromoteBranch } = getConfig()

    const mergedBranchName = name ?? (await getMergedBranchName())

    if (!mergedBranchName) {
      log.debug('No merged branch name found')
      return
    }

    if (isDefaultBranch(mergedBranchName)) {
      log.debug('Merged branch is the default branch')
      return
    }

    const client = getClient({ apiKey })

    const existingBranch = await client.getBranch({
      projectId,
      environment: DEVELOPMENT,
      branchName: mergedBranchName,
    })

    if (!existingBranch) {
      log.info(`No existing branch names '${mergedBranchName}'`)
      return
    }

    const { branchName } = existingBranch

    log.debug('Proceeding with branchName:', branchName)

    let shouldPromoteBranch = noTtyShouldPromoteBranch

    if (tty) {
      log.debug('Interactive shell detected, prompting user')
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          prefix: logPrefix,
          name: 'shouldMergeBranch',
          message: `Would you like to promote the '${branchName}' API branch?`,
          default: true,
        },
      ])
      shouldPromoteBranch = answers.shouldMergeBranch
    }

    if (!shouldPromoteBranch) {
      log.debug('User does not want to merge the branch')
      return
    }

    return promoteBranch({ name })
  } catch (error) {
    log.debug(error)

    if (error instanceof Error) {
      log.error(error.message)
    }

    return
  }
}
