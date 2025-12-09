// Inspired by Snack website file utilities
// https://github.com/expo/snack/blob/317f3fbb1d6b6074884623c84f7c24a3fbfee013/website/src/client/utils/fileUtilities.tsx#L66

export function isScript(name: string): boolean {
  return /\.(js|tsx?)$/.test(name);
}

export function isJson(name: string): boolean {
  return name.endsWith('.json');
}

export function isMarkdown(name: string): boolean {
  return name.endsWith('.md');
}

export function isAsset(name: string): boolean {
  return !(isScript(name) || isJson(name) || isMarkdown(name));
}
