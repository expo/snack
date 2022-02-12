import isEqual from 'lodash/isEqual';
import { isModulePreloaded } from 'snack-projects';

import { SnackState } from './types';

export type StateObject<T> = {
  [key: string]: T;
};

export function addObjects<T>(
  state: StateObject<T>,
  content: { [key: string]: T },
  filter?: (a: T, b: T) => boolean
): StateObject<T> {
  let newState: StateObject<T> | null = null;
  for (const key in content) {
    if (filter ? filter(content[key], state[key]) : !isEqual(content[key], state[key])) {
      newState = newState ?? { ...state };
      newState[key] = content[key];
    }
  }
  return newState ?? state;
}

export function addObject<T>(
  state: StateObject<T>,
  key: string,
  content: T,
  filter?: (a: T, b: T) => boolean
): StateObject<T> {
  return addObjects(state, { [key]: content }, filter);
}

export function removeObjects<T>(state: StateObject<T>, keys: string[]): StateObject<T> {
  if (!keys.length) return state;
  let newState: StateObject<T> | null = null;
  keys.forEach((key) => {
    if (state[key]) {
      newState = newState ?? { ...state };
      delete newState[key];
    }
  });
  return newState ?? state;
}

export function removeObject<T>(state: StateObject<T>, key: string): StateObject<T> {
  return removeObjects(state, [key]);
}

export function updateObjects<T>(
  state: StateObject<T>,
  content: { [key: string]: T | null },
  compareFn: (a: T, b: T) => boolean = isEqual
): StateObject<T> {
  let newState: StateObject<T> | null = null;
  for (const key in content) {
    const val = content[key];
    if (val === null) {
      if (state[key]) {
        newState = newState ?? { ...state };
        delete newState[key];
      }
    } else if (!compareFn(val, state[key])) {
      newState = newState ?? { ...state };
      newState[key] = val;
    }
  }
  return newState ?? state;
}

export function isBusy(state: SnackState): boolean {
  return (
    !!Object.keys(state.dependencies).find(
      (name) => !state.dependencies[name].handle && !isModulePreloaded(name, state.sdkVersion)
    ) ||
    !!Object.values(state.files).find(
      (file) => file.type === 'ASSET' && typeof file.contents !== 'string'
    )
  );
}

export function isCodeChanged(state: SnackState, prevState: SnackState) {
  return (
    state.dependencies !== prevState.dependencies ||
    state.files !== prevState.files ||
    state.sdkVersion !== prevState.sdkVersion
  );
}

export function isUnsaved(state: SnackState, prevState: SnackState) {
  return (
    state.dependencies !== prevState.dependencies ||
    state.files !== prevState.files ||
    state.sdkVersion !== prevState.sdkVersion ||
    state.name !== prevState.name ||
    state.description !== prevState.description
  );
}
