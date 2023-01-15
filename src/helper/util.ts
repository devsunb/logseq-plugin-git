// noinspection JSIgnoredPromiseFromCall

import { ACTIVE_STYLE, HIDE_POPUP_STYLE, INACTIVE_STYLE, SHOW_POPUP_STYLE } from './constants';
import { isChanged } from './git';

export const checkStatus = async () => {
  if (await isChanged()) setPluginStyle(ACTIVE_STYLE);
  else setPluginStyle(INACTIVE_STYLE);
};

let pluginStyle = '';

export const setPluginStyle = (style: string) => {
  pluginStyle = style;
  logseq.provideStyle({ key: 'git', style });
};

export const getPluginStyle = () => pluginStyle;

export const showPopup = () => {
  const _style = getPluginStyle();
  setPluginStyle(`${_style}\n${SHOW_POPUP_STYLE}`);
};

export const hidePopup = () => {
  const _style = getPluginStyle();
  setPluginStyle(`${_style}\n${HIDE_POPUP_STYLE}`);
};

export const debounce = (fn, wait: number = 100, environment?: any) => {
  let timer = null;
  return function() {
    // @ts-ignore
    const context = environment || this;
    const args = arguments;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    // @ts-ignore
    timer = setTimeout(() => fn.apply(context, args), wait);
  };
};
