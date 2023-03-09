import { Octokit } from 'octokit'

export async function getHeadRefFromCommitPullsList(
  octokit: Octokit,
  owner: string,
  repo: string,
  commitSha: string,
): Promise<string | undefined> {
  const commitPullsList = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    commit_sha: commitSha,
  })

  const commitPull = commitPullsList.data?.[0]

  if (!commitPull?.merged_at) {
    return
  }

  return commitPull.head.ref
}
