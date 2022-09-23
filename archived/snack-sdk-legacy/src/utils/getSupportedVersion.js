import { type SDKVersion } from '../configs/sdkVersions';
import supportedModules from '../configs/supportedModules';

export default function getSupportedVersion(
  name: string,
  sdkVersion: SDKVersion
): string | undefined {
  return supportedModules[sdkVersion] ? supportedModules[sdkVersion][name] : undefined;
}
