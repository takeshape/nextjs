# @takeshape/shape-tools

Tools for working with Next.js-based projects in local dev, and build environments using Vercel, Netlify and GitHub.
Supports the [Penny](https://github.com/takeshape/penny) e-commerce framework.

If you're looking for the full-featured TakeShape CLI you should use `@takeshape/cli` instead:

```
$ npm install @takeshape/cli
```

## Installation

You should use this package installed in a project and then aliased via npm scripts, or in CI, but it's not
intended for global use. You may run into issues if you do.

```sh
$ npm install @takeshape/shape-tools --save-dev
```

## Requirements

This package expects the following variables to be defined in the environment:

- `SHAPE_API_URL` OR `NEXT_PUBLIC_TAKESHAPE_API_URL` - An API URL for your TakeShape project.
- `SHAPE_API_KEY` OR `TAKESHAPE_API_KEY` - A TakeShape API key that can read and write branches. Note, this should be
  private and not exposed to your users or saved in your repo.

## Optional environment variables

- `SHAPE_LOG_LEVEL` - `info`, `debug`, `error`
- `SHAPE_DEFAULT_BRANCH` - Set an alternate default branch name. Otherwise `master` and `main` will both be checked.
- `SHAPE_GITHUB_TOKEN` OR `GITHUB_TOKEN` - Provide a GitHub personal access token for accessing PR information from the GitHub API. Requires
  access to the repo you're working with and permissions sufficient to list PR issues.
- `NO_PROMPT_CREATE_BRANCH` - Create an API branch, without prompting when the git `post-checkout` hook fires. By default this is `'false'`.
- `NO_PROMPT_PROMOTE_BRANCH` - Promote an API branch, without prompting when the git `post-merge` hook fires. By default this is `'false'`.
- `NO_TTY_SHOULD_CREATE_BRANCH` - A flag setting the create branch behavior in non-TTY environments, like the VSCode git tools. By default this is `'true'`.
- `NO_TTY_SHOULD_PROMOTE_BRANCH` - A flag setting the merge branch behavior in non-TTY environments. By default this is `'true'`.

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
