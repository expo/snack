import customProtocolCheck from 'custom-protocol-check';
import { useCallback, useEffect, useState } from 'react';

import { Experiment, UserData } from '../auth/authManager';
import { isMacOS } from './detectPlatform';

const ORBIT_SERVER_PORTS = [35783, 47909, 44171, 50799];

type BaseRouteResponse = {
  ok: boolean;
};

type StatusRouteResponse = BaseRouteResponse & {
  version: string;
};

interface BaseServerRoutes {
  [route: string]: {
    searchParams?: Record<string, string>;
    response: BaseRouteResponse;
  };
}

interface LocalServerRoutes extends BaseServerRoutes {
  status: {
    response: StatusRouteResponse;
  };
  open: {
    response: BaseRouteResponse;
    searchParams: { url: string };
  };
}

async function fetchLocalOrbitServer<T extends keyof LocalServerRoutes>(
  route: T,
  searchParams: LocalServerRoutes[T]['searchParams'] = {}
): Promise<LocalServerRoutes[T]['response'] | undefined> {
  let path = `orbit/${route}`;
  if (searchParams) {
    path += `?${new URLSearchParams(searchParams)}`;
  }

  for (const port of ORBIT_SERVER_PORTS) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/${path}`, {
        cache: 'no-cache',
        headers: { Accept: 'application/json' },
        referrerPolicy: 'origin-when-cross-origin',
        credentials: 'omit',
      });
      if (response.ok) {
        return response.json();
      }
    } catch {}
  }

  return undefined;
}

interface UseOrbitParams {
  experiments?: UserData['experiments'];
}

export function useOrbit({ experiments }: UseOrbitParams = {}) {
  const [isRunning, setIsRunning] = useState(false);
  const isRunningMacOS = isMacOS(navigator?.userAgent);

  const hasEnabledOrbitExperiment =
    experiments?.find(({ experiment }) => experiment === Experiment.Orbit)?.enabled ?? false;

  const openWithExperienceURL = useCallback(
    async (experienceURL: string, onFail?: () => void) => {
      if (!experienceURL) {
        return;
      }

      if (isRunning) {
        const response = await fetchLocalOrbitServer('open', { url: experienceURL });
        if (response?.ok) {
          return;
        }
      }

      customProtocolCheck(experienceURL.replace('exp://', 'expo-orbit://'), onFail);
    },
    [isRunning]
  );

  useEffect(() => {
    if (isRunningMacOS) {
      fetchLocalOrbitServer('status')
        .then((r) => {
          setIsRunning(!!r?.version);
        })
        .catch(() => {});
    }
  }, [isRunningMacOS]);

  return {
    isEnabled: hasEnabledOrbitExperiment || isRunning,
    openWithExperienceURL,
  };
}
