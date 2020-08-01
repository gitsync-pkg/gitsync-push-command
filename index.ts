import {Arguments, CommandModule} from 'yargs';
import {Config} from '@gitsync/config';
import git from "git-cli-wrapper";
import log from "@gitsync/log";
import * as fs from 'fs';
import theme from 'chalk-theme';

interface PushArguments extends Arguments {
  sourceDir: string
  include: string[]
  exclude: string[]
}

let command: CommandModule = {
  handler: () => {
  }
};

command.command = 'push [source-dir]';

command.describe = 'Execute git push command in the relative repositories directory';

command.builder = {
  'source-dir': {
    describe: 'Include only source directory matching the given glob, use --include if require multi globs',
    default: '',
    type: 'string',
  },
  include: {
    describe: 'Include only source directory matching the given glob',
    default: [],
    type: 'array',
  },
  exclude: {
    describe: 'Exclude source directory matching the given glob',
    default: [],
    type: 'array',
  }
};

command.handler = async (argv: PushArguments) => {
  argv.include || (argv.include = []);
  argv.exclude || (argv.exclude = []);

  const config = new Config();
  config.checkFileExist();

  if (argv.sourceDir) {
    // Remove trailing slash, this is useful on OS X and some Linux systems (like CentOS),
    // because they will automatic add trailing slash when completing a directory name by default
    if (argv.sourceDir !== '/' && argv.sourceDir.endsWith('/')) {
      argv.sourceDir = argv.sourceDir.slice(0, -1);
    }
    argv.include.push(argv.sourceDir);
  }

  const repos = config.filterReposBySourceDir(argv.include, argv.exclude);
  for (const repo of repos) {
    log.info(`Push ${theme.info(repo.sourceDir)}`);
    try {

      let repoDir = await config.getRepoDirByRepo(repo);
      if (!fs.existsSync(repoDir)) {
        log.warn(`Target repository directory "${theme.info(repoDir)}" does not exists, `
          + `you may try "${theme.info(`gitsync commit ${repo.sourceDir}`)}" to sync commit before push.`);
        continue;
      }

      let repoInstance = git(repoDir);
      const result = await repoInstance.run(['push', '--all', '--follow-tags', 'origin']);
      log.info(result);

      const tagResult = await repoInstance.run(['push', '--tags']);
      log.info(tagResult);

    } catch (e) {
      process.exitCode = 1;
      log.error(`Push fail: ${e.message}`);
    }
  }

  log.info('Done!');
}

export default command;
