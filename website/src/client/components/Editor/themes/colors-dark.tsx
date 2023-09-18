import type { SyntaxColors, UIColors } from './colors-light';
import { c } from '../../ThemeProvider';

export const syntax: SyntaxColors = {
  text: '#d9d7ce',
  variable: '#d9d7ce',
  invalid: '#ff3333',
  constant: '#ff9d45',
  comment: '#5c6773',
  regexp: '#95e6cb',
  annotation: '#5ccfe6',
  tag: '#80d4ff',
  number: '#ff9d45',
  string: '#bae67e',
  property: '#5ccfe6',
  value: '#bae67e',
  keyword: '#ffae57',
  operator: '#778899',
  predefined: '#ff00ff',
};

export const ui: UIColors = {
  background: c('background', 'dark'),
  text: '#d9d7ce',
  selection: '#aaaaaa',
  indent: {
    active: '#393b41',
    inactive: '#494b51',
  },
};
