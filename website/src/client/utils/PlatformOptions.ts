import { Platform, SDKVersion } from '../types';

export type PlatformOption = {
  label: string;
  value: Platform;
};

export function all(): PlatformOption[] {
  return [
    { label: 'My Device', value: 'mydevice' },
    { label: 'iOS', value: 'ios' },
    { label: 'Android', value: 'android' },
    { label: 'Web', value: 'web' },
  ];
}

export function filter(params: {
  sdkVersion: SDKVersion;
  supportedPlatformsQueryParam: string | undefined;
}): PlatformOption[] {
  const defaultPlatformOptions: PlatformOption[] = all();
  const fallbackPlatformOptions: PlatformOption[] = defaultPlatformOptions.filter(
    (option) => option.value === 'mydevice',
  );

  if (params.supportedPlatformsQueryParam) {
    const parsedSupportedPlatformsQueryParam = params.supportedPlatformsQueryParam.split(',');
    const supportedPlatforms = defaultPlatformOptions.filter((option) =>
      parsedSupportedPlatformsQueryParam.includes(option.value),
    );

    // Ensure that local 'mydevice' is included when ios or android is requested
    const devicePlatformOption = defaultPlatformOptions.find(({ value }) => value === 'mydevice');
    if (
      devicePlatformOption &&
      !supportedPlatforms.find(({ value }) => value === 'mydevice') &&
      parsedSupportedPlatformsQueryParam.find((value) => value === 'ios' || value === 'android')
    ) {
      supportedPlatforms.unshift(devicePlatformOption);
    }

    // If none of the provided platforms are valid, fallback to running on device only.
    if (supportedPlatforms.length) {
      return supportedPlatforms;
    }
    return fallbackPlatformOptions;
  }

  return defaultPlatformOptions;
}

export function getSelectedPlatform(params: {
  requestedPlatform?: Platform;
  sdkVersion: SDKVersion;
  options: PlatformOption[];
}): Platform {
  const { requestedPlatform, options } = params;

  let selectedPlatform: Platform = requestedPlatform ?? 'web';

  // If the selected platform is not enabled for this Snack then fallback to
  // the first available platform
  if (!options.find((platformOption) => platformOption.value === selectedPlatform)) {
    selectedPlatform = options[0].value;
  }

  return selectedPlatform;
}
