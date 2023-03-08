#!/usr/bin/env node

import minimist, { ParsedArgs } from 'minimist'
import { isDefaultBranch } from '../lib/branches.js'
import { getClient } from '../lib/client.js'
import { getConfig } from '../lib/config.js'
import { DEVELOPMENT, PRODUCTION } from '../lib/constants.js'
import { log } from '../lib/log.js'
import { getHeadBranchName } from '../lib/repo.js'

const { apiKey, projectId } = getConfig()

async function main({ name }: ParsedArgs) {
  try {
    if (!apiKey) {
      log.error('TAKESHAPE_API_KEY not set')
      return
    }

    const headBranchName = await getHeadBranchName()

    let branchName = name

    if (name) {
      branchName = name
    } else if (headBranchName) {
      branchName = headBranchName
    } else {
      log.error(`A --name arg must be provided if not used in a repo`)
      return
    }

    if (await isDefaultBranch(branchName)) {
      log.error('Cannot promote the default branch')
      return
    }

    log.info('Promoting API branch...')

    const client = getClient({ apiKey })

    const branch = await client.getBranch({ projectId, environment: PRODUCTION })

    if (!branch) {
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
          version: branch.latestVersion.version,
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

main(minimist(process.argv.slice(2)))
