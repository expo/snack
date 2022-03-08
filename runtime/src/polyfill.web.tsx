import '@babel/polyfill';

// reanimated v2.3.x polyfills
// @ts-ignore
global['_stopObservingProgress'] = global['_stopObservingProgress'] || function () {};
// @ts-ignore
global['_startObservingProgress'] = global['_startObservingProgress'] || function () {};
