import { PriorityScorer } from "./scoring-engine.js";

const state = {
  kpis: null,
  events: [],
  filters: {
    severity: "all",
    status: "all",
    ackLane: "all",
    query: "",
  },
};

const elements = {
  kpiGrid: document.querySelector("[data-kpi-grid]"),
  threatSnapshot: document.querySelector("[data-threat-snapshot]"),
  sensorHealth: document.querySelector("[data-sensor-health]"),
  eventTableBody: document.querySelector("#event-table-body"),
  eventCount: document.querySelector("#event-count"),
  lastUpdated: document.querySelector("#last-updated"),
  refreshButton: document.querySelector("#refresh-button"),
  severityFilter: document.querySelector("#severity-filter"),
  statusFilter: document.querySelector("#status-filter"),
  searchFilter: document.querySelector("#search-filter"),
  ackFilter: document.querySelector("#ack-filter"),
};

const formatter = {
  date: new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    month: "short",
    day: "2-digit",
  }),
};

async function initDashboard() {
  bindEventListeners();
  await refreshData();
}

function bindEventListeners() {
  elements.refreshButton?.addEventListener("click", () => {
    refreshData();
  });

  elements.severityFilter?.addEventListener("change", (event) => {
    state.filters.severity = event.target.value;
    renderEvents();
  });

  elements.statusFilter?.addEventListener("change", (event) => {
    state.filters.status = event.target.value;
    renderEvents();
  });

  elements.ackFilter?.addEventListener("change", (event) => {
    state.filters.ackLane = event.target.value;
    renderEvents();
  });

  elements.searchFilter?.addEventListener("input", debounce((event) => {
    state.filters.query = event.target.value.trim().toLowerCase();
    renderEvents();
  }, 250));
}

async function refreshData() {
  setLoadingState(true);
  try {
    const [kpiResponse, eventsResponse] = await Promise.all([
      fetch("/api/kpi"),
      fetch("/api/events"),
    ]);

    if (!kpiResponse.ok) {
      throw new Error(`Failed to load KPI data (${kpiResponse.status})`);
    }

    if (!eventsResponse.ok) {
      throw new Error(`Failed to load event data (${eventsResponse.status})`);
    }

    const kpiData = await kpiResponse.json();
    const eventData = await eventsResponse.json();

    state.kpis = kpiData;
    // Handle both {events: []} and direct array responses
    state.events = eventData?.events ? eventData.events : (Array.isArray(eventData) ? eventData : []);

    renderKPIs();
    renderInsights();
    renderEvents();
    updateLastUpdated();
  } catch (error) {
    console.error(error);
    presentError(error);
  } finally {
    setLoadingState(false);
  }
}

function renderKPIs() {
  if (!state.kpis || !elements.kpiGrid) return;

  const { summary } = state.kpis;
  if (!summary) return;

  const cards = [
    {
      label: "Active Alerts",
      value: summary.activeAlerts.value,
      suffix: "",
      trend: summary.activeAlerts.delta,
      trendDirection: summary.activeAlerts.direction,
    },
    {
      label: "Critical Response (MTTA)",
      value: `${summary.mttaCritical.value}m`,
      trend: summary.mttaCritical.delta,
      trendDirection: summary.mttaCritical.direction,
    },
    {
      label: "Containment Success",
      value: `${Math.round(summary.containmentRate.value * 100)}%`,
      trend: `${Math.round(summary.containmentRate.delta * 100)}%`,
      trendDirection: summary.containmentRate.direction,
    },
    {
      label: "Escalated Tickets",
      value: summary.escalatedTickets.value,
      trend: summary.escalatedTickets.delta,
      trendDirection: summary.escalatedTickets.direction,
    },
  ];

  elements.kpiGrid.innerHTML = cards
    .map((card) => {
      const trendClass =
        card.trendDirection === "up"
          ? "trend-up"
          : card.trendDirection === "down"
          ? "trend-down"
          : "";
      const trendLabel =
        card.trendDirection === "up"
          ? "↑"
          : card.trendDirection === "down"
          ? "↓"
          : "→";

      return `
        <article class="card">
          <span class="card__label">${card.label}</span>
          <span class="card__value">${card.value}${card.suffix ?? ""}</span>
          <span class="card__trend ${trendClass}">
            ${trendLabel} ${formatTrendValue(card.trend)}
          </span>
        </article>
      `;
    })
    .join("");
}

function renderInsights() {
  renderThreatSnapshot();
  renderSensorHealth();
}

function renderThreatSnapshot() {
  const container = elements.threatSnapshot;
  if (!container || !state.kpis?.threatLandscape) return;

  const { segments, highestRiskWindow } = state.kpis.threatLandscape;

  const items = segments
    .map((segment) => {
      const deltaLabel = segment.direction === "up" ? "↑" : "↓";
      const deltaClass =
        segment.direction === "up" ? "trend-up" : "trend-down";

      return `
        <div class="panel-row">
          <div class="panel-row__label">
            <span>${segment.name}</span>
            <span>
              ${segment.active} active · peak ${segment.peakScore.toFixed(1)} •
              ${segment.window}
            </span>
          </div>
          <span class="panel-row__value ${deltaClass}">
            ${deltaLabel} ${formatTrendValue(segment.delta)}
          </span>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="panel-row">
      <div class="panel-row__label">
        <span>Highest risk window</span>
        <span>${highestRiskWindow.window}</span>
      </div>
      <span class="panel-row__value">${highestRiskWindow.severity}</span>
    </div>
    ${items}
  `;
}

function renderSensorHealth() {
  const container = elements.sensorHealth;
  if (!container || !state.kpis?.sensorHealth) return;

  container.innerHTML = state.kpis.sensorHealth
    .map((sensor) => {
      const statusClass =
        sensor.status === "Degraded"
          ? "trend-down"
          : sensor.status === "Maintenance"
          ? ""
          : "trend-up";

      return `
        <div class="panel-row">
          <div class="panel-row__label">
            <span>${sensor.name}</span>
            <span>${sensor.zone} • ${sensor.coverage}</span>
          </div>
          <div class="panel-row__value ${statusClass}">
            ${sensor.status} · ${(sensor.uptime * 100).toFixed(1)}% uptime
          </div>
        </div>
      `;
    })
    .join("");
}

function renderEvents() {
  if (!elements.eventTableBody) return;

  const filtered = applyFilters(state.events);
  elements.eventCount.textContent = `${filtered.length} events`;

  if (!filtered.length) {
    elements.eventTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:28px; color:rgba(255,255,255,0.55);">
          No events match the current filters. Adjust filters or refresh data.
        </td>
      </tr>
    `;
    return;
  }

  const rows = filtered
    .map((event) => {
      const scoreValue = event.score;
      const band = classifyScore(scoreValue);
      const recommendation = PriorityScorer.getRecommendation(scoreValue);
      const scoreMeta = recommendation.action;

      return renderEventRow(event, {
        score: scoreValue,
        band,
        recommendation,
        scoreMeta,
      });
    })
    .join("");

  elements.eventTableBody.innerHTML = rows;
}

function renderEventRow(event, scoreData) {
  const {
    id,
    title,
    detectionRule,
    severity,
    status,
    ackLane,
    source,
    destination,
    tags,
    timestamp,
  } = event;

  const formattedTime = formatTimestamp(timestamp);
  const severityClass = `severity-${severity}`;
  const statusClass = `status-${status}`;

  const tagMarkup = (tags || [])
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  const ackLabel = ackLane ? ` • ${ackLane}` : "";
  const ruleLabel = detectionRule ? detectionRule : "Custom correlation rule";

  return `
    <tr data-event-id="${id}">
      <td class="score-cell">
        <span class="score-chip">${Math.round(scoreData.score)}</span>
        <span class="score-meta" data-action="${scoreData.scoreMeta}">${scoreData.scoreMeta}</span>
      </td>
      <td class="${severityClass}">${severity}</td>
      <td>
        <div class="event-name">${title}</div>
        <div class="event-rule">${ruleLabel}${ackLabel}</div>
      </td>
      <td>${formatEndpoint(source)}</td>
      <td>${formatEndpoint(destination)}</td>
      <td><span class="chip status-pill ${statusClass}">${status}</span></td>
      <td class="tags">${tagMarkup}</td>
      <td>${formattedTime}</td>
    </tr>
  `;
}

function applyFilters(events) {
  const { severity, status, ackLane, query } = state.filters;

  return events
    .filter((event) => {
      if (severity !== "all" && event.severity !== severity) {
        return false;
      }

      if (status !== "all" && event.status !== status) {
        return false;
      }

      if (ackLane !== "all" && event.ackLane !== ackLane) {
        return false;
      }

      if (query) {
        const haystack = [
          event.title,
          event.detectionRule,
          event.source?.name,
          event.source?.ip,
          event.destination?.name,
          event.destination?.ip,
          event.segment,
          ...(event.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    })
    .map((event) => {
      const score = PriorityScorer.calculateScore(event);
      return {
        ...event,
        score,
      };
    })
    .sort((a, b) => {
      const scoreA =
        typeof a.scoreResult === "number" ? a.scoreResult : a.scoreResult.score;
      const scoreB =
        typeof b.scoreResult === "number" ? b.scoreResult : b.scoreResult.score;
      return scoreB - scoreA;
    });
}

function updateLastUpdated() {
  if (!elements.lastUpdated) return;

  const now = new Date();
  elements.lastUpdated.textContent = formatter.date.format(now);
  elements.lastUpdated.setAttribute("datetime", now.toISOString());
}

function setLoadingState(isLoading) {
  if (!elements.refreshButton) return;
  elements.refreshButton.disabled = isLoading;
  elements.refreshButton.textContent = isLoading ? "Refreshing…" : "Refresh Data";
}

function presentError(error) {
  if (!elements.eventTableBody) return;
  elements.eventTableBody.innerHTML = `
    <tr>
      <td colspan="8" style="padding:26px; text-align:center; color:#ff9f43;">
        ${error.message}. Check the API status or retry shortly.
      </td>
    </tr>
  `;
}

function debounce(fn, wait = 250) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), wait);
  };
}

function formatTrendValue(value) {
  if (typeof value === "number") {
    const absValue = Math.abs(value);
    if (absValue > 1) return `${absValue.toFixed(1)}%`;
    return `${absValue.toFixed(2)}%`;
  }
  return value ?? "";
}

function formatEndpoint(endpoint) {
  if (!endpoint) return "—";
  if (typeof endpoint === "string") return endpoint;
  const parts = [endpoint.name, endpoint.ip, endpoint.zone]
    .filter(Boolean)
    .join(" · ");
  return parts || "—";
}

function formatTimestamp(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatter.date.format(date);
}

function classifyScore(score) {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function bandLabel(band) {
  switch (band) {
    case "critical":
      return "Immediate response";
    case "high":
      return "Escalate within SLA";
    case "medium":
      return "Monitor closely";
    case "low":
    default:
      return "Routine review";
  }
}

initDashboard().catch((error) => {
  console.error("Failed to initialise dashboard", error);
});
