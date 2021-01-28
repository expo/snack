import * as React from 'react';

import ProgressIndicator from '../shared/ProgressIndicator';
import ContentShell from './ContentShell';
import EditorShell from './EditorShell';
import EmbeddedFooterShell from './EmbeddedFooterShell';
import EmbeddedToolbarShell from './EmbeddedToolbarShell';

export default function AppShell() {
  return (
    <ContentShell>
      <ProgressIndicator delay={1000} />
      <EmbeddedToolbarShell />
      <EditorShell />
      <EmbeddedFooterShell />
    </ContentShell>
  );
}
