#!/usr/bin/env node

import minimist, { ParsedArgs } from 'minimist'
import { isDefaultBranch } from '../lib/branches.js'
import { getClient } from '../lib/client.js'
import { DEVELOPMENT, PRODUCTION } from '../lib/constants.js'
import { getHeadBranchName } from '../lib/repo.js'
import { getConfig, logWithPrefix as log } from '../lib/util.js'

const { apiKey, projectId } = getConfig()

async function main({ name }: ParsedArgs) {
  try {
    if (!apiKey) {
      log('TAKESHAPE_API_KEY not set')
      return
    }

    const headBranchName = await getHeadBranchName()

    let branchName = name

    if (name) {
      branchName = name
    } else if (headBranchName) {
      branchName = headBranchName
    } else {
      log(`A --name arg must be provided if not used in a repo`)
      return
    }

    if (await isDefaultBranch(branchName)) {
      log('Cannot promote the default branch')
      return
    }

    log('Promoting API branch...')

    const client = getClient({ apiKey })

    const branch = await client.getBranch({ projectId, environment: PRODUCTION })

    if (!branch) {
      log('Cannot promote the branch, could not get latest version')
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
          version: branch.latestVersion.version,
        },
      },
    })

    if (result?.deletedBranch) {
      log(`Promoted and deleted the API branch '${result.deletedBranch.branchName}'`)
      return
    }

    log('No API branches were promoted')
  } catch (error) {
    log('Unable to promote the API branch')
  }
}

main(minimist(process.argv.slice(2)))
