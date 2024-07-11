import fs from 'fs';
import path from 'path';
import supertest from 'supertest';

import app from '../app';
import config from '../config';

describe('/status', () => {
  it('responds with health check', async () => {
    const response = await supertest(app()).get('/status').send();

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });

  it('responds with open CORS headers', async () => {
    const response = await supertest(app()).get('/status').send();

    // TODO: Investigate whether this is correct. CORS headers should probably
    // only be returned when an origin is sent in the request.
    expect(response.get('access-control-allow-origin')).toBe('*');
  });
});

describe('/serve', () => {
  const originalEnv = process.env.DEBUG_LOCAL_FILES;
  const directory = path.join(config.tmpdir, 'output');

  beforeEach(() => {
    fs.mkdirSync(directory, { recursive: true });
  });

  afterEach(() => {
    process.env.DEBUG_LOCAL_FILES = originalEnv;
    fs.rmSync(directory, { recursive: true });
  });

  it('doesnt serve local files by default', async () => {
    const response = await supertest(app()).get('/serve').send();

    expect(response.status).toBe(404);
  });

  it('serves .json files with `DEBUG_LOCAL_FILES="true"`', async () => {
    process.env.DEBUG_LOCAL_FILES = 'true';
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name: 'expo' }));

    const response = await supertest(app()).get('/serve/package.json').send();

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'expo' });
  });

  it('serves .js files with `DEBUG_LOCAL_FILES="true"`', async () => {
    process.env.DEBUG_LOCAL_FILES = 'true';
    fs.writeFileSync(path.join(directory, 'test.js'), "console.log('test')");

    const response = await supertest(app()).get('/serve/test.js').send();

    expect(response.status).toBe(200);
    expect(response.text).toBe("console.log('test')");
  });
});

// TODO: we can't e2e test the `/bundle` and `/git` endpoints.
// `./utils/fetchBundle` has a hard dependency on the Redis client, with complex callback usage
// We should refactor `./utils/fetchBundle` to be more like `./utils/fetchMetadata` to make this possible
//
// describe('/git', () => {});
// describe('/bundle', () => {});
