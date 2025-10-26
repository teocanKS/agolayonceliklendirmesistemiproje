import { isDatabaseConfigured, queryDatabase } from "./db.js";

const MAX_RANGE_DAYS = 30;
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 1000;

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!isDatabaseConfigured) {
    return response.status(503).json({ error: "Database connection is not configured." });
  }

  const { from, to, label, dst_ip: dstIp, limit } = request.query ?? {};

  try {
    const { clauses, params } = buildFilters({ from, to, label, dstIp });
    const limitValue = deriveLimit(limit);
    const paramIndex = params.length + 1;

    const queryText = `
      select
        id,
        title,
        detection_rule,
        severity,
        status,
        ack_lane,
        source_name,
        source_ip,
        source_zone,
        destination_name,
        destination_ip,
        destination_zone,
        segment,
        event_timestamp,
        tags,
        metrics
      from events
      ${clauses.length ? `where ${clauses.join(" and ")}` : ""}
      order by event_timestamp desc
      limit $${paramIndex};
    `;

    const { rows } = await queryDatabase(queryText, [...params, limitValue]);

    return response.status(200).json(
      rows.map(transformRowToEvent)
    );
  } catch (error) {
    if (error.statusCode) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    console.error("Failed to load events:", error);
    return response.status(500).json({ error: "Failed to load events." });
  }
}

function buildFilters({ from, to, label, dstIp }) {
  const clauses = [];
  const params = [];
  let index = 1;

  let fromDate;
  let toDate;

  if (from) {
    fromDate = parseDate(from, "from");
    clauses.push(`event_timestamp >= $${index++}`);
    params.push(fromDate.toISOString());
  }

  if (to) {
    toDate = parseDate(to, "to");
    clauses.push(`event_timestamp <= $${index++}`);
    params.push(toDate.toISOString());
  }

  if (fromDate && toDate && toDate.getTime() < fromDate.getTime()) {
    throw httpError(400, "`to` date must be after `from` date.");
  }

  if (fromDate && toDate && exceedsRangeLimit(fromDate, toDate)) {
    throw httpError(400, `Date range cannot exceed ${MAX_RANGE_DAYS} days.`);
  }

  if (label) {
    clauses.push(`
      exists (
        select 1
        from unnest(coalesce(tags, array[]::text[])) as tag
        where tag ilike $${index++}
      )
    `);
    params.push(`%${label}%`);
  }

  if (dstIp) {
    clauses.push(`destination_ip = $${index++}`);
    params.push(dstIp);
  }

  return { clauses, params };
}

function deriveLimit(limitParam) {
  if (!limitParam) return DEFAULT_LIMIT;

  const parsed = Number.parseInt(limitParam, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw httpError(400, "`limit` must be a positive integer.");
  }

  return Math.min(parsed, MAX_LIMIT);
}

function parseDate(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw httpError(400, `Invalid ${label} date.`);
  }
  return date;
}

function exceedsRangeLimit(fromDate, toDate) {
  const diffMs = toDate.getTime() - fromDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > MAX_RANGE_DAYS;
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function transformRowToEvent(row) {
  const {
    id,
    title,
    detection_rule,
    severity,
    status,
    ack_lane,
    source_name,
    source_ip,
    source_zone,
    destination_name,
    destination_ip,
    destination_zone,
    segment,
    event_timestamp,
    tags,
    metrics,
  } = row;

  return {
    id,
    title,
    detectionRule: detection_rule,
    severity: (severity || "medium").toLowerCase(),
    status: (status || "active").toLowerCase(),
    ackLane: ack_lane || "triage",
    source: {
      name: source_name,
      ip: source_ip,
      zone: source_zone,
    },
    destination: {
      name: destination_name,
      ip: destination_ip,
      zone: destination_zone,
    },
    segment: segment || "Global",
    tags: parseTags(tags),
    timestamp: event_timestamp ? new Date(event_timestamp).toISOString() : new Date().toISOString(),
    metrics: normalizeMetrics(metrics),
  };
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    return tags
      .split(/[;,]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeMetrics(metrics) {
  if (!metrics) {
    return {};
  }

  if (typeof metrics === "object") {
    return metrics;
  }

  try {
    return JSON.parse(metrics);
  } catch (error) {
    console.warn("Unable to parse metrics JSON:", error);
    return {};
  }
}
