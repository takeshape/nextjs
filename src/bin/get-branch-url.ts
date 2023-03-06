#!/usr/bin/env node

import { getBranchForLocal, tagBranchForVercel } from '../lib/branches.js'
import { getConfig } from '../lib/util.js'

const { vercelEnv } = getConfig()

async function main() {
  let graphqlUrl

  if (vercelEnv) {
    graphqlUrl = await tagBranchForVercel()
  } else {
    graphqlUrl = await getBranchForLocal()
  }

  if (graphqlUrl) {
    // eslint-disable-next-line no-console
    console.log(graphqlUrl)
  }

  process.exit()
}

main()
