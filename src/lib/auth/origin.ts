export function getCanonicalOrigin(input: string | URL): string {
  const url = new URL(input);
  if (url.hostname === '0.0.0.0' || url.hostname === '::' || url.hostname === '[::]') {
    url.hostname = 'localhost';
  }
  return url.origin;
}
