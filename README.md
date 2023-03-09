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

The following binaries are available for use in your npm scripts:

- `takeshape-get-branch-url` - Get an API branch URL
- `takeshape-post-checkout` - Run the git `post-checkout` branch creation prompt
- `takeshape-prepare-env` - Prepare various `.env` files using `-example` source files in the repo.

Some functions are also exported:

- `setProcessBranchUrl` - Set `NEXT_PUBLIC_BRANCH_TAKESHAPE_API_URL` on `process.env`.

## Releases

Run `npm run release` to tag the release. The release will be published when you publish the draft release on GitHub.
