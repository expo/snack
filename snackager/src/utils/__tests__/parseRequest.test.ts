import parseRequest from '../parseRequest';

it('gets id from request', () => {
  const parsed = parseRequest('/lodash');
  expect(parsed).toMatchSnapshot();
});

it('gets user from request', () => {
  const parsed = parseRequest('/@scoped/lodash');
  expect(parsed).toMatchSnapshot();
});

it('gets tag from request', () => {
  const parsed = parseRequest('/lodash@14.5.2');
  expect(parsed).toMatchSnapshot();
});

it('gets deep path from request', () => {
  const parsed = parseRequest('/lodash/bounce/index');
  expect(parsed).toMatchSnapshot();
});

it('gets deep path and tag from request', () => {
  const parsed = parseRequest('/lodash/bounce/index@14.5.2');
  expect(parsed).toMatchSnapshot();
});

it('gets tag from request', () => {
  const parsed = parseRequest('/lodash/bounce/index?platforms=ios');
  expect(parsed).toMatchSnapshot();
});

it('gets platforms from request', () => {
  const parsed = parseRequest('/lodash/bounce/index?platforms=ios,android');
  expect(parsed).toMatchSnapshot();
});

it('gets all fields from request', () => {
  const parsed = parseRequest('/@scoped/lodash/bounce/index@14.5.2?platforms=ios');
  expect(parsed).toMatchSnapshot();
});
