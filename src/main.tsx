// noinspection JSIgnoredPromiseFromCall

import '@logseq/libs';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BUTTONS, LOADING_STYLE, SETTINGS_SCHEMA } from './helper/constants';
import { commit, isChanged, isRepoUpToDate, pull, push } from './helper/git';
import { checkStatus, debounce, hidePopup, setPluginStyle, showPopup } from './helper/util';
import './index.css';

const isDevelopment = import.meta.env.DEV;

if (isDevelopment) {
  renderApp('browser');
} else {
  console.log('=== logseq-plugin-git loaded ===');
  logseq.ready(() => {
    logseq.useSettingsSchema(SETTINGS_SCHEMA);

    let operating = false;
    const pullOperation = async () => {
      if (operating) return;
      setPluginStyle(LOADING_STYLE);
      operating = true;
      if (!(await isRepoUpToDate())) await pull();
      await checkStatus();
      operating = false;
    };
    const pushOperation = async () => {
      if (operating || !(await isChanged())) return;
      setPluginStyle(LOADING_STYLE);
      operating = true;
      if (!(await isRepoUpToDate())) {
        const res = await pull();
        if (res.exitCode !== 0) {
          await checkStatus();
          operating = false;
          return;
        }
      }
      const res = await commit();
      if (res.exitCode !== 0) {
        await checkStatus();
        operating = false;
        return;
      }
      await push();
      await checkStatus();
      operating = false;
    };
    const operations = {
      check: debounce(async () => {
        if (!operating) await checkStatus();
      }),
      pull: debounce(async () => {
        hidePopup();
        await pullOperation();
      }),
      commitAndPush: debounce(async () => {
        hidePopup();
        await pushOperation();
      }),
      showPopup: debounce(async () => {
        showPopup();
      }),
      hidePopup: debounce(() => {
        hidePopup();
      })
    };
    logseq.provideModel(operations);

    logseq.App.registerUIItem('toolbar', {
      key: 'git',
      template:
        '<a data-on-click="showPopup" class="button"><i class="ti ti-brand-git"></i></a><div id="plugin-git-content-wrapper"></div>'
    });
    setTimeout(() => {
      const buttons = (logseq.settings?.buttons as string[])?.map((title) => BUTTONS.find((b) => b.title === title));
      if (buttons?.length)
        logseq.provideUI({
          key: 'git-popup',
          path: '#plugin-git-content-wrapper',
          template: `
            <div class='plugin-git-mask' data-on-click='hidePopup'></div>
            <div class='plugin-git-popup flex flex-col'>
              ${buttons.map((button) => '<button data-on-click="' + button?.event + '" class="ui__button bg-indigo-600 hover:bg-indigo-700 focus:border-indigo-700 active:bg-indigo-700 text-center text-sm p-1" style="margin: 4px 0; color: #fff;">' + button?.title + '</button>').join('\n')}
            </div>
          `
        });
    }, 1000);
    hidePopup();

    logseq.App.onRouteChanged(operations.check);
    logseq.DB.onChanged(operations.check);
    if (logseq.settings?.autoPull) pullOperation();
    else operations.check();

    if (top) {
      top.document?.addEventListener('visibilitychange', async () => {
        const v = top?.document?.visibilityState;
        if (v === 'visible' && logseq.settings?.autoPull) await pullOperation();
        else if (v === 'hidden' && logseq.settings?.autoPush) await pushOperation();
      });
    }

    logseq.App.registerCommandPalette(
      {
        key: 'logseq-plugin-git:push',
        label: 'Push',
        keybinding: { binding: 'mod+s', mode: 'global' }
      },
      pushOperation
    );
  });
}

function renderApp(env: string) {
  ReactDOM.render(
    <React.StrictMode>
      <App env={env} />
    </React.StrictMode>,
    document.getElementById('root')
  );
}
