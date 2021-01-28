declare module 'prettier/standalone' {
  export * from 'prettier';
}

declare module 'prettier/parser-babel' {
  import { BuiltInParser } from 'prettier';

  const babylon: BuiltInParser;

  export default babylon;
}

declare module 'prettier/parser-typescript' {
  import { BuiltInParser } from 'prettier';

  const typescript: BuiltInParser;

  export default typescript;
}

declare module 'prettier/parser-markdown' {
  import { BuiltInParser } from 'prettier';

  const markdown: BuiltInParser;

  export default markdown;
}
