import cookie from 'cookie';
import { Context } from 'koa';

const SNACK_COOKIE_NAME = 'snack-values';
const choose = (array: string[]) => array[Math.floor(Math.random() * array.length)];
const chooseWithWeights = (weights: { [key: string]: number }) => {
  const random = Math.random();
  let runningWeight = 0;
  let value;
  for (value of Object.keys(weights)) {
    runningWeight += weights[value];
    if (random <= runningWeight) {
      return value;
    }
  }
  return value;
};

// TODO: define a type for next contexts (see https://github.com/zeit/next.js/blob/master/readme.md#fetching-data-and-component-lifecycle)
export default async (ctx: Context) => {
  let cookies: { [SNACK_COOKIE_NAME]?: string } = {};
  if (ctx.req.headers?.cookie) {
    // @ts-ignore
    cookies = cookie.parse(ctx.req.headers.cookie || {});
  }
  const storedValues = cookies[SNACK_COOKIE_NAME];
  const isNewUser = !storedValues;
  const existingSettings = !isNewUser ? JSON.parse(storedValues ?? '{}') : {};

  // Users that we have already seen, but haven't tagged with first seen should not get today's date
  const userDetails = {
    snackFirstSeen: !isNewUser ? '2017-11-01' : new Date().toISOString().slice(0, 10), // 'YYYY-MM-DD'
  };

  const testSettings = {
    defaultConnectionMethod: chooseWithWeights({
      'device-id': 0.5,
      'qr-code': 0.25,
      account: 0.25,
    }),
    authFlow: choose(['save1', 'save2']),
    testTransport: chooseWithWeights({
      pubnub: 0.5,
      snackpub: 0.5,
    }),
  };

  const newValues = {
    ...testSettings,
    ...userDetails,
    ...existingSettings,
  };

  const overrideTestTransport = ctx.request.query.testTransport;
  if (overrideTestTransport && ['pubnub', 'snackpub'].includes(overrideTestTransport)) {
    newValues['testTransport'] = overrideTestTransport;
  }

  ctx.res.setHeader('Set-Cookie', cookie.serialize(SNACK_COOKIE_NAME, JSON.stringify(newValues)));
  return newValues;
};
