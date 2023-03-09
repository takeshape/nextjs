#!/usr/bin/env node

import { getClient } from '../lib/client.js'
import { getConfig } from '../lib/config.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { log } from '../lib/log.js'
import { getCommitInfo, isDefaultBranch } from '../lib/repo.js'
import { CliFlags } from '../lib/types.js'

const { apiKey, env, projectId } = getConfig()

export async function createBranch({ name }: CliFlags) {
  try {
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
      log.error('Default production branch already exists')
      return
    }

    log.info('Creating API branch...')

    const client = getClient({ apiKey })

    const result = await client.createBranch({
      input: { projectId, environment: DEVELOPMENT, branchName },
    })

    if (result?.branch) {
      log.info(`Created the API branch '${result.branch.branchName}'`)
      return
    }

    log.info('No API branches were created')
  } catch (error) {
    log.debug(error)

    if (error instanceof Error) {
      log.error(error.message)
      return
    }
  }
}
