import { useEffect, useMemo, useState } from 'react';
import type { SDKVersion } from 'snack-sdk';

import constants from '../configs/constants';

/**
 * Get the default Appetize SDK config from the constants.
 */
export function getAppetizeConstants({
  sdkVersion,
  platform,
  isEmbedded,
}: {
  sdkVersion: SDKVersion;
  isEmbedded: boolean;
  platform: 'android' | 'ios';
}): AppetizeSdkConfig {
  const values = isEmbedded
    ? constants.appetize?.[sdkVersion]?.embed?.[platform]
    : constants.appetize?.[sdkVersion]?.main?.[platform];

  if (!values) {
    throw new Error(
      `No Appetize config found for SDK ${sdkVersion} and platform ${platform}, configure it in client/configs/constants.tsx`
    );
  }

  return values;
}

export type AppetizeDevices = typeof cachedAppetizeDevices;

// TODO(cedric): improve caching through context
let cachedAppetizeDevices:
  | { id: string; platform: 'android' | 'ios'; osVersions: string[]; name: string }[]
  | null = null;

export function useAppetizeDevices(platform: 'android' | 'ios') {
  const [devices, setDevices] = useState(cachedAppetizeDevices);
  const deviceList = useMemo(() => createAppetizeDeviceList(devices), [platform, devices]);

  useEffect(() => {
    if (!cachedAppetizeDevices) {
      fetchAppetizeDevices().then(setDevices);
    }
  }, []);

  return deviceList;
}

function createAppetizeDeviceList(devices?: typeof cachedAppetizeDevices) {
  if (!devices) {
    return [];
  }

  return devices
    .map((device) => ({ deviceName: device.name, deviceId: device.id }))
    .filter(({ deviceId }) => !deviceId.includes('ipad') && !deviceId.includes('galaxytab'));
}

async function fetchAppetizeDevices(): Promise<typeof cachedAppetizeDevices> {
  if (cachedAppetizeDevices) {
    return cachedAppetizeDevices;
  }

  const response = await fetch('https://api.appetize.io/v2/service/devices');
  if (!response.ok) {
    throw new Error(`Unexpected Appetize response: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cachedAppetizeDevices = data;
  return data;
}
