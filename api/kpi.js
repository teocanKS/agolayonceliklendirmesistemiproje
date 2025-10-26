import { isDatabaseConfigured, queryDatabase } from "./db.js";

const MAX_RANGE_DAYS = 30;

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!isDatabaseConfigured) {
    return response.status(503).json({ error: "Database connection is not configured." });
  }

  try {
    const { fromDate, toDate } = resolveDateRange(request.query);

    const { rows } = await queryDatabase(
      `
        with windowed as (
          select
            score,
            label
          from events
          where event_timestamp >= $1
            and event_timestamp <= $2
        ),
        summary as (
          select
            count(*)::int as total_events,
            count(*) filter (where score >= 75)::int as high_priority_count,
            coalesce(avg(score), 0)::float as average_score
          from windowed
        ),
        top_labels as (
          select
            label,
            count(*) as occurrences
          from windowed
          where label is not null and label <> ''
          group by label
          order by occurrences desc
          limit 5
        )
        select
          summary.total_events,
          summary.high_priority_count,
          summary.average_score,
          coalesce(
            (
              select json_agg(
                json_build_object(
                  'label', ordered.label,
                  'count', ordered.occurrences
                )
              )
              from (
                select label, occurrences
                from top_labels
                order by occurrences desc
              ) as ordered
            ),
            '[]'::json
          ) as top_labels
        from summary;
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

  return {
    total_events: Number(row.total_events ?? 0),
    high_priority_count: Number(row.high_priority_count ?? 0),
    average_score: formatAverageScore(row.average_score),
    top_labels: Array.isArray(row.top_labels)
      ? row.top_labels.map((item) => ({
          label: item.label,
          count: Number(item.count ?? item.occurrences ?? 0),
        }))
      : [],
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
