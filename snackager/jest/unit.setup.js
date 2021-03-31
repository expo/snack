import bunyan from 'bunyan';

import { setLogLevel, setLogFormat } from '../src/logger';

// Mock external services with their mock file (globally)
jest.mock('../src/external/aws', () => require('../src/external/__mocks__/aws'));
// todo: add manual mock for Redis
jest.mock('../src/external/redis');

setLogFormat('text');
setLogLevel(bunyan.WARN);
