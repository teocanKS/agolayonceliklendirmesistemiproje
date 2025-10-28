const SCALE = 100;
const MIN_SEVERITY = 1;
const MAX_SEVERITY = 5;
const MIN_CRITICALITY = 1;
const MAX_CRITICALITY = 5;
const MAX_VOLUME = 1_000_000; // bytes per second ceiling used for normalization
const SEVERITY_MAP = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
  informational: 1,
};

export class PriorityScorer {
  static weights = {
    severity: 0.35,
    criticality: 0.30,
    attack: 0.20,
    volume: 0.10,
    hour: 0.05,
  };

  static calculateScore(event = {}) {
    const severityValue = this.parseSeverity(event.severity);
    const severityScore = this.normaliseNumber(
      severityValue,
      MIN_SEVERITY,
      MAX_SEVERITY
    );

    const criticalityScore = this.normaliseNumber(
      this.parseCriticality(event.asset_criticality ?? event.assetCriticality),
      MIN_CRITICALITY,
      MAX_CRITICALITY
    );

    const attackScore = event.label && event.label !== "Normal" ? 1 : 0;

    const volumeScore = this.normaliseNumber(
      event.flow_bytes_per_s,
      0,
      MAX_VOLUME
    );

    const hourScore = this.isOvernightWindow(event.timestamp) ? 1 : 0;

    const weightedScore =
      severityScore * this.weights.severity +
      criticalityScore * this.weights.criticality +
      attackScore * this.weights.attack +
      volumeScore * this.weights.volume +
      hourScore * this.weights.hour;

    return Math.round(this.clamp(weightedScore, 0, 1) * SCALE);
  }

  static getRecommendation(score) {
    if (score >= 80) {
      return { action: "ENGELLE", color: "#ff557a" };
    }
    if (score >= 60) {
      return { action: "YÜKSELT", color: "#ff9f43" };
    }
    return { action: "İZLE", color: "#6be3a1" };
  }

  static normaliseNumber(value, min, max) {
    if (value == null) return 0;
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return 0;

    const clamped = this.clamp(numericValue, min, max);
    if (max === min) {
      return 0;
    }

    return (clamped - min) / (max - min);
  }

  static isOvernightWindow(timestamp) {
    if (!timestamp) return false;
    const date = typeof timestamp === "string" || typeof timestamp === "number"
      ? new Date(timestamp)
      : timestamp;

    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      const hour = date.getUTCHours();
      return hour >= 1 && hour <= 4;
    }
    return false;
  }

  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  static parseSeverity(value) {
    if (value == null) return MIN_SEVERITY;
    if (typeof value === "string") {
      const mapped = SEVERITY_MAP[value.toLowerCase()];
      if (mapped) {
        return mapped;
      }
    }
    return Number.isFinite(Number(value)) ? Number(value) : MIN_SEVERITY;
  }

  static parseCriticality(value) {
    if (value == null) return MIN_CRITICALITY;
    return Number.isFinite(Number(value)) ? Number(value) : MIN_CRITICALITY;
  }
}
