# nextjs

Tools for working with Next.js based projects. Supports [penny](https://github.com/takeshape/penny).

## Requirements

This package expects the following variables to be defined in the environment:

- `NEXT_PUBLIC_TAKESHAPE_API_URL` - An API URL for your TakeShape project.
- `TAKESHAPE_API_KEY` - A TakeShape API key that can read and write branches. Note, this should be private and not exposed to your users or saved in your repo.

## Usage

The following binaries are available for use in your npm scripts:

- `takeshape-get-branch-url` - Get an API branch URL
- `takeshape-post-checkout` - Run the git `post-checkout` branch creation prompt
- `takeshape-prepare-env` - Prepare various `.env` files using `-example` source files in the repo.

Some functions are also exported:

- `setProcessBranchUrl` - Set `NEXT_PUBLIC_BRANCH_TAKESHAPE_API_URL` on `process.env`.
