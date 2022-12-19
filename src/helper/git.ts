// https://logseq.github.io/plugins/interfaces/IAppProxy.html#execGitCommand
import type { IGitResult } from '@logseq/libs/dist/LSPlugin.user';

export const status = async (): Promise<IGitResult> => {
  const res = await logseq.Git.execCommand(['status', '--porcelain']);
  console.log('[faiz:] === git status', res);
  if (res.exitCode !== 0) logseq.App.showMsg(`Git status failed\n${res.stderr}`, 'error');
  return res;
};

export const pull = async (): Promise<IGitResult> => {
  const res = await logseq.Git.execCommand(['pull']);
  console.log('[faiz:] === git pull', res);
  if (res.exitCode !== 0) logseq.App.showMsg(`Git pull failed\n${res.stderr}`, 'error');
  return res;
};

export const commit = async (message: string): Promise<IGitResult> => {
  await logseq.Git.execCommand(['add', '.']);
  const res = await logseq.Git.execCommand(['commit', '-m', message]);
  console.log('[faiz:] === git commit', res);
  if (res.exitCode !== 0) logseq.App.showMsg(`Git commit failed\n${res.stdout || res.stderr}`, 'error');
  return res;
};

export const push = async (): Promise<IGitResult> => {
  const res = await logseq.Git.execCommand(['push']);
  console.log('[faiz:] === git push', res);
  if (res.exitCode !== 0) logseq.App.showMsg(`Git push failed\n${res.stderr}`, 'error');
  return res;
};
