#!/usr/bin/env node

import { Octokit } from 'octokit'
import { getClient } from '../lib/client.js'
import { ensureCoreConfig, getBuildEnv, getConfig } from '../lib/config.js'
import { DEVELOPMENT, PRODUCTION } from '../lib/constants.js'
import { getHeadRefFromCommitPullsList } from '../lib/github.js'
import { log } from '../lib/log.js'
import { fatal } from '../lib/process.js'
import { getCommitInfo, isDefaultBranch } from '../lib/repo.js'
import { CliFlags } from '../lib/types.js'

export async function promoteBranch({ name, lookupPr, productionOnly }: CliFlags) {
  try {
    const { apiKey, env, projectId } = ensureCoreConfig()
    const { githubToken } = getConfig()

    if (productionOnly && getBuildEnv(env) !== 'production') {
      log.info(`Not a 'production' environment, skipping`)
      return
    }

    const { gitCommitRef, gitCommitSha, gitRepoName, gitRepoOwner } = await getCommitInfo(env)

    let branchName: string

    if (lookupPr) {
      log.debug('Using --lookup-pr', { gitCommitRef, gitCommitSha, gitRepoName, gitRepoOwner })

      if (gitRepoOwner && gitRepoName && gitCommitSha) {
        const octokit = new Octokit({ auth: githubToken })
        const headRef = await getHeadRefFromCommitPullsList(
          octokit,
          gitRepoOwner,
          gitRepoName,
          gitCommitSha,
        )

        if (!headRef) {
          throw new Error('Could not find a PR ref')
        }

        branchName = headRef
      } else {
        throw new Error('Insufficient info to find a PR ref')
      }
    } else {
      if (name) {
        log.debug('Using user-provided --name', name)
        branchName = name
      } else if (gitCommitRef) {
        log.debug('Using found gitCommitRef', gitCommitRef)
        branchName = gitCommitRef
      } else {
        throw new Error(`A --name arg must be provided if not used in a repo`)
      }
    }

    log.debug('Proceeding with branchName:', branchName)

    if (isDefaultBranch(branchName)) {
      log.info('Cannot promote the default branch')
      return
    }

    log.info('Promoting API branch...')

    const client = getClient({ apiKey })

    const productionBranch = await client.getBranch({ projectId, environment: PRODUCTION })

    if (!productionBranch) {
      throw new Error('Cannot promote the branch, could not get latest version')
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
    }

    fatal()
  }
}
