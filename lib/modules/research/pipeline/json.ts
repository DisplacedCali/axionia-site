/**
 * Tolerant JSON extraction from model output.
 *
 * Ported from toJSON() in axionia-app src/App.js, unchanged in behaviour. The
 * escalation matters: models wrap JSON in prose or fences often enough that a
 * bare JSON.parse loses roughly one step in ten, and a lost step means a whole
 * report section silently empty.
 *
 * Pure. No I/O.
 */

/**
 * Parse model output as JSON, escalating through three strategies:
 *   1. straight parse
 *   2. contents of a ```json fence
 *   3. widest {...} span in the text
 *
 * Returns null rather than throwing — callers decide whether a step can
 * degrade or must fail.
 */
export function extractJson<T = unknown>(raw: string | null | undefined): T | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw.trim()) as T;
  } catch {
    /* fall through */
  }

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {
      /* fall through */
    }
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1)) as T;
    } catch {
      /* fall through */
    }
  }

  return null;
}

/**
 * Last-resort recovery of a single array property from malformed JSON.
 *
 * The workforce step returns a large object and occasionally truncates. The
 * segments array is the load-bearing part — without it the Benefit Design tab
 * is empty — so it's worth salvaging even when the envelope is unparseable.
 *
 * Ported from the inline recovery in handleRunPipeline.
 */
export function extractArrayProperty<T = unknown>(
  raw: string | null | undefined,
  property: string,
): T[] | null {
  if (!raw) return null;
  const re = new RegExp(`"${property}"\\s*:\\s*(\\[[\\s\\S]*?\\]\\s*[,}])`);
  const m = raw.match(re);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1].replace(/,\s*$/, "").replace(/}\s*$/, ""));
    return Array.isArray(parsed) && parsed.length ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}
