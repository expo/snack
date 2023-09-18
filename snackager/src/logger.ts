import bunyan from 'bunyan';

const safeStringify = (o: any): string => JSON.stringify(o, bunyan.safeCycles());

type LogFormat = 'text' | 'bunyan' | 'google';

let logFormat: LogFormat = 'google';
let logLevel = 0;

class LogStream {
  write(record: any): boolean {
    let { msg, pkg, ...recordToWrite } = record;
    let { level } = record;

    // prepend the package name & version to the message
    if (msg === 'request finish') {
      msg = `--> ${record.req.method} ${record.req.url} ${record.res.statusCode} ${Math.round(
        record.duration,
      )}ms`;
      if (level <= bunyan.INFO && record.res.statusCode >= 400) {
        level = bunyan.ERROR;
      }
    } else if (pkg) {
      msg = `${pkg.name}@${pkg.version || ''} ${msg}`;
      recordToWrite.pkg = {
        ...pkg,
      };
      delete recordToWrite.pkg.devDependencies;
      delete recordToWrite.pkg.dist;
    }

    // bunyan cli prefers "msg", google prefers "message"
    recordToWrite[logFormat === 'google' ? 'message' : 'msg'] = msg;

    if (level >= logLevel) {
      const output =
        (logFormat === 'text'
          ? `${bunyan.nameFromLevel[level].toUpperCase()}: ${msg}`
          : safeStringify(recordToWrite)) + '\n';
      if (level <= bunyan.INFO) {
        process.stdout.write(output);
      } else {
        process.stderr.write(output);
      }
    }
    return true;
  }
}

export default bunyan.createLogger({
  name: 'snackager',
  streams: [
    {
      type: 'raw',
      // @ts-ignore TODO: check if we can make the logstream compatible with a writable stream
      stream: new LogStream(),
    },
  ],
});

export function setLogFormat(format: LogFormat): void {
  logFormat = format;
}

export function setLogLevel(level: number = 0): void {
  logLevel = level;
}
