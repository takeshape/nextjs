#!/usr/bin/env node

import { getBranchForLocal, tagBranchForBuild, tagBranchForCi } from '../lib/branches.js'
import { getClient } from '../lib/client.js'
import { BranchWithUrl } from '../lib/types.js'
import { getConfig } from '../lib/util.js'

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
  } catch {
    // Just eat the error and let it fallback
  }
}

main()
