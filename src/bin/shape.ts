#!/usr/bin/env node

import * as dotenv from 'dotenv'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { createBranch } from '../commands/createBranch.js'
import { deleteBranch } from '../commands/deleteBranch.js'
import { postCheckoutHook } from '../commands/postCheckoutHook.js'
import { postMergeHook } from '../commands/postMergeHook.js'
import { prepareEnv } from '../commands/prepareEnv.js'
import { promoteBranch } from '../commands/promoteBranch.js'

dotenv.config()
dotenv.config({ path: '.env.local' })

yargs(hideBin(process.argv))
  .command(createBranch)
  .command(deleteBranch)
  .command(promoteBranch)
  .command(postCheckoutHook)
  .command(postMergeHook)
  .command(prepareEnv).argv
