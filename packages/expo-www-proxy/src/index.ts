import chalk from 'chalk';
// @ts-ignore No types available for is-port-reachable
import isPortReachable from 'is-port-reachable';
import Koa from 'koa';
import proxy from 'koa-better-http-proxy';
import url from 'url';

const PROXY_PORT = 3020;

const LOCAL_URL = 'http://localhost:3000';
const STAGING_URL = 'https://staging.exp.host';

const app = new Koa();

let useLocalhost = true;

app.use(
  proxy(LOCAL_URL, {
    filter: () => useLocalhost,
    proxyReqPathResolver: async (ctx) => {
      console.log(chalk.yellow(`${ctx.request.method} ${ctx.url}`));
      return url.parse(ctx.url).path!;
    },
  })
);

app.use(
  proxy(STAGING_URL, {
    filter: () => !useLocalhost,
    proxyReqPathResolver: async (ctx) => {
      console.log(chalk.yellow(`${ctx.request.method} ${ctx.url}`));
      return url.parse(ctx.url).path!;
    },
  })
);

async function main() {
  const { port, host } = url.parse(LOCAL_URL);
  useLocalhost = await isPortReachable(port, { host });
  setInterval(async () => {
    const isLocalAvailable = await isPortReachable(port, { host });
    if (useLocalhost !== isLocalAvailable) {
      useLocalhost = isLocalAvailable;
      console.log(
        chalk.green(
          `Detected change in local www, now proxying to -> ${
            useLocalhost ? LOCAL_URL : STAGING_URL
          }`
        )
      );
    }
  }, 1000);

  console.log(
    chalk.green(
      `Listening for connections on port ${PROXY_PORT}, proxying to -> ${
        useLocalhost ? LOCAL_URL : STAGING_URL
      }`
    )
  );
  app.listen(PROXY_PORT);
}
main();
