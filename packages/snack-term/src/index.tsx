import { render, Box, Text } from 'ink';
import * as React from 'react';

import FullScreen from './FullScreen';
import Terminal from './Terminal';

function SnackTerminal() {
  return (
    <FullScreen>
      {(size) => (
        <Box flexDirection="column">
          <Terminal
            cwd="packages/snack-proxies"
            command="yarn"
            args={['start']}
            width={size.width}
            height={Math.round((size.height - 1) / 2)}
          />
          <Terminal
            cwd="website"
            command="yarn"
            args={['start']}
            width={size.width}
            height={size.height - 1 - Math.round((size.height - 1) / 2)}
          />
          <Text color="cyan">Press Ctrl+C to exit</Text>
        </Box>
      )}
    </FullScreen>
  );
}

const { waitUntilExit } = render(<SnackTerminal />);

waitUntilExit().then(() => {
  console.log('Shutdown signal received, press Ctrl+C to exit');
});
