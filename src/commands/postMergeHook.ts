#!/usr/bin/env node

import inquirer from 'inquirer'
import { CommandModule } from 'yargs'
import { getClient } from '../lib/client.js'
import { ensureCoreConfig } from '../lib/config.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { runIfConfigured } from '../lib/handler.js'
import { log, logPrefix } from '../lib/log.js'
import { getMergedBranchName, isDefaultBranch } from '../lib/repo.js'
import { isInteractive } from '../lib/util.js'
import { handler as promoteBranch } from './promoteBranch.js'

type Args = {
  name?: string
  tty: boolean
}

export async function handler({ name, ...flags }: Args) {
  try {
    const { adminUrl, apiKey, projectId, noTtyShouldPromoteBranch, promptPromoteBranch, tty } =
      ensureCoreConfig({ flags })

    const mergedBranchName = name ?? (await getMergedBranchName())

    if (!mergedBranchName) {
      log.debug('No merged branch name found')
      return
    }

    if (isDefaultBranch(mergedBranchName)) {
      log.debug('Merged branch is the default branch')
      return
    }

    const client = getClient({ adminUrl, apiKey })

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

    if (tty && promptPromoteBranch) {
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

    promoteBranch({ name: branchName, lookupPr: false, productionOnly: false })
  } catch (error) {
    log.debug(error)

    if (error instanceof Error) {
      log.error(error.message)
    }

    return
  }
}

export const postMergeHook: CommandModule<unknown, Args> = {
  command: 'post-merge-hook',
  describe: 'Typically invoked by the git post-merge hook',
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
  handler: runIfConfigured<Args>(handler),
}
