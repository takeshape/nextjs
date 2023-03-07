#!/usr/bin/env node

import { getClient } from '../lib/client.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { getConfig, logWithPrefix as log } from '../lib/util.js'

const { apiKey, projectId, buildGitCommitRef } = getConfig()

async function main() {
  if (!apiKey) {
    log('TAKESHAPE_API_KEY not set')
    return
  }

  log('Deleting API branch...')

  const client = getClient({ apiKey })

  const result = await client.deleteBranch({
    input: { projectId, environment: DEVELOPMENT, branchName: buildGitCommitRef },
  })

  if (result?.deletedBranch) {
    log(`Deleted the API branch '${result.deletedBranch.branchName}'`)
    return
  }

  log('No branches were deleted')
}

main()
