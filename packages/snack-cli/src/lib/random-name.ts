export function randomName(): string {
  return Math.random().toString(36).substring(2, 15);
}
