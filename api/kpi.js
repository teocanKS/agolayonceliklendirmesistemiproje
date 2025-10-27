import { isDatabaseConfigured, queryDatabase } from "./db.js";
import { buildMockKpi, buildMockEvents } from "./mock-data.js";

const MAX_RANGE_DAYS = 30;

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  // If database is not configured, return mock data
  if (!isDatabaseConfigured) {
    const mockEvents = buildMockEvents();
    const mockKpi = buildMockKpi(mockEvents);
    return response.status(200).json(mockKpi);
  }

  try {
    const { fromDate, toDate } = resolveDateRange(request.query);

    const { rows } = await queryDatabase(
      `
        WITH event_data AS (
          SELECT
            CAST(COALESCE(JSON_EXTRACT(metrics, '$.score'),
                         JSON_EXTRACT(metrics, '$.impact') * 100, 0) AS DECIMAL(10,2)) as score,
            CASE
              WHEN tags IS NOT NULL AND JSON_LENGTH(tags) > 0
              THEN JSON_UNQUOTE(JSON_EXTRACT(tags, '$[0]'))
              ELSE NULL
            END as label
          FROM events
          WHERE event_timestamp >= ?
            AND event_timestamp <= ?
        ),
        summary AS (
          SELECT
            COUNT(*) as total_events,
            SUM(CASE WHEN score >= 75 THEN 1 ELSE 0 END) as high_priority_count,
            COALESCE(AVG(score), 0) as average_score
          FROM event_data
        ),
        top_labels_data AS (
          SELECT
            label,
            COUNT(*) as occurrences
          FROM event_data
          WHERE label IS NOT NULL AND label != ''
          GROUP BY label
          ORDER BY occurrences DESC
          LIMIT 5
        )
        SELECT
          s.total_events,
          s.high_priority_count,
          s.average_score,
          (
            SELECT COALESCE(
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'label', t.label,
                  'count', t.occurrences
                )
              ),
              JSON_ARRAY()
            )
            FROM top_labels_data t
          ) as top_labels
        FROM summary s;
      `,
      [fromDate.toISOString(), toDate.toISOString()]
    );

    const payload = normalizeResult(rows[0]);

    return response.status(200).json(payload);
  } catch (error) {
    if (error.statusCode) {
      return response.status(error.statusCode).json({ error: error.message });
    }

    console.error("Failed to load KPI metrics:", error);
    return response.status(500).json({ error: "Failed to load KPI metrics." });
  }
}

function resolveDateRange(query) {
  const now = new Date();
  const defaultTo = now;
  const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const fromRaw = query?.from ?? query?.start;
  const toRaw = query?.to ?? query?.end;

  const fromDate = fromRaw ? parseDate(fromRaw, "from") : defaultFrom;
  const toDate = toRaw ? parseDate(toRaw, "to") : defaultTo;

  if (toDate.getTime() < fromDate.getTime()) {
    throw httpError(400, "`to` date must be after `from` date.");
  }

  const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > MAX_RANGE_DAYS) {
    throw httpError(400, `Date range cannot exceed ${MAX_RANGE_DAYS} days.`);
  }

  return { fromDate, toDate };
}

function parseDate(value, label) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw httpError(400, `Invalid ${label} date.`);
  }
  return parsed;
}

function normalizeResult(row) {
  if (!row) {
    return {
      total_events: 0,
      high_priority_count: 0,
      average_score: 0,
      top_labels: [],
    };
  }

  // Parse top_labels if it's a JSON string
  let topLabels = [];
  if (row.top_labels) {
    if (typeof row.top_labels === 'string') {
      try {
        topLabels = JSON.parse(row.top_labels);
      } catch (error) {
        console.warn("Failed to parse top_labels:", error);
        topLabels = [];
      }
    } else if (Array.isArray(row.top_labels)) {
      topLabels = row.top_labels;
    }
  }

  return {
    total_events: Number(row.total_events ?? 0),
    high_priority_count: Number(row.high_priority_count ?? 0),
    average_score: formatAverageScore(row.average_score),
    top_labels: topLabels.map((item) => ({
      label: item.label,
      count: Number(item.count ?? item.occurrences ?? 0),
    })),
  };
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function formatAverageScore(value) {
  const numeric = Number.parseFloat(value ?? 0);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100) / 100;
}
