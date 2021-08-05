import isEqual from 'lodash/isEqual';
import { createStore, combineReducers } from 'redux';

function viewer(state: any = null, action: any) {
  switch (action.type) {
    case 'UPDATE_VIEWER':
      return isEqual(state, action.viewer) ? state : action.viewer;
    default:
      return state;
  }
}

function splitTestSettings(state: any = {}, action: any) {
  switch (action.type) {
    default:
      return state;
  }
}

export default function createStoreWithPreloadedState(state: any) {
  return createStore(
    combineReducers({
      viewer,
      splitTestSettings,
    }),
    state
  );
}
