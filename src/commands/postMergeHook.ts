#!/usr/bin/env node

import inquirer from 'inquirer'
import { getClient } from '../lib/client.js'
import { getConfig } from '../lib/config.js'
import { DEVELOPMENT, PRODUCTION } from '../lib/constants.js'
import { log, logPrefix } from '../lib/log.js'
import { getMergedBranchName, isDefaultBranch } from '../lib/repo.js'
import { CliFlags } from '../lib/types.js'
import { isInteractive } from '../lib/util.js'

export async function postMergeHook({ name }: CliFlags) {
  try {
    const { apiKey, projectId } = getConfig()

    if (!projectId) {
      log.error('No projectId found, check your API url')
      return
    }

    if (!apiKey) {
      log.error('No API key found')
      return
    }

    if (!isInteractive()) {
      log.debug('Non-interactive shell detected')
      return
    }

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

    log.debug('Proceding with branchName:', branchName)

    const questions = [
      {
        type: 'confirm',
        prefix: logPrefix,
        name: 'shouldMergeBranch',
        message: `Would you like to promote the '${branchName}' API branch?`,
        default: true,
      },
    ]

    const { shouldMergeBranch } = await inquirer.prompt(questions)

    if (!shouldMergeBranch) {
      log.debug('User does not want to merge the branch')
      return
    }

    const productionBranch = await client.getBranch({ projectId, environment: PRODUCTION })

    if (!productionBranch) {
      log.error('Cannot promote the branch, could not get latest version')
      return
    }

    const result = await client.mergeBranch({
      input: {
        projectId,
        deleteMergedHead: true,
        head: {
          environment: DEVELOPMENT,
          branchName,
        },
        base: {
          environment: PRODUCTION,
        },
        target: {
          environment: PRODUCTION,
          version: productionBranch.latestVersion.version,
        },
      },
    })

    if (result?.deletedBranch) {
      log.info(`Promoted and deleted the API branch '${result.deletedBranch.branchName}'`)
      return
    }

    log.info('No API branches were promoted')
  } catch (error) {
    log.debug(error)

    if (error instanceof Error) {
      log.error(error.message)
      return
    }
  }
}
