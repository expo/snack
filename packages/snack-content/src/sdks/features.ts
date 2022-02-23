import { SDKFeature } from './types';

// Minimum SDK versions that support Snack features
const features: { [feature in SDKFeature]: string } = { TYPESCRIPT: '31.0.0' };

export default features;
