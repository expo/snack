/* eslint-env jest */

import findDependencies from '../findDependencies';

it('finds all imported modules', () => {
  const code = `
    import base64 from 'base64';
    import debounce from 'lodash/debounce';
    import { connect } from 'react-redux';
  `;

  const dependencies = findDependencies(code, 'index.js');

  expect(Object.keys(dependencies)).toEqual(['base64', 'lodash/debounce', 'react-redux']);
});

it('finds all required modules', () => {
  const code = `
    const base64 = require('base64');
    const debounce = require('lodash/debounce');
    const { connect } = require('react-redux');
  `;

  const dependencies = findDependencies(code, 'index.js');

  expect(Object.keys(dependencies)).toEqual(['base64', 'lodash/debounce', 'react-redux']);
});

it('finds all required modules with backticks', () => {
  const code = `
    const base64 = require(\`base64\`);
    const debounce = require(\`lodash/debounce\`);
    const { connect } = require(\`react-redux\`);
  `;

  const dependencies = findDependencies(code, 'index.js');

  expect(Object.keys(dependencies)).toEqual(['base64', 'lodash/debounce', 'react-redux']);
});

it('finds all required modules with version comments', () => {
  const code = `
    const base64 = require('base64'); // 2.4.1
    const { connect } = require(\`react-redux\`); // 3.5.2
  `;

  const dependencies = findDependencies(code, 'index.js');

  expect(dependencies).toMatchSnapshot();
});

it('finds dependencies using all import styles', () => {
  const code = `
    import v from "mod1"
    import * as ns from "mod2";
    import {x} from "mod3";
    import {x as v2} from "mod4";
    import "mod5";

    export {x} from "mod6";
    export {x as v} from "mod7";
    export * from "mod8";

    export default 7;
    export const value = 6;
    const otherValue = 5;
    export { otherValue }
  `;

  const dependencies = findDependencies(code, 'index.js');

  expect(Object.keys(dependencies)).toEqual([
    'mod1',
    'mod2',
    'mod3',
    'mod4',
    'mod5',
    'mod6',
    'mod7',
    'mod8',
  ]);
});

it('finds dependencies using all import styles in TypeScript file', () => {
  const code = `
    import v from "mod1"
    import * as ns from "mod2";
    import {x} from "mod3";
    import {x as v2} from "mod4";
    import "mod5";

    export {x} from "mod6";
    export {x as v} from "mod7";
    export * from "mod8";

    export default 7;
    export const value = 6;
    const otherValue = 5;
    export { otherValue };

    // TypeScript features
    const assets: number[] = [];
  `;

  const dependencies = findDependencies(code, 'index.tsx');

  expect(Object.keys(dependencies)).toEqual([
    'mod1',
    'mod2',
    'mod3',
    'mod4',
    'mod5',
    'mod6',
    'mod7',
    'mod8',
  ]);
});

it('finds dependencies with version comments', () => {
  const code = `
    import v from "mod1" // 2.4.1
    import * as ns from "mod2"; // 3.5.2
    import {x} from "mod3"; // 4.6.3
    import {x as v2} from "mod4"; // 5.7.4
    import "mod5"; // 6.8.5

    export {x} from "mod6"; // 7.9.6
    export {x as v} from "mod7"; // 8.0.7
    export * from "mod8"; // 9.1.8
  `;

  const dependencies = findDependencies(code, 'index.js');

  expect(dependencies).toMatchSnapshot();
});

it("doesn't parse non-static and invalid requires", () => {
  const code = `
    const base64 = require();
    const uuid = require('');
    const debounce = require('debounce', null);
    const moment = require(\`\${name}\`);
    const leftpad = require(\`left-\${name}\`);
    const core = require('/core');
    const promise = require('promise\\nme');
    const bluebird = require(\`blue
      bird
    \`);
    const ten = require(10);
  `;

  const dependencies = findDependencies(code, 'index.js');

  expect(Object.values(dependencies).filter((dep) => dep.isPackage)).toEqual([]);
});

it('finds dependencies in JSX files', () => {
  const code = `
    import * as React from "react";
    import { View, Text } from "react-native";
    import v from "mod1" // 2.4.1
    import * as ns from "mod2"; // 3.5.2
    import {x} from "mod3"; // 4.6.3
    import {x as v2} from "mod4"; // 5.7.4
    import "mod5"; // 6.8.5
    
    export default function App() {
      return (
        <View>
          <Text>
            Change code in the editor and watch it change on your phone! Save to get a shareable url.
          </Text>
        </View>
      );
    }
  `;

  const dependencies = findDependencies(code, 'index.js');

  expect(dependencies).toMatchSnapshot();
});
