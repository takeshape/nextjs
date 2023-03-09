#!/usr/bin/env node

import { Octokit } from 'octokit'
import { getClient } from '../lib/client.js'
import { getBuildEnv, getConfig } from '../lib/config.js'
import { DEVELOPMENT, PRODUCTION } from '../lib/constants.js'
import { getHeadRefFromCommitPullsList } from '../lib/github.js'
import { log } from '../lib/log.js'
import { getCommitInfo, isDefaultBranch } from '../lib/repo.js'
import { CliFlags } from '../lib/types.js'

export async function promoteBranch({ name, lookupPr, productionOnly }: CliFlags) {
  try {
    const { apiKey, env, githubToken, projectId } = getConfig()

    const buildEnv = getBuildEnv(env)

    if (productionOnly && buildEnv !== 'production') {
      log.info(`Not a 'production' environment, skipping`)
      return
    }

    if (!apiKey) {
      log.error('TAKESHAPE_API_KEY not set')
      return
    }

    const { gitCommitRef, gitCommitSha, gitRepoName, gitRepoOwner } = await getCommitInfo(env)

    let branchName: string

    if (lookupPr) {
      log.debug('Using lookupPr branch', { gitCommitRef, gitCommitSha, gitRepoName, gitRepoOwner })

      if (gitRepoOwner && gitRepoName && gitCommitSha) {
        const octokit = new Octokit({ auth: githubToken })
        const headRef = await getHeadRefFromCommitPullsList(
          octokit,
          gitRepoOwner,
          gitRepoName,
          gitCommitSha,
        )

        if (!headRef) {
          log.error('Could not find a PR ref')
          return
        }

        branchName = headRef
      } else {
        log.error('Insufficient info to find a PR ref')
        return
      }
    } else {
      if (name) {
        log.debug('Using user-provided --name')
        branchName = name
      } else if (gitCommitRef) {
        log.debug('Using found gitCommitRef', { gitCommitRef })
        branchName = gitCommitRef
      } else {
        log.error(`A --name arg must be provided if not used in a repo`)
        return
      }
    }

    log.debug('Proceding with branchName:', branchName)

    if (isDefaultBranch(branchName)) {
      log.error('Cannot promote the default branch')
      return
    }

    log.info('Promoting API branch...')

    const client = getClient({ apiKey })

    const productionBranch = await client.getBranch({ projectId, environment: PRODUCTION })

    if (!productionBranch) {
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
          version: productionBranch.latestVersion.version,
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
