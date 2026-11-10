/**
 * Compares program stdout with expected test output with robust type tolerance:
 * - Whitespace and newline tolerance
 * - Boolean case insensitivity (true / True, false / False)
 * - Number parsing and floating point precision tolerance
 * - JSON array and object structural equality (ignoring formatting spaces)
 * - String quote normalization
 */
export function compareOutput(actualRaw: string, expectedRaw: string): boolean {
  if (typeof actualRaw !== 'string' || typeof expectedRaw !== 'string') {
    return false;
  }

  const actual = actualRaw.trim().replace(/\r\n/g, '\n');
  const expected = expectedRaw.trim().replace(/\r\n/g, '\n');

  // 1. Exact string match
  if (actual === expected) {
    return true;
  }

  // 2. Boolean case insensitivity ("true" vs "True")
  const actualLower = actual.toLowerCase();
  const expectedLower = expected.toLowerCase();
  if (
    (actualLower === 'true' && expectedLower === 'true') ||
    (actualLower === 'false' && expectedLower === 'false')
  ) {
    return true;
  }

  // 3. Numeric comparison (e.g. 42 vs 42.0 or scientific notation)
  const actualNum = Number(actual);
  const expectedNum = Number(expected);
  if (!isNaN(actualNum) && !isNaN(expectedNum)) {
    return Math.abs(actualNum - expectedNum) < 1e-6;
  }

  // 4. JSON structural comparison (e.g. "[0, 1]" vs "[0,1]" or nested objects)
  try {
    const parsedActual = JSON.parse(actual);
    const parsedExpected = JSON.parse(expected);

    if (deepEqual(parsedActual, parsedExpected)) {
      return true;
    }
  } catch {
    // Not valid JSON, continue to next normalization
  }

  // 5. Array string comparison without brackets or whitespace
  // e.g., "1 2 3" vs "[1, 2, 3]"
  const stripSymbols = (s: string) =>
    s
      .replace(/[\[\]\(\)\{\},'"]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(' ');

  if (stripSymbols(actual) === stripSymbols(expected)) {
    return true;
  }

  return false;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

