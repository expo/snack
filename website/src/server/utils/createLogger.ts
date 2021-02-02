import Logger from 'bunyan';
import { isObject, isPlainObject } from 'lodash';
import stream from 'stream';

const safeStringify = (o: any): string => JSON.stringify(o, Logger.safeCycles());

const sensitiveKeys = new Set(['expo-session', 'cookie', 'password', 'credentials']);
const replacementValue = '[Filtered]';

/**
 * Replace value for matching keys of possibly nested objects. To keep this method simple,
 * when a non-primitive, non-plain-object value is encountered for a key it is replaced as well.
 *
 * @param keysToReplace set of keys for which their value should be replaced with replacementValue
 * @param replacementValue value to substitute in cases of replacement
 * @param maybeObj object or other value in which to replace
 */
function replaceValueForKeysRecursive(
  keysToReplace: Set<string>,
  replacementValue: string,
  maybeObj: any
): any {
  if (!isPlainObject(maybeObj)) {
    // filter out any unexpected non-recursable objects to err on the safe side,
    // pass primitives through.
    if (isObject(maybeObj)) {
      return replacementValue;
    } else {
      return maybeObj;
    }
  }

  return Object.fromEntries(
    Object.entries(maybeObj).map(([key, value]) => {
      const shouldReplaceValue = keysToReplace.has(key);
      if (shouldReplaceValue) {
        return [key, replacementValue];
      } else {
        return [key, replaceValueForKeysRecursive(keysToReplace, replacementValue, value)];
      }
    })
  );
}

function reqSanitizationSerializer(req: Request): object {
  // The standard req serializer produces an object of the form:
  // {
  //   method: req.method,
  //   url: req.url,
  //   headers: req.headers,
  //   remoteAddress: req.connection.remoteAddress,
  //   remotePort: req.connection.remotePort
  // }
  const unfilteredValue = Logger.stdSerializers.req({
    method: req.method,
    url: req.url,
    headers: req.headers,
  });
  return replaceValueForKeysRecursive(sensitiveKeys, replacementValue, unfilteredValue);
}

class GoogleStderrStream extends stream.Writable {
  write(record: any): boolean {
    const { msg, ctx, src, ...recordToWrite } = record;

    // bunyan cli prefers "msg", google prefers "message"
    recordToWrite['message'] = msg;

    // stackdriver context
    // see https://cloud.google.com/error-reporting/reference/rest/v1beta1/projects.events/report#ReportedErrorEvent
    if (ctx) {
      recordToWrite.context = {
        httpRequest: {
          method: ctx.method,
          url: ctx.url,
          userAgent: ctx.get('user-agent'),
          remoteIp: ctx.get('x-real-ip'),
        },
        reportLocation: {
          filePath: 'src/server/index.tsx',
          functionName: 'app.on',
        },
      };
      if (src) {
        recordToWrite.context.reportLocation = {
          filePath: src.file,
          functionName: src.func,
        };
      }
    }

    process.stderr.write(safeStringify(recordToWrite) + '\n');
    return true;
  }
}

function createLogger(loggerConfig: Logger.LoggerOptions): Logger {
  const streams: Logger.Stream[] = [
    {
      level: 'warn',
      type: 'raw',
      stream: new GoogleStderrStream(),
    },
  ];
  const logger = Logger.createLogger({
    src: process.env.NODE_ENV !== 'production',
    serializers: {
      ...Logger.stdSerializers,
      req: reqSanitizationSerializer,
    },
    streams,
    ...loggerConfig,
  });

  logger.on('error', (err: Error) => {
    try {
      console.error(safeStringify({ message: 'Error logging error', err }));
    } catch (e) {
      console.error(
        safeStringify({
          message: `We were unable to convert an error object to JSON. This is a serious error because we are losing visibility into our logs and errors now.`,
          err: e,
        })
      );
    }
  });
  return logger;
}

export default createLogger;
