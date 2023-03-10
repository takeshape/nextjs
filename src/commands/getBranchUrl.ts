#!/usr/bin/env node

/**
 * This is a deliberately quiet command, suitable for setting an export ENV_VAR.
 *
 * Note that at LOG_LEVEL = 'debug' this probably won't work.
 */

import { getBranchForLocal, tagBranchForBuild } from '../lib/branches.js'
import { getClient } from '../lib/client.js'
import { getConfig } from '../lib/config.js'
import { log } from '../lib/log.js'
import { BranchWithUrl } from '../lib/types.js'

export async function _getBranchUrl() {
  try {
    const { apiKey, apiUrl, env } = getConfig()

    if (!apiKey) {
      return apiUrl
    }

    const client = getClient({ apiKey })

    let branch: BranchWithUrl | undefined

    if (env === 'local') {
      branch = await getBranchForLocal(client)
    } else {
      branch = await tagBranchForBuild(client)
    }

    return branch?.graphqlUrl ?? apiUrl
  } catch (error) {
    log.debug(error)
    return
  }
}

export async function getBranchUrl() {
  const branchUrl = await _getBranchUrl()
  // eslint-disable-next-line no-console
  console.log(branchUrl)
}
