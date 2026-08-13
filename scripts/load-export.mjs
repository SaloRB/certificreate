#!/usr/bin/env node

/** Fires concurrent certificate exports at a running server and reports what came
 *  back, so instance sizing and the render caps are decided from measurements
 *  rather than guesses. Run against a local `npm run start` or a deployed URL.
 *
 *    node scripts/load-export.mjs --concurrency 10
 *    node scripts/load-export.mjs --base-url https://certificreate.onrender.com
 *
 *  A 503 is a pass, not a failure: past the queue cap the service is supposed to
 *  refuse work quickly. Truncated files, hangs, and 5xx other than 503 are not.
 */

const DEFAULTS = {
  baseUrl: "http://localhost:3000",
  concurrency: 4,
  format: "both",
};

function parseArgs(argv) {
  const options = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i += 2) {
    const value = argv[i + 1];
    switch (argv[i]) {
      case "--base-url":
        options.baseUrl = value.replace(/\/$/, "");
        break;
      case "--concurrency":
        options.concurrency = Number(value);
        break;
      case "--format":
        options.format = value;
        break;
      default:
        throw new Error(`Unknown option ${argv[i]}`);
    }
  }
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("--concurrency must be a positive integer");
  }
  if (!["png", "pdf", "both"].includes(options.format)) {
    throw new Error("--format must be png, pdf, or both");
  }

  return options;
}

/** Distinct recipients so nothing can pass by serving a cached render. */
function payload(index) {
  return {
    recipientName: `Load Test ${index}`,
    courseTitle: "Analytical Engines 101",
    date: "07/13/2026",
    instructor: "Brad Traversy",
    templateId: "black-border",
  };
}

const MAGIC = {
  png: [0x89, 0x50, 0x4e, 0x47],
  pdf: [0x25, 0x50, 0x44, 0x46],
};

function looksLikeFile(format, bytes) {
  return MAGIC[format].every((byte, index) => bytes[index] === byte);
}

async function health(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/health`);

    return await response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

async function exportOnce(baseUrl, format, index) {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}/api/export/${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(index)),
    });
    const buffer = new Uint8Array(await response.arrayBuffer());

    return {
      format,
      status: response.status,
      ms: performance.now() - startedAt,
      bytes: buffer.length,
      valid: response.ok ? looksLikeFile(format, buffer) : null,
      retryAfter: response.headers.get("Retry-After"),
    };
  } catch (error) {
    return {
      format,
      status: 0,
      ms: performance.now() - startedAt,
      bytes: 0,
      valid: false,
      error: String(error),
    };
  }
}

function percentile(sorted, fraction) {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.ceil(fraction * sorted.length) - 1,
  );

  return sorted[index];
}

function summarize(results) {
  const byStatus = new Map();
  for (const result of results) {
    byStatus.set(result.status, (byStatus.get(result.status) ?? 0) + 1);
  }
  const ok = results.filter((result) => result.status === 200);
  const latencies = ok.map((result) => result.ms).sort((a, b) => a - b);

  return {
    byStatus: Object.fromEntries(byStatus),
    p50: Math.round(percentile(latencies, 0.5)),
    p95: Math.round(percentile(latencies, 0.95)),
    max: Math.round(percentile(latencies, 1)),
    corrupt: ok.filter((result) => !result.valid).length,
  };
}

const { baseUrl, concurrency, format } = parseArgs(process.argv.slice(2));

console.log(`${concurrency} concurrent ${format} export(s) -> ${baseUrl}`);
console.log("health before:", await health(baseUrl));

const formats =
  format === "both"
    ? Array.from({ length: concurrency }, (_, i) => (i % 2 ? "pdf" : "png"))
    : Array.from({ length: concurrency }, () => format);

const startedAt = performance.now();
const results = await Promise.all(
  formats.map((each, index) => exportOnce(baseUrl, each, index + 1)),
);
const wallMs = Math.round(performance.now() - startedAt);

for (const result of results) {
  const note = result.error ?? (result.valid === false ? "CORRUPT" : "");
  const retry = result.retryAfter ? ` retry-after=${result.retryAfter}s` : "";
  console.log(
    `  ${result.format} ${result.status} ${Math.round(result.ms)}ms ${result.bytes}B${retry} ${note}`.trimEnd(),
  );
}

const summary = summarize(results);
console.log("statuses:", summary.byStatus);
console.log(
  `latency (200s only) p50=${summary.p50}ms p95=${summary.p95}ms max=${summary.max}ms wall=${wallMs}ms`,
);
console.log("corrupt files:", summary.corrupt);
console.log("health after:", await health(baseUrl));

const unexpected = results.filter(
  (result) => ![200, 503].includes(result.status),
);
if (unexpected.length > 0 || summary.corrupt > 0) {
  console.error("FAIL: unexpected statuses or corrupt output");
  process.exitCode = 1;
}
