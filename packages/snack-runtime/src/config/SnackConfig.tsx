import { createContext, useRef, type PropsWithChildren, ComponentType } from 'react';

import { type ExpoRouterEntryProps } from '../NativeModules/ExpoRouter';

export type SnackConfig = {
  /** All "linked" modules which are "passed through" to the runtime context */
  modules: Record<string, ReturnType<NodeRequire>>;
  /** Experimental configuration options */
  experimental?: {
    /** The custom entry point, generated when using `expo-router` in the Snack */
    expoRouterEntry?: ComponentType<ExpoRouterEntryProps>;
  };
};

export const SnackRuntimeContext = createContext<SnackConfig>({
  modules: {},
});

type SnackConfigProviderProps = PropsWithChildren<{
  config: SnackConfig;
}>;

/**
 * Configure the Snack runtime with custom settings.
 * Note, once the config is set on initial render, it cannot be changed.
 */
export function SnackRuntimeProvider({ config, children }: SnackConfigProviderProps) {
  const frozenConfig = useRef(config);

  if (frozenConfig.current !== config) {
    console.warn('Snack Runtime config cannot be changed after initial render.');
  }

  return <SnackRuntimeContext.Provider value={config}>{children}</SnackRuntimeContext.Provider>;
}
