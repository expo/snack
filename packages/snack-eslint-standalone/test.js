const { linter, defaultConfig } = require('.');

const code = `
  class Test { }
  class Other extends Test {
    constructor() {
      console.log(this);
    }
  }
`;

console.log(
  linter.verify(code, defaultConfig)
);
