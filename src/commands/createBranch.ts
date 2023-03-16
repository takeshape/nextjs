#!/usr/bin/env node

import { CommandModule } from 'yargs'
import { getClient } from '../lib/client.js'
import { ensureCoreConfig } from '../lib/config.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { log } from '../lib/log.js'
import { fatal } from '../lib/process.js'
import { getCommitInfo, isDefaultBranch } from '../lib/repo.js'

type Args = {
  name?: string
}

export async function handler({ name }: Args) {
  try {
    const { adminUrl, apiKey, env, projectId } = ensureCoreConfig()
    const { gitCommitRef } = await getCommitInfo(env)

    let branchName: string | undefined

    if (name) {
      log.debug('Using name', name)
      branchName = name
    } else if (gitCommitRef) {
      log.debug('Using found gitCommitRef', gitCommitRef)
      branchName = gitCommitRef
    } else {
      throw new Error(`A --name arg must be provided if not used in a repo`)
    }

    log.debug('Proceeding with branchName:', branchName)

    if (isDefaultBranch(branchName)) {
      log.info(`Default 'production' branch already exists`)
      return
    }

    log.info('Creating API branch...')

    const client = getClient({ adminUrl, apiKey })

    const result = await client.createBranch({
      input: { projectId, environment: DEVELOPMENT, branchName },
    })

    if (result?.branch) {
      log.info(`Created a new API branch '${result.branch.branchName}'`)
      return
    }

    log.info('No API branches were created')
  } catch (error) {
    log.debug(error)

    if (error instanceof Error) {
      log.error(error.message)
    }

    fatal()
  }
}

export const createBranch: CommandModule<unknown, Args> = {
  command: 'create-branch',
  describe: 'Create a new API branch',
  builder: {
    name: {
      describe: 'A specific branch name to use, instead of finding a value from your env',
      type: 'string',
      demand: false,
    },
  },
  handler,
}
