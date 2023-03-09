#!/usr/bin/env node

import * as dotenv from 'dotenv'
import meow from 'meow'
import { createBranch } from '../commands/createBranch.js'
import { deleteBranch } from '../commands/deleteBranch.js'
import { getBranchUrl } from '../commands/getBranchUrl.js'
import { postCheckoutHook } from '../commands/postCheckoutHook.js'
import { postMergeHook } from '../commands/postMergeHook.js'
import { prepareEnv } from '../commands/prepareEnv.js'
import { promoteBranch } from '../commands/promoteBranch.js'
import { log } from '../lib/log.js'
import { CliFlags } from '../lib/types.js'
import { isInteractive } from '../lib/util.js'

dotenv.config()
dotenv.config({ path: '.env.local' })

const helpMessage = `
  Usage
    $ shape <command> <flags>

  Commands
    create-branch
    promote-branch
    delete-branch
    get-branch-url
    post-checkout-hook
    post-merge-hook
    prepare-env

  Flags
    --name             A branch name. Works with most commands and will override any branch-finding.
    --lookup-pr        Use a SHA to lookup a branch name. promote-branch only.
    --production-only  Only run the command in a production environment. promote-branch only.
    --no-tty           If you're running the interactive hooks in a non-interactive environment set this.

  Examples
    $ shape create-branch --name my_branch
    $ shape promote-branch --lookup-pr --production-only
`

const cli = meow(helpMessage, {
  importMeta: import.meta,
  flags: {
    name: {
      type: 'string',
    },
    lookupPr: {
      type: 'boolean',
    },
    tty: {
      type: 'boolean',
      default: isInteractive(),
    },
    productionOnly: {
      type: 'boolean',
    },
  },
})

function main(command: string | undefined, flags: CliFlags) {
  switch (command) {
    case 'create-branch':
      createBranch(flags)
      return
    case 'promote-branch':
      promoteBranch(flags)
      return
    case 'delete-branch':
      deleteBranch(flags)
      return
    case 'get-branch-url':
      getBranchUrl()
      return
    case 'post-checkout-hook':
      postCheckoutHook(flags)
      return
    case 'post-merge-hook':
      postMergeHook(flags)
      return
    case 'prepare-env':
      prepareEnv()
      return
    default:
      log.info('Unrecognized command')
  }
}

main(cli.input[0], cli.flags)
