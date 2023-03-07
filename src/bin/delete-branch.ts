#!/usr/bin/env node

import minimist from 'minimist'
import { getClient } from '../lib/client.js'
import { DEVELOPMENT } from '../lib/constants.js'
import { getConfig, logWithPrefix as log } from '../lib/util.js'

const { apiKey, projectId } = getConfig()
const argv = minimist(process.argv.slice(2))
const branchName = argv['name']

async function main() {
  if (!apiKey) {
    log('TAKESHAPE_API_KEY not set')
    return
  }

  if (!branchName) {
    log('Must provide a --name')
  }

  try {
    log('Deleting API branch...')

    const client = getClient({ apiKey })

    const result = await client.deleteBranch({
      input: { projectId, environment: DEVELOPMENT, branchName },
    })

    if (result?.deletedBranch) {
      log(`Deleted the API branch '${result.deletedBranch.branchName}'`)
      return
    }

    log('No API branches were deleted')
  } catch (error) {
    log('Unable to delete the API branch')
  }
}

main()
