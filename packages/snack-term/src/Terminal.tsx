import spawnAsync from '@expo/spawn-async';
import { Text, Box, useFocus } from 'ink';
import path from 'path';
import * as React from 'react';

type Props = {
  command: string;
  args?: any[];
  cwd: string;
  width: number;
  height: number;
};

type Log = {
  message: string;
  color?: string;
};

export default function SnackTerminal(props: Props) {
  const { command, args, cwd, width, height } = props;
  const title = cwd;
  const [logs, setLogs] = React.useState<Log[]>([]);
  const [exitCode, setExitCode] = React.useState<number | undefined>();
  const { isFocused } = useFocus();
  const logCount = height - 3;
  const maxLogCount = 100;

  React.useEffect(() => {
    const promise = spawnAsync(command, args, {
      cwd: path.resolve(__dirname, '../../../', cwd),
    });
    const childProcess = promise.child;
    function onData(buffer: any, color?: string) {
      const text: string = typeof buffer === 'string' ? buffer : buffer.toString('utf8');
      const newLogs = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length)
        .map((line) => ({ message: line, color }));
      setLogs((logs) =>
        [...logs, ...newLogs].slice(Math.max(logs.length + newLogs.length - maxLogCount, 0))
      );
    }
    const onStdout = (buffer: any) => onData(buffer);
    const onStderr = (buffer: any) => onData(buffer, 'yellow');
    const onExit = (code: number, _signal: string) => setExitCode(code);
    childProcess?.stdout?.on('data', onStdout);
    childProcess?.stderr?.on('data', onStderr);
    childProcess?.on('exit', onExit);
    return () => {
      childProcess?.stdout?.off('data', onStdout);
      childProcess?.stderr?.off('data', onStderr);
      childProcess?.off('exit', onExit);
      if (exitCode != null) {
        console.log(`Killing ${title} ...`);
      }
      const success = childProcess?.kill();
      if (!success) {
        console.error(`Failed to kill ${title}`);
      }
    };
  }, []);

  // Wrap logs to new lines
  const lines: Log[] = [];
  const maxLineWidth = width - 4;
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    if (log.message.length < maxLineWidth) {
      lines.push(log);
    } else {
      let { message, color } = logs[i];
      while (message.length > maxLineWidth) {
        lines.push({ message: message.slice(0, maxLineWidth), color });
        message = message.slice(maxLineWidth);
      }
      lines.push({ message, color });
    }
  }

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box flexDirection="row" justifyContent="flex-start">
        <Text color={exitCode != null ? 'gray' : 'green'} bold>
          {cwd}
        </Text>
        <Text color={exitCode != null ? 'gray' : 'green'} dimColor>{` (${command} ${args?.join(
          ' '
        )})`}</Text>
      </Box>
      <Box
        flexDirection="column"
        borderStyle={isFocused ? 'bold' : 'single'}
        width={width}
        height={height - 1}
        paddingX={1}>
        {lines.slice(Math.max(0, lines.length - logCount)).map(({ message, color }) => (
          <Text color={color}>{message}</Text>
        ))}
      </Box>
    </Box>
  );
}
