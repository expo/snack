import querystring from 'query-string';

import {
  AppetizeDeviceFrameAndroid,
  AppetizeDeviceFrameIos,
} from '../components/DevicePreview/AppetizeFrame';
import constants from '../configs/constants';

type Props = {
  experienceURL: string;
  platform: 'android' | 'ios';
  previewQueue: 'main' | 'secondary';
  autoplay?: boolean;
  screenOnly?: boolean;
  scale?: number;
  payerCode?: string;
  deviceColor?: 'black' | 'white';
  deviceFrame?: AppetizeDeviceFrameAndroid | AppetizeDeviceFrameIos;
};

export default function constructAppetizeURL({
  experienceURL,
  platform,
  screenOnly = false,
  scale,
  autoplay,
  payerCode,
  previewQueue,
  deviceColor = 'black',
  deviceFrame,
}: Props) {
  const appetizeOptions = {
    screenOnly,
    scale,
    autoplay: !!autoplay,
    embed: true,
    device: undefined as undefined | string,
    launchUrl: platform === 'android' ? experienceURL : undefined,
    xdocMsg: true,
    deviceColor,
    xDocMsg: true,
    orientation: 'portrait',
    debug: true,
    pc: payerCode,
  };

  if (deviceFrame === 'none') {
    appetizeOptions.screenOnly = true;
  } else if (deviceFrame) {
    appetizeOptions.device = deviceFrame;
  } else {
    appetizeOptions.device = platform === 'ios' ? 'iphone12' : 'pixel4';
  }

  const appetizeKey = constants.appetize.public_keys[previewQueue][platform];
  const appParams = {
    EXDevMenuDisableAutoLaunch: true,
    EXKernelLaunchUrlDefaultsKey: experienceURL,
    EXKernelDisableNuxDefaultsKey: true,
  };

  return `${constants.appetize.url}/embed/${appetizeKey}?${querystring.stringify(
    appetizeOptions
  )}&params=${encodeURIComponent(JSON.stringify(appParams))}`;
}
