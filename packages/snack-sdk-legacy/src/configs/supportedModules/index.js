import { type SDKVersion } from '../sdkVersions';
import sdk36 from './sdk-36';

const supportedVersions: { [key: SDKVersion]: { [key: string]: string } | undefined } = {
  '36.0.0': sdk36,
};

export default supportedVersions;
