// https://logseq.github.io/plugins/interfaces/IAppProxy.html#execGitCommand
import type { IGitResult } from '@logseq/libs/dist/LSPlugin.user';

const getCommand = (args: string[]): (() => Promise<IGitResult>) => {
  return async () => {
    const res = await logseq.Git.execCommand(args);
    const s = args.join(' ');
    console.log(`[faiz:] === git ${s}`, res);
    if (res.exitCode !== 0) logseq.App.showMsg(`Git ${s} failed\n${res.stderr}`, 'error');
    return res;
  };
};

export const isRepoUpToDate = async () => {
  await logseq.Git.execCommand(['fetch']);
  const local = await logseq.Git.execCommand(['rev-parse', 'HEAD']);
  const remote = await logseq.Git.execCommand(['rev-parse', '@{u}']);
  return local.stdout === remote.stdout;
};

export const isChanged = async () => {
  const res = await logseq.Git.execCommand(['status', '--porcelain']);
  if (res.exitCode !== 0) logseq.App.showMsg(`Git status failed\n${res.stderr}`, 'error');
  return res.stdout !== '';
};

export const commit = async (message = 'Saved by Logseq'): Promise<IGitResult> => {
  await logseq.Git.execCommand(['add', '.']);
  const res = await logseq.Git.execCommand(['commit', '-m', message]);
  console.log('[faiz:] === git commit', res);
  if (res.exitCode !== 0 && !res.stdout.endsWith('nothing to commit, working tree clean\n'))
    logseq.App.showMsg(`Git commit failed\n${res.stdout || res.stderr}`, 'error');
  return res;
};

export const pull = getCommand(['pull', '--no-rebase', 'origin', 'main']);
export const push = getCommand(['push', 'origin', 'main']);
