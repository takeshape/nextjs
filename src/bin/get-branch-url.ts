#!/usr/bin/env node

import { getBranchForLocal, tagBranchForVercel } from '../lib/branches.js'
import { ApiBranch } from '../lib/types.js'
import { getConfig } from '../lib/util.js'

const { vercelEnv } = getConfig()

async function main() {
  let branch: ApiBranch | undefined

  if (vercelEnv) {
    branch = await tagBranchForVercel()
  } else {
    branch = await getBranchForLocal()
  }

  if (branch) {
    // eslint-disable-next-line no-console
    console.log(branch.graphqlUrl)
  }

  process.exit()
}

main()
