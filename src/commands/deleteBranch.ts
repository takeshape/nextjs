#!/usr/bin/env node

import { getClient } from '../lib/client.js'
import { getConfig } from '../lib/config.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { log } from '../lib/log.js'
import { getCommitInfo, isDefaultBranch } from '../lib/repo.js'
import { CliFlags } from '../lib/types.js'

export async function deleteBranch({ name }: CliFlags) {
  try {
    const { apiKey, env, projectId } = getConfig()

    if (!projectId) {
      log.error('No projectId found, check your API url')
      process.exit(1)
    }

    if (!apiKey) {
      log.error('No API key found')
      process.exit(1)
    }

    const { gitCommitRef } = await getCommitInfo(env)

    let branchName: string | undefined

    if (name) {
      log.debug('Using user-provided --name')
      branchName = name
    } else if (gitCommitRef) {
      log.debug('Using found gitCommitRef', { gitCommitRef })
      branchName = gitCommitRef
    } else {
      log.error(`A --name arg must be provided if not used in a repo`)
      process.exit(1)
    }

    log.debug('Proceding with branchName:', branchName)

    if (isDefaultBranch(branchName)) {
      log.info(`Cannot delete the 'production' branch`)
      return
    }

    log.info('Deleting API branch...')

    const client = getClient({ apiKey })

    const result = await client.deleteBranch({
      input: { projectId, environment: DEVELOPMENT, branchName },
    })

    if (result?.deletedBranch) {
      log.info(`Deleted the API branch '${result.deletedBranch.branchName}'`)
      return
    }

    log.info('No API branches were deleted')
  } catch (error) {
    log.debug(error)

    if (error instanceof Error) {
      log.error(error.message)
    }

    process.exit(1)
  }
}
