import { SDKFeature } from './types';

// Minimum SDK versions that support Snack features
const features: { [feature in SDKFeature]: string } = {
  MULTIPLE_FILES: '21.0.0',
  PROJECT_DEPENDENCIES: '25.0.0',
  TYPESCRIPT: '31.0.0',
  UNIMODULE_IMPORTS: '33.0.0',
  POSTMESSAGE_TRANSPORT: '35.0.0',
  VERSIONED_SNACKAGER: '37.0.0',
};

export default features;
