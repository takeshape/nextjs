#!/usr/bin/env node

import { getBranchForLocal, tagBranchForBuild, tagBranchForCi } from '../lib/branches.js'
import { getClient } from '../lib/client.js'
import { getConfig } from '../lib/config.js'
import { log } from '../lib/log.js'
import { BranchWithUrl } from '../lib/types.js'

const { apiKey, env } = getConfig()

async function main() {
  if (!apiKey) {
    return
  }

  try {
    const client = getClient({ apiKey })

    let branch: BranchWithUrl | undefined

    if (env === 'build') {
      branch = await tagBranchForBuild(client)
    }

    if (env === 'ci') {
      branch = await tagBranchForCi(client)
    }

    if (env === 'local') {
      branch = await getBranchForLocal(client)
    }

    if (branch) {
      // eslint-disable-next-line no-console
      console.log(branch.graphqlUrl)
    }
  } catch (error) {
    log.debug(error)
  }
}

main()
