
export function withExtraParams(url: string) {
  const urlObject = new URL(url);
  urlObject.searchParams.set('project-type', 'echo');
  return urlObject.toString();
}
