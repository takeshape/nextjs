# @takehsape/shape-tools

Tools primarily for working with Next.js based projects in build and CI environments using Vercel, Netlify and GitHub.
Supports [penny](https://github.com/takeshape/penny).

## Requirements

This package expects the following variables to be defined in the environment:

- `API_URL` OR `NEXT_PUBLIC_TAKESHAPE_API_URL` - An API URL for your TakeShape project.
- `API_KEY` OR `TAKESHAPE_API_KEY` - A TakeShape API key that can read and write branches. Note, this should be
  private and not exposed to your users or saved in your repo.

## Optional environment variables

- `LOG_LEVEL` - `info`, `debug`, `error`
- `DEFAULT_BRANCH` - Set an alternate default branch name. Otherwise `master` and `main` will both be checked.
- `GITHUB_TOKEN` - Provide a GitHub personal access token for accessing PR information from the GitHub API. Requires
  access to the repo you're working with and permissions sufficient to list PR issues.

## Usage

You can use the `shape` binary with the following commands:

- `shape get-branch-url` - Get an API branch URL
- `shape post-checkout-hook` - Run the git `post-checkout` hook branch creation prompt
- `shape post-merge-hook` - Run the git `post-merge` hook branch promote prompt
- `shape create-branch` - Create a branch using `--name` or repo lookup
- `shape delete-branch` - Delete a branch using `--name` or repo lookup
- `shape promote-branch` - Promote a branch using `--name`, repo lookup, or the `--lookup-pr` flag which will search GitHub for a PR that matches the sha.
- `shape prepare-env` - Prepare various `.env` files using `-example` source files in the repo.

Some functions are also exported:

- `setProcessBranchUrl` - Set a var on `process.env` with the branch URL. Defaults to `NEXT_PUBLIC_BRANCH_TAKESHAPE_API_URL`.

## Releases

Run `npm run release` to tag the release. The release will be published when you publish the draft release on GitHub.
