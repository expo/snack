import spawnAsync from '@expo/spawn-async';
import { Text, Box, useFocus } from 'ink';
import path from 'path';
import * as React from 'react';
// import stripAnsi from 'strip-ansi';

type Props = {
  command: string;
  args?: any[];
  cwd: string;
  width: number;
  height: number;
};

export default function SnackTerminal(props: Props) {
  const { command, args, cwd, width, height } = props;
  const title = cwd;
  const [lines, setLines] = React.useState<string[]>([]);
  const { isFocused } = useFocus();
  const maxLineCount = height - 3;

  React.useEffect(() => {
    const promise = spawnAsync(command, args, {
      cwd: path.resolve(__dirname, '../../../', cwd),
    });
    const childProcess = promise.child;
    function onData(buffer: any) {
      const text: string = buffer.toString('utf8');
      // const str: string = stripAnsi(newOutput.toString('utf8'));
      const newLines = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length);
      setLines((lines) =>
        [...lines, ...newLines].slice(Math.max(lines.length + newLines.length - maxLineCount, 0))
      );
    }
    childProcess?.stdout?.on('data', onData);
    return () => {
      childProcess?.stdout?.off('data', onData);
      console.log(`Killing ${title} ...`);
      const success = childProcess?.kill();
      if (!success) {
        console.error(`Failed to kill ${title}`);
      }
    };
  }, []);

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box flexDirection="row" justifyContent="flex-start">
        <Text color="green" bold>
          {cwd}
        </Text>
        <Text color="green" dimColor>{` (${command} ${args?.join(' ')} ${lines.length})`}</Text>
      </Box>
      <Box
        flexDirection="column"
        borderStyle={isFocused ? 'bold' : 'single'}
        width={width}
        height={height - 1}
        paddingX={1}>
        {lines.map((line) => (
          <Text>{line}</Text>
        ))}
      </Box>
    </Box>
  );
}
