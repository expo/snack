import * as React from 'react';

import ContentShell from './ContentShell';
import EditorShell from './EditorShell';
import EmbeddedFooterShell from './EmbeddedFooterShell';
import EmbeddedToolbarShell from './EmbeddedToolbarShell';
import ProgressIndicator from '../shared/ProgressIndicator';

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
