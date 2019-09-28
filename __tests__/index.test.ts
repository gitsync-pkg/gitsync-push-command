import {createRepo, runCommand} from '@gitsync/test';
import push from '..';
import sync from '@gitsync/sync-command';

describe('push command', () => {
  test('run command', async () => {
    const source = await createRepo();

    const targetOrigin = await createRepo(true);
    const target = await createRepo();
    await target.run(['remote', 'add', 'origin', targetOrigin.dir]);

    await source.commitFile('.gitsync.json', JSON.stringify({
      repos: [
        {
          sourceDir: 'package-name',
          target: target.dir,
        }
      ]
    }));
    await source.commitFile('package-name/test.txt');

    await runCommand(sync, source, {
      target: target.dir,
      sourceDir: 'package-name',
    });

    await runCommand(push, source);

    const result = await targetOrigin.run(['log']);
    expect(result).toContain('test.txt');
  });
});
