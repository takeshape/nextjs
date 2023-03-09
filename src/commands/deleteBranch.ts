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

    if (!apiKey) {
      log.error('TAKESHAPE_API_KEY not set')
      return
    }

    const { gitCommitRef } = await getCommitInfo(env)

    let branchName = name

    if (name) {
      branchName = name
    } else if (gitCommitRef) {
      branchName = gitCommitRef
    } else {
      log.error(`A --name arg must be provided if not used in a repo`)
      return
    }

    if (await isDefaultBranch(branchName)) {
      log.error(`Cannot delete the 'production' branch`)
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
      return
    }
  }
}
