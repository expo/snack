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

const DEVICE_NAMES: Record<string, string> = {
  iphone8: 'iPhone 8',
  iphone8plus: 'iPhone 8 Plus',
  iphone11pro: 'iPhone 11 Pro',
  iphone12: 'iPhone 12',
  iphone13pro: 'iPhone 13 Pro',
  iphone13promax: 'iPhone 13 Pro Max',
  iphone14pro: 'iPhone 14 Pro',
  iphone14promax: 'iPhone 14 Pro Max',
  iphone15pro: 'iPhone 15 Pro',
  iphone15promax: 'iPhone 15 Pro Max',
  // ipadair4thgeneration: 'iPad Air (4th gen)',
  // ipadpro129inch5thgeneration: 'iPad Pro 12.9 (5th gen)',
  // ipad9thgeneration: 'iPad (9th gen)',
  nexus5: 'Nexus 5',
  pixel4: 'Pixel 4',
  pixel4xl: 'Pixel 4 XL',
  pixel6: 'Pixel 6',
  pixel6pro: 'Pixel 6 Pro',
  pixel7: 'Pixel 7',
  pixel7pro: 'Pixel 7 Pro',
  // galaxytabs7: 'Galaxy Tab S7',
};

export function getAppetizeDeviceName(deviceId: string) {
  return DEVICE_NAMES[deviceId];
}

function createAppetizeDeviceList(devices?: Record<string, string[]>) {
  if (!devices) {
    return [];
  }

  return Object.keys(devices)
    .map((deviceId) => ({ deviceName: DEVICE_NAMES[deviceId], deviceId }))
    .filter(({ deviceName }) => !!deviceName);
}

export type AppetizeDevices = typeof cachedAppetizeDevices;

// TODO(cedric): improve caching through context
let cachedAppetizeDevices: null | Record<'android' | 'ios', Record<string, string[]>> = null;

export function useAppetizeDevices(platform: 'android' | 'ios') {
  const [devices, setDevices] = useState(cachedAppetizeDevices);
  const deviceList = useMemo(
    () => createAppetizeDeviceList(devices?.[platform]),
    [platform, devices]
  );

  useEffect(() => {
    if (!cachedAppetizeDevices) {
      fetchAppetizeDevices().then(setDevices);
    }
  }, []);

  return deviceList;
}

async function fetchAppetizeDevices(): Promise<typeof cachedAppetizeDevices> {
  if (cachedAppetizeDevices) {
    return cachedAppetizeDevices;
  }

  const response = await fetch('https://appetize.io/available-devices');
  if (!response.ok) {
    throw new Error(`Unexpected Appetize response: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cachedAppetizeDevices = data;
  return data;
}
