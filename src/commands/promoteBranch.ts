#!/usr/bin/env node

import { Octokit } from 'octokit'
import { CommandModule } from 'yargs'
import { getClient } from '../lib/client.js'
import { ensureCoreConfig, getBuildEnv } from '../lib/config.js'
import { DEVELOPMENT, PRODUCTION } from '../lib/constants.js'
import { getHeadRefFromCommitPullsList } from '../lib/github.js'
import { log } from '../lib/log.js'
import { fatal } from '../lib/process.js'
import { getCommitInfo, isDefaultBranch } from '../lib/repo.js'

type Args = {
  debug?: boolean
  lookupPr: boolean
  name?: string
  nofail?: boolean
  productionOnly: boolean
}

export async function handler({ name, lookupPr, nofail, productionOnly, ...flags }: Args) {
  try {
    const { adminUrl, apiKey, env, githubToken, projectId } = ensureCoreConfig({ flags })

    if (productionOnly && getBuildEnv(env) !== 'production') {
      log.info(`Not a 'production' environment, skipping`)
      return
    }

    const { gitCommitRef, gitCommitSha, gitRepoName, gitRepoOwner } = await getCommitInfo(env)

    let branchName: string | undefined

    if (name) {
      log.debug('Using name', name)
      branchName = name
    }

    if (lookupPr) {
      log.debug('Using lookupPr', { gitCommitRef, gitCommitSha, gitRepoName, gitRepoOwner })

      if (gitRepoOwner && gitRepoName && gitCommitSha) {
        const octokit = new Octokit({ auth: githubToken })
        const headRef = await getHeadRefFromCommitPullsList(
          octokit,
          gitRepoOwner,
          gitRepoName,
          gitCommitSha,
        )

        if (!headRef) {
          throw new Error('Could not find an associated pull request branch')
        }

        branchName = headRef
      } else {
        throw new Error('Insufficient info to find a pull request branch')
      }
    }

    if (!branchName && gitCommitRef) {
      log.debug('Using found gitCommitRef', gitCommitRef)
      branchName = gitCommitRef
    }

    if (!branchName) {
      throw new Error(`A --name arg must be provided if not used in a repo`)
    }

    log.debug('Proceeding with branchName:', branchName)

    if (isDefaultBranch(branchName)) {
      log.info('Cannot promote the default branch')
      return
    }

    log.info('Promoting API branch...')

    const client = getClient({ adminUrl, apiKey })

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

    fatal(nofail ? 0 : 1)
  }
}

export const promoteBranch: CommandModule<unknown, Args> = {
  command: 'promote-branch',
  describe: 'Promote an API branch to production and delete that branch',
  builder(yargs) {
    return yargs
      .option('name', {
        describe: 'A specific branch name to use, instead of finding a value from your env.',
        type: 'string',
        demand: false,
      })
      .option('lookupPr', {
        alias: ['lookup-pr'],
        describe: 'Lookup a PR matching the SHA on GitHub',
        type: 'boolean',
        demand: false,
        default: false,
      })
      .option('productionOnly', {
        alias: ['production-only'],
        describe: 'Only run this in the production build environment',
        type: 'boolean',
        demand: false,
        default: true,
      })
      .option('nofail', {
        describe: 'Always exit normally',
        type: 'boolean',
        demand: false,
      })
      .option('debug', {
        describe: 'Provide debug logging',
        type: 'boolean',
        demand: false,
      })
      .conflicts('name', 'lookupPr')
  },
  handler,
}
