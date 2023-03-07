#!/usr/bin/env node

import { getBranchForDevelopment, tagBranchForDeployment } from '../lib/branches.js'
import { getClient } from '../lib/client.js'
import { ApiBranch } from '../lib/types.js'
import { getConfig } from '../lib/util.js'

const { apiKey, buildEnv } = getConfig()

async function main() {
  if (!apiKey) {
    return
  }

  try {
    const client = getClient({ apiKey })

    let branch: ApiBranch | undefined

    if (buildEnv) {
      branch = await tagBranchForDeployment(client)
    } else {
      branch = await getBranchForDevelopment(client)
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
