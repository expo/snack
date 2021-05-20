import { render, Box, Text } from 'ink';
import * as React from 'react';

import FullScreen from './FullScreen';
import Terminal from './Terminal';

function SnackTerminal() {
  return (
    <FullScreen>
      {(size) => (
        <Box flexDirection="row">
          <Box flexDirection="column">
            <Terminal
              cwd="website"
              command="yarn"
              args={['start']}
              width={Math.round(size.width / 2)}
              height={Math.round((size.height - 1) / 2)}
            />
            <Terminal
              cwd="snackager"
              command="yarn"
              args={['start']}
              width={Math.round(size.width / 2)}
              height={size.height - 1 - Math.round((size.height - 1) / 2)}
            />
            <Text color="cyan">
              Open{' '}
              <Text bold underline>
                http://snack.expo.test
              </Text>{' '}
              or press Ctrl+C to exit
            </Text>
          </Box>
          <Terminal
            cwd="packages/snack-proxies"
            command="yarn"
            args={['start']}
            width={size.width - Math.round(size.width / 2)}
            height={size.height - 1}
          />
        </Box>
      )}
    </FullScreen>
  );
}

const { waitUntilExit } = render(<SnackTerminal />);

waitUntilExit().then(() => {
  console.log('Shutdown signal received, press Ctrl+C to exit');
});
