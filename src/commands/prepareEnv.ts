#!/usr/bin/env node

import inquirer from 'inquirer'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { CommandModule } from 'yargs'
import { getConfig } from '../lib/config.js'
import { runIfConfigured } from '../lib/handler.js'
import { log } from '../lib/log.js'
import { isInteractive } from '../lib/util.js'

type Args = {
  debug?: boolean
  tty: boolean
}

const files = {
  env: {
    src: './.env-example',
    dest: './.env',
  },
  envTest: {
    src: './.env.test-example',
    dest: './.env.test',
  },
  envLocal: {
    src: './.env.local-example',
    dest: './.env.local',
  },
}

const questions = [
  {
    type: 'confirm',
    name: 'overwriteEnvFile',
    message: 'Overwrite existing .env file?',
    default: false,
    when() {
      return fs.existsSync(files.env.dest)
    },
  },
  {
    type: 'confirm',
    name: 'overwriteEnvTestFile',
    message: 'Overwrite existing .env.test file?',
    default: false,
    when() {
      return fs.existsSync(files.envTest.dest)
    },
  },
  {
    type: 'confirm',
    name: 'overwriteEnvLocalFile',
    message: 'Overwrite existing .env.local file?',
    default: false,
    when() {
      return fs.existsSync(files.envLocal.dest)
    },
  },
]

export async function handler(flags: Args) {
  const { tty } = getConfig({ flags })

  let answers: Record<string, boolean> = {}

  if (tty) {
    answers = await inquirer.prompt(questions)
  }

  if (answers['overwriteEnvFile'] === true || answers['overwriteEnvFile'] === undefined) {
    log.info('Creating new .env file')
    await fsp.copyFile(files.env.src, files.env.dest)
  }

  if (answers['overwriteEnvTestFile'] === true || answers['overwriteEnvTestFile'] === undefined) {
    log.info('Creating new .env.test file')
    await fsp.copyFile(files.envTest.src, files.envTest.dest)
  }

  if (answers['overwriteEnvLocalFile'] === true || answers['overwriteEnvLocalFile'] === undefined) {
    log.info('Creating new .env.local file')
    await fsp.copyFile(files.envLocal.src, files.envLocal.dest)
  }
}

export const prepareEnv: CommandModule<unknown, Args> = {
  command: 'prepare-env',
  describe: 'Prepare the .env files for your project',
  builder: {
    tty: {
      describe: 'Does your terminal have tty support?',
      type: 'boolean',
      demand: false,
      default: isInteractive(),
    },
    debug: {
      describe: 'Provide debug logging',
      type: 'boolean',
      demand: false,
    },
  },
  handler: runIfConfigured<Args>(handler),
}
