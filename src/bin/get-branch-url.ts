#!/usr/bin/env node

import { getBranchForDevelopment, tagBranchForDeployment } from '../lib/branches.js'
import { ApiBranch } from '../lib/types.js'
import { getConfig } from '../lib/util.js'

const { buildEnv } = getConfig()

async function main() {
  let branch: ApiBranch | undefined

  if (buildEnv) {
    branch = await tagBranchForDeployment()
  } else {
    branch = await getBranchForDevelopment()
  }

  if (branch) {
    // eslint-disable-next-line no-console
    console.log(branch.graphqlUrl)
  }

  process.exit()
}

main()
