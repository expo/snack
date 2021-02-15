import chalk from 'chalk';
// @ts-ignore No types available for is-port-reachable
import isPortReachable from 'is-port-reachable';
import Koa from 'koa';
import proxy from 'koa-better-http-proxy';
import url from 'url';

export async function createProxy(config: {
  name: string;
  port: number;
  localURL: string;
  stagingURL: string;
}) {
  const { name, port, localURL, stagingURL } = config;

  console.log(chalk.green(`Starting "${name}" proxy on port ${port}...`));

  const { port: localPort, hostname: localHost } = url.parse(localURL);
  let useLocalhost = await isPortReachable(localPort, { host: localHost });
  setInterval(async () => {
    const isLocalAvailable = await isPortReachable(localPort, { host: localHost });
    if (useLocalhost !== isLocalAvailable) {
      useLocalhost = isLocalAvailable;
      console.log(
        chalk.green(
          `Detected change in local "${name}" service, now proxying to -> ${
            useLocalhost ? localURL : stagingURL
          }`
        )
      );
    }
  }, 1000);

  const app = new Koa();
  app.use(
    proxy(localURL, {
      filter: () => useLocalhost,
      proxyReqPathResolver: async (ctx) => {
        console.log(chalk.yellow(`${ctx.request.method} ${ctx.url} (local)`));
        return url.parse(ctx.url).path!;
      },
    })
  );
  app.use(
    proxy(stagingURL, {
      filter: () => !useLocalhost,
      proxyReqPathResolver: async (ctx) => {
        console.log(chalk.yellow(`${ctx.request.method} ${ctx.url} (staging)`));
        return url.parse(ctx.url).path!;
      },
    })
  );

  const server = app.listen(port);
  console.log(
    chalk.green(
      `Listening for "${name}" connections on port ${port}, proxying to -> ${
        useLocalhost ? localURL : stagingURL
      }`
    )
  );

  return server;
}
