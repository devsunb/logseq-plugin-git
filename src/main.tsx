// noinspection JSIgnoredPromiseFromCall

import '@logseq/libs';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BUTTONS, INACTIVE_STYLE, LOADING_STYLE, SETTINGS_SCHEMA } from './helper/constants';
import { commit, pull, push } from './helper/git';
import {
  checkStatusWithDebounce,
  debounce,
  hidePopup,
  isChanged,
  isRepoUpToDate,
  setPluginStyle,
  showPopup,
} from './helper/util';
import './index.css';

const isDevelopment = import.meta.env.DEV;

if (isDevelopment) {
  renderApp('browser');
} else {
  console.log('=== logseq-plugin-git loaded ===');
  logseq.ready(() => {
    const operations = {
      pull: debounce(async () => {
        setPluginStyle(LOADING_STYLE);
        hidePopup();
        if (!(await isRepoUpToDate())) {
          logseq.App.showMsg('Fix conflict before pull', 'error');
        } else {
          await pull();
        }
        setPluginStyle(INACTIVE_STYLE);
      }),
      commitAndPush: debounce(async () => {
        setPluginStyle(LOADING_STYLE);
        hidePopup();
        if (await isChanged()) {
          const res = await commit('Saved by Logseq');
          if (res.exitCode === 0) await push();
        }
        setPluginStyle(INACTIVE_STYLE);
      }),
      showPopup: debounce(async () => {
        console.log('[faiz:] === showPopup click');
        showPopup();
      }),
      hidePopup: debounce(() => {
        console.log('[faiz:] === hidePopup click');
        hidePopup();
      }),
    };

    logseq.provideModel(operations);
    logseq.App.registerUIItem('toolbar', {
      key: 'git',
      template:
        '<a data-on-click="showPopup" class="button"><i class="ti ti-brand-git"></i></a><div id="plugin-git-content-wrapper"></div>',
    });
    logseq.useSettingsSchema(SETTINGS_SCHEMA);
    setTimeout(() => {
      const buttons = (logseq.settings?.buttons as string[])?.map((title) => BUTTONS.find((b) => b.title === title));
      if (buttons?.length)
        logseq.provideUI({
          key: 'git-popup',
          path: '#plugin-git-content-wrapper',
          template: `
            <div class='plugin-git-mask' data-on-click='hidePopup'></div>
            <div class='plugin-git-popup flex flex-col'>
              ${buttons
                .map(
                  (button) =>
                    '<button data-on-click="' +
                    button?.event +
                    '" class="ui__button bg-indigo-600 hover:bg-indigo-700 focus:border-indigo-700 active:bg-indigo-700 text-center text-sm p-1" style="margin: 4px 0; color: #fff;">' +
                    button?.title +
                    '</button>'
                )
                .join('\n')}
            </div>
          `,
        });
    }, 1000);

    logseq.App.onRouteChanged(async () => checkStatusWithDebounce());
    if (logseq.settings?.checkWhenDBChanged) logseq.DB.onChanged(() => checkStatusWithDebounce());
    if (logseq.settings?.autoPull) operations.pull();
    checkStatusWithDebounce();

    if (top) {
      top.document?.addEventListener('visibilitychange', async () => {
        switch (top?.document?.visibilityState) {
          case 'visible':
            if (logseq.settings?.autoPull) operations.pull();
            break;
          case 'hidden':
            if (logseq.settings?.autoPush) operations.commitAndPush();
            break;
        }
      });
    }

    logseq.App.registerCommandPalette(
      {
        key: 'logseq-plugin-git:push',
        label: 'Push',
        keybinding: { binding: 'mod+s', mode: 'global' },
      },
      () => operations.commitAndPush()
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
