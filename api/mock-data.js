const severityRank = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function buildMockEvents(now = Date.now()) {
  const base = typeof now === "number" ? now : Date.now();

  const minutesAgo = (offset) => new Date(base - offset * 60 * 1000).toISOString();

  return [
    {
      id: "EVT-240104",
      title: "Credentialed lateral movement from finance subnet",
      detectionRule: "EDR lateral movement heuristic",
      severity: "critical",
      status: "active",
      ackLane: "escalated",
      source: { name: "FIN-LAP-22", ip: "10.42.18.77", zone: "Finance laptops" },
      destination: { name: "FIN-SQL-01", ip: "10.42.5.20", zone: "Finance DB cluster" },
      segment: "Finance",
      tags: ["lateral", "credential-theft", "edr"],
      timestamp: minutesAgo(6),
      metrics: {
        confidence: 0.92,
        impact: 0.88,
        urgency: 0.82,
        assetCriticality: 0.94,
        userSensitivity: 0.78,
        threatIntelHits: 3,
        correlatedEvents: 5,
        dwellTimeMinutes: 28,
        slaMinutesRemaining: 12,
        lateralMovement: 0.92,
        containmentProgress: 0.18,
      },
    },
    {
      id: "EVT-240097",
      title: "North-south exfiltration via uncommon protocol",
      detectionRule: "NDR exfiltration volume deviation",
      severity: "high",
      status: "active",
      ackLane: "escalated",
      source: { name: "ENG-GW-03", ip: "172.31.4.14", zone: "Engineering gateway" },
      destination: { name: "198.51.100.67", ip: "198.51.100.67", zone: "External" },
      segment: "Perimeter",
      tags: ["exfiltration", "ndr", "anomaly"],
      timestamp: minutesAgo(14),
      metrics: {
        confidence: 0.84,
        impact: 0.76,
        urgency: 0.74,
        assetCriticality: 0.73,
        userSensitivity: 0.42,
        threatIntelHits: 2,
        correlatedEvents: 4,
        dwellTimeMinutes: 52,
        slaMinutesRemaining: 24,
        lateralMovement: 0.34,
        containmentProgress: 0.22,
      },
    },
    {
      id: "EVT-240082",
      title: "Identity provider impossible travel alert",
      detectionRule: "IdP impossible travel baseline",
      severity: "medium",
      status: "acknowledged",
      ackLane: "triage",
      source: { name: "IdP-Cloud", ip: "203.0.113.18", zone: "SaaS" },
      destination: { name: "Admin-Account", ip: "91.200.55.12", zone: "Remote" },
      segment: "Cloud",
      tags: ["identity", "cloud", "anomaly"],
      timestamp: minutesAgo(32),
      metrics: {
        confidence: 0.72,
        impact: 0.44,
        urgency: 0.56,
        assetCriticality: 0.58,
        userSensitivity: 0.66,
        threatIntelHits: 0,
        correlatedEvents: 1,
        dwellTimeMinutes: 18,
        slaMinutesRemaining: 48,
        lateralMovement: 0.12,
        containmentProgress: 0.36,
      },
    },
    {
      id: "EVT-240076",
      title: "EDR quarantined ransomware beacon",
      detectionRule: "EDR ransomware behavioral signature",
      severity: "high",
      status: "acknowledged",
      ackLane: "triage",
      source: { name: "OPS-LAP-11", ip: "10.12.40.11", zone: "Operations" },
      destination: { name: "C2-Server", ip: "203.0.113.44", zone: "External" },
      segment: "Operations",
      tags: ["malware", "ransomware", "edr"],
      timestamp: minutesAgo(41),
      metrics: {
        confidence: 0.89,
        impact: 0.68,
        urgency: 0.64,
        assetCriticality: 0.61,
        userSensitivity: 0.38,
        threatIntelHits: 4,
        correlatedEvents: 2,
        dwellTimeMinutes: 36,
        slaMinutesRemaining: 18,
        lateralMovement: 0.22,
        containmentProgress: 0.4,
      },
    },
    {
      id: "EVT-240061",
      title: "Privilege escalation inside production cluster",
      detectionRule: "Kubernetes RBAC escalation alert",
      severity: "critical",
      status: "active",
      ackLane: "escalated",
      source: { name: "K8S-Node-07", ip: "10.70.3.7", zone: "Production cluster" },
      destination: { name: "K8S-API", ip: "10.70.0.1", zone: "Control plane" },
      segment: "Production",
      tags: ["kubernetes", "rbac", "privilege-escalation"],
      timestamp: minutesAgo(17),
      metrics: {
        confidence: 0.95,
        impact: 0.9,
        urgency: 0.86,
        assetCriticality: 0.96,
        userSensitivity: 0.82,
        threatIntelHits: 5,
        correlatedEvents: 6,
        dwellTimeMinutes: 15,
        slaMinutesRemaining: 8,
        lateralMovement: 0.78,
        containmentProgress: 0.12,
      },
    },
    {
      id: "EVT-240055",
      title: "Suspected phishing landing recognized",
      detectionRule: "Secure email gateway malicious link",
      severity: "medium",
      status: "resolved",
      ackLane: "triage",
      source: { name: "Email-Gateway", ip: "10.5.5.5", zone: "Perimeter" },
      destination: { name: "Marketing-LAP-07", ip: "10.90.14.7", zone: "Marketing" },
      segment: "Enterprise",
      tags: ["phishing", "email", "training"],
      timestamp: minutesAgo(58),
      metrics: {
        confidence: 0.66,
        impact: 0.32,
        urgency: 0.28,
        assetCriticality: 0.35,
        userSensitivity: 0.22,
        threatIntelHits: 1,
        correlatedEvents: 1,
        dwellTimeMinutes: 9,
        slaMinutesRemaining: 50,
        lateralMovement: 0.05,
        containmentProgress: 0.86,
      },
    },
    {
      id: "EVT-240048",
      title: "Shadow IT SaaS upload spike",
      detectionRule: "CASB unsanctioned app upload threshold",
      severity: "low",
      status: "active",
      ackLane: "watchlist",
      source: { name: "Sales-User-24", ip: "103.44.55.20", zone: "Remote" },
      destination: { name: "FileSharePro", ip: "34.120.67.12", zone: "External SaaS" },
      segment: "Remote workforce",
      tags: ["casb", "shadow-it", "upload"],
      timestamp: minutesAgo(75),
      metrics: {
        confidence: 0.42,
        impact: 0.28,
        urgency: 0.34,
        assetCriticality: 0.21,
        userSensitivity: 0.44,
        threatIntelHits: 0,
        correlatedEvents: 0,
        dwellTimeMinutes: 120,
        slaMinutesRemaining: 180,
        lateralMovement: 0.08,
        containmentProgress: 0.18,
      },
    },
    {
      id: "EVT-240037",
      title: "OT network microsegmentation bypass attempt",
      detectionRule: "OT IDS segmentation bypass signature",
      severity: "high",
      status: "active",
      ackLane: "escalated",
      source: { name: "OT-Gateway-02", ip: "10.150.11.2", zone: "OT Gateway" },
      destination: { name: "PLC-Factory-09", ip: "10.150.21.9", zone: "Production line" },
      segment: "OT",
      tags: ["ot", "segmentation", "anomaly"],
      timestamp: minutesAgo(23),
      metrics: {
        confidence: 0.87,
        impact: 0.82,
        urgency: 0.7,
        assetCriticality: 0.88,
        userSensitivity: 0.53,
        threatIntelHits: 2,
        correlatedEvents: 3,
        dwellTimeMinutes: 38,
        slaMinutesRemaining: 16,
        lateralMovement: 0.64,
        containmentProgress: 0.24,
      },
    },
  ];
}

export function buildMockKpi(events) {
  const activeEvents = events.filter((event) => event.status !== "resolved");
  const escalatedEvents = activeEvents.filter((event) => event.ackLane === "escalated");
  const containmentAverage =
    events.reduce((acc, event) => acc + (event.metrics?.containmentProgress ?? 0), 0) /
    (events.length || 1);

  const summary = {
    activeAlerts: trendObject(activeEvents.length, 12),
    mttaCritical: trendObject(14, -3),
    containmentRate: trendObject(containmentAverage, 0.04),
    escalatedTickets: trendObject(escalatedEvents.length, 2),
  };

  const segments = buildSegmentLandscape(events);
  const highestRiskSegment = segments.slice().sort((a, b) => b.peakScore - a.peakScore)[0];

  const threatLandscape = {
    highestRiskWindow: highestRiskSegment
      ? {
          window: `${highestRiskSegment.name} · ${highestRiskSegment.window}`,
          severity: highestRiskSegment.peakScore >= 85
            ? "Critical"
            : highestRiskSegment.peakScore >= 70
            ? "High"
            : "Elevated",
        }
      : {
          window: "Global · Last 24h",
          severity: "Stable",
        },
    segments,
  };

  const sensorHealth = [
    {
      name: "IDS-Core-01",
      status: "Healthy",
      uptime: 0.992,
      coverage: "East-West segmentation",
      zone: "Core network",
    },
    {
      name: "NDR-Edge-02",
      status: "Healthy",
      uptime: 0.984,
      coverage: "Inbound/Outbound flows",
      zone: "Perimeter",
    },
    {
      name: "EDR-Fleet",
      status: "Maintenance",
      uptime: 0.961,
      coverage: "Endpoints (92%)",
      zone: "Corporate",
    },
    {
      name: "SIEM-Collector-Cloud",
      status: "Degraded",
      uptime: 0.903,
      coverage: "SaaS telemetry",
      zone: "Cloud",
    },
  ];

  return {
    summary,
    threatLandscape,
    sensorHealth,
    generatedAt: new Date().toISOString(),
  };
}

function buildSegmentLandscape(events) {
  const map = new Map();

  for (const event of events) {
    const key = event.segment ?? "Uncategorised";
    const current = map.get(key) ?? {
      name: key,
      total: 0,
      active: 0,
      dwellTotal: 0,
      impactTotal: 0,
      highestSeverity: "low",
    };

    current.total += 1;
    if (event.status !== "resolved") {
      current.active += 1;
    }

    current.dwellTotal += event.metrics?.dwellTimeMinutes ?? 0;
    current.impactTotal += event.metrics?.impact ?? 0.5;

    if ((severityRank[event.severity] ?? 0) > (severityRank[current.highestSeverity] ?? 0)) {
      current.highestSeverity = event.severity;
    }

    map.set(key, current);
  }

  const entries = Array.from(map.values());
  const totalEvents = events.length || 1;

  return entries.map((entry) => {
    const avgDwell = entry.dwellTotal / Math.max(entry.total, 1);
    const avgImpact = entry.impactTotal / Math.max(entry.total, 1);
    const severityWeight = severityRank[entry.highestSeverity] ?? 1;
    const peakScore = clamp(48 + severityWeight * 10 + avgImpact * 24, 0, 100);
    const delta = round((entry.active / totalEvents) * 12 - 3, 2);
    const direction = delta >= 0 ? "up" : "down";

    return {
      name: entry.name,
      active: entry.active,
      delta,
      direction,
      peakScore,
      window: `Last ${Math.max(15, Math.round(avgDwell / 5) * 5) || 15}m`,
    };
  });
}

function trendObject(value, delta) {
  return {
    value,
    delta,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, precision = 2) {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
