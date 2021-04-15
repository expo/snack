export type BundleInfo = {
  size: number;
  externals?: string[];
  code?: string;
};

export default function getBundleInfo(
  filename: string,
  buffer: Buffer,
  includeCode?: boolean
): BundleInfo {
  if (!filename.endsWith('.js')) {
    return { size: buffer.length };
  }
  const code: string = buffer.toString();
  return {
    externals: Array.from(code.matchAll(/require\("([^"]+)"\)/g)).map((match) => match[1]),
    size: code.length,
    ...(includeCode ? { code } : {}),
  };
}
