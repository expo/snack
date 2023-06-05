/**
 * Sanitize a file path from Babel or Snack Runtime.
 * This removes any leading `/`, `./`, or `module://` prefixes.
 */
export function sanitizeFilePath(filePath: string) {
  // Remove starting `/`, `./`, or `module://` prefixes
  return filePath.replace(/^(module:\/{1,2}|\.?\/)/, '');
}
