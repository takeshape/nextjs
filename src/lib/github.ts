import { RequestError } from '@octokit/request-error'
import { Octokit } from 'octokit'
import { log } from './log.js'

export async function getHeadRefFromCommitPullsList(
  octokit: Octokit,
  owner: string,
  repo: string,
  commitSha: string,
): Promise<string | undefined> {
  try {
    const commitPullsList = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
      owner,
      repo,
      commit_sha: commitSha,
    })

    log.debug(JSON.stringify(commitPullsList, null, 2))

    const commitPull = commitPullsList.data?.[0]

    if (!commitPull?.merged_at) {
      return
    }

    return commitPull.head.ref
  } catch (error) {
    log.debug(error)

    if (error instanceof RequestError) {
      if (error.status === 404) {
        throw new Error(
          'Could not load GitHub PRs. If this is a private repo be sure GITHUB_TOKEN is defined and has proper permissions',
        )
      }
    }

    throw error
  }
}
