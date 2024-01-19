import querystring from 'query-string';
import type { SDKVersion } from 'snack-sdk';

import { AppetizeDevices } from '../components/DevicePreview/AppetizeFrame';
import constants from '../configs/constants';

// All default scales of each device for embeds
const embeddedDeviceScales: Record<string, number> = {
  iphone8: 68,
  iphone8plus: 61,
  iphone11pro: 65,
  iphone12: 65,
  iphone13pro: 65,
  iphone13promax: 59,
  iphone14pro: 64,
  iphone14promax: 59,
  ipadair4thgeneration: 30,
  nexus5: 70,
  pixel4: 72,
  pixel4xl: 54,
  pixel6: 70,
  pixel6pro: 55,
  pixel7: 70,
  pixel7pro: 55,
  galaxytabs7: 39,
};

// All default scales of each device for the website
const websiteDeviceScales: Record<string, number> = {
  iphone8: 76,
  iphone8plus: 69,
  iphone11pro: 72,
  iphone12: 72,
  iphone13pro: 72,
  iphone13promax: 66,
  iphone14pro: 72,
  iphone14promax: 66,
  ipadair4thgeneration: 34,
  nexus5: 79,
  pixel4: 80,
  pixel4xl: 60,
  pixel6: 78,
  pixel6pro: 61,
  pixel7: 78,
  pixel7pro: 61,
  galaxytabs7: 44,
};

type Props = {
  type: 'embedded' | 'website';
  experienceURL: string;
  platform: 'android' | 'ios';
  previewQueue: 'main' | 'secondary';
  autoplay?: boolean;
  screenOnly?: boolean;
  scale?: number;
  payerCode?: string;
  deviceColor?: 'black' | 'white';
  devices?: AppetizeDevices;
  sdkVersion: SDKVersion;
};

export function getAppetizeConfig(sdkVersion: SDKVersion) {
  const config = constants.appetize?.[sdkVersion];
  if (!config) {
    throw new Error(
      `No Appetize config found for SDK ${sdkVersion}, configure it in client/configs/constants.tsx`
    );
  }

  return config;
}

export default function constructAppetizeURL({
  type,
  experienceURL,
  platform,
  scale,
  autoplay,
  payerCode,
  previewQueue,
  deviceColor = 'black',
  devices,
  sdkVersion,
}: Props) {
  const appetizeOptions = {
    screenOnly: devices?._showFrame === false,
    scale,
    autoplay: !!autoplay,
    embed: true,
    device: undefined as undefined | string,
    launchUrl: experienceURL,
    xdocMsg: true,
    deviceColor,
    xDocMsg: true,
    orientation: 'portrait',
    debug: true,
    pc: payerCode,
  };

  const deviceForPlatform = devices?.[platform];

  if (deviceForPlatform?.device) {
    appetizeOptions.device = deviceForPlatform.device;
  } else {
    appetizeOptions.device = platform === 'ios' ? 'iphone12' : 'pixel4';
  }

  if (appetizeOptions.device && !appetizeOptions.scale) {
    if (deviceForPlatform?.scale) {
      appetizeOptions.scale = deviceForPlatform.scale;
    } else {
      appetizeOptions.scale =
        type === 'embedded'
          ? embeddedDeviceScales[appetizeOptions.device]
          : websiteDeviceScales[appetizeOptions.device];
    }
  }

  const appetizeConfig = getAppetizeConfig(sdkVersion);
  const appetizeKey =
    previewQueue === 'secondary'
      ? appetizeConfig.embed[platform] // Secondary has been renamed to embed
      : appetizeConfig[previewQueue][platform];

  const appParams = {
    EXDevMenuDisableAutoLaunch: true,
    // TODO(cedric): figure out why this crashes on iOS SDK 50+
    // EXKernelLaunchUrlDefaultsKey: experienceURL,
    EXKernelDisableNuxDefaultsKey: true,
  };

  return `${appetizeConfig.url}/embed/${appetizeKey}?${querystring.stringify(
    appetizeOptions
  )}&params=${encodeURIComponent(JSON.stringify(appParams))}`;
}
