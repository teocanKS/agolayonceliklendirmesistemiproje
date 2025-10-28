import { PriorityScorer } from "./scoring-engine.js";

const state = {
  events: [],
};

const elements = {
  eventTableBody: document.querySelector("#event-table-body"),
  eventCount: document.querySelector("#event-count"),
  lastUpdated: document.querySelector("#last-updated"),
  refreshButton: document.querySelector("#refresh-button"),
};

const formatter = {
  date: new Intl.DateTimeFormat("tr-TR", {
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

  // Ekstra kontroller bulunmuyor.
}

async function refreshData() {
  setLoadingState(true);
  try {
    // Geçici: Sunucu/DB entegrasyonu kaldırıldı. Etkin olay verisi yok.
    state.events = [];
    renderEvents();
    updateLastUpdated();
  } catch (error) {
    console.error(error);
    presentError(error);
  } finally {
    setLoadingState(false);
  }
}


function renderEvents() {
  if (!elements.eventTableBody) return;

  const filtered = applyFilters(state.events);
  elements.eventCount.textContent = `${filtered.length} olay`;

  if (!filtered.length) {
    elements.eventTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:28px; color:rgba(255,255,255,0.55);">
          Geçerli filtrelerle eşleşen olay bulunamadı. Filtreleri değiştirin veya veriyi yenileyin.
        </td>
      </tr>
    `;
    return;
  }

  const rows = filtered
    .map((event) => {
      const scoreValue = event.score;
      const recommendation = PriorityScorer.getRecommendation(scoreValue);
      const scoreMeta = recommendation.action;

      return renderEventRow(event, {
        score: scoreValue,
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
  const ruleLabel = detectionRule ? detectionRule : "Özel korelasyon kuralı";

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
  return events
    .map((event) => {
      const score = PriorityScorer.calculateScore(event);
      return { ...event, score };
    })
    .sort((a, b) => b.score - a.score);
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
  elements.refreshButton.textContent = isLoading ? "Yükleniyor…" : "Veriyi Yenile";
}

function presentError(error) {
  if (!elements.eventTableBody) return;
  elements.eventTableBody.innerHTML = `
    <tr>
      <td colspan="8" style="padding:26px; text-align:center; color:#ff9f43;">
        ${error.message}. API durumu kontrol edin veya kısa süre sonra tekrar deneyin.
      </td>
    </tr>
  `;
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
  if (!value) return "Bilinmiyor";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatter.date.format(date);
}

// Kullanılmayan yardımcılar kaldırıldı (debounce, eğilim formatlama, skor band etiketleri).

initDashboard().catch((error) => {
  console.error("Kontrol paneli başlatılamadı", error);
});
