-- Network Event Priority Scoring Dashboard - MySQL Schema
-- This schema defines the events table for storing network security events

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS network_events CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE network_events;

-- Drop existing table if it exists
DROP TABLE IF EXISTS events;

-- Create events table
CREATE TABLE events (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  detection_rule VARCHAR(255),
  severity ENUM('critical', 'high', 'medium', 'low', 'info', 'informational') DEFAULT 'medium',
  status ENUM('active', 'acknowledged', 'resolved', 'false_positive') DEFAULT 'active',
  ack_lane VARCHAR(50) DEFAULT 'triage',

  -- Source information
  source_name VARCHAR(255),
  source_ip VARCHAR(45), -- IPv6 max length is 45 characters
  source_zone VARCHAR(100),

  -- Destination information
  destination_name VARCHAR(255),
  destination_ip VARCHAR(45),
  destination_zone VARCHAR(100),

  -- Segmentation and categorization
  segment VARCHAR(100) DEFAULT 'Global',

  -- Event timestamp
  event_timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  -- JSON fields for flexible data storage
  tags JSON COMMENT 'Array of tags/labels for the event',
  metrics JSON COMMENT 'Event metrics and scores as JSON object',

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes for performance
  INDEX idx_event_timestamp (event_timestamp),
  INDEX idx_severity (severity),
  INDEX idx_status (status),
  INDEX idx_destination_ip (destination_ip),
  INDEX idx_segment (segment),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO events (
  id, title, detection_rule, severity, status, ack_lane,
  source_name, source_ip, source_zone,
  destination_name, destination_ip, destination_zone,
  segment, event_timestamp, tags, metrics
) VALUES
(
  'EVT-240104',
  'Credentialed lateral movement from finance subnet',
  'EDR lateral movement heuristic',
  'critical',
  'active',
  'escalated',
  'FIN-LAP-22',
  '10.42.18.77',
  'Finance laptops',
  'FIN-SQL-01',
  '10.42.5.20',
  'Finance DB cluster',
  'Finance',
  DATE_SUB(NOW(), INTERVAL 6 MINUTE),
  JSON_ARRAY('lateral', 'credential-theft', 'edr'),
  JSON_OBJECT(
    'confidence', 0.92,
    'impact', 0.88,
    'urgency', 0.82,
    'assetCriticality', 0.94,
    'score', 88
  )
),
(
  'EVT-240097',
  'North-south exfiltration via uncommon protocol',
  'NDR exfiltration volume deviation',
  'high',
  'active',
  'escalated',
  'ENG-GW-03',
  '172.31.4.14',
  'Engineering gateway',
  '198.51.100.67',
  '198.51.100.67',
  'External',
  'Perimeter',
  DATE_SUB(NOW(), INTERVAL 14 MINUTE),
  JSON_ARRAY('exfiltration', 'ndr', 'anomaly'),
  JSON_OBJECT(
    'confidence', 0.84,
    'impact', 0.76,
    'urgency', 0.74,
    'score', 78
  )
),
(
  'EVT-240082',
  'Identity provider impossible travel alert',
  'IdP impossible travel baseline',
  'medium',
  'acknowledged',
  'triage',
  'IdP-Cloud',
  '203.0.113.18',
  'SaaS',
  'Admin-Account',
  '91.200.55.12',
  'Remote',
  'Cloud',
  DATE_SUB(NOW(), INTERVAL 32 MINUTE),
  JSON_ARRAY('identity', 'cloud', 'anomaly'),
  JSON_OBJECT(
    'confidence', 0.72,
    'impact', 0.44,
    'urgency', 0.56,
    'score', 57
  )
),
(
  'EVT-240076',
  'EDR quarantined ransomware beacon',
  'EDR ransomware behavioral signature',
  'high',
  'acknowledged',
  'triage',
  'OPS-LAP-11',
  '10.12.40.11',
  'Operations',
  'C2-Server',
  '203.0.113.44',
  'External',
  'Operations',
  DATE_SUB(NOW(), INTERVAL 41 MINUTE),
  JSON_ARRAY('malware', 'ransomware', 'edr'),
  JSON_OBJECT(
    'confidence', 0.89,
    'impact', 0.68,
    'urgency', 0.64,
    'score', 74
  )
),
(
  'EVT-240061',
  'Privilege escalation inside production cluster',
  'Kubernetes RBAC escalation alert',
  'critical',
  'active',
  'escalated',
  'K8S-Node-07',
  '10.70.3.7',
  'Production cluster',
  'K8S-API',
  '10.70.0.1',
  'Control plane',
  'Production',
  DATE_SUB(NOW(), INTERVAL 17 MINUTE),
  JSON_ARRAY('kubernetes', 'rbac', 'privilege-escalation'),
  JSON_OBJECT(
    'confidence', 0.95,
    'impact', 0.9,
    'urgency', 0.86,
    'score', 91
  )
),
(
  'EVT-240055',
  'Suspected phishing landing recognized',
  'Secure email gateway malicious link',
  'medium',
  'resolved',
  'triage',
  'Email-Gateway',
  '10.5.5.5',
  'Perimeter',
  'Marketing-LAP-07',
  '10.90.14.7',
  'Marketing',
  'Enterprise',
  DATE_SUB(NOW(), INTERVAL 58 MINUTE),
  JSON_ARRAY('phishing', 'email', 'training'),
  JSON_OBJECT(
    'confidence', 0.66,
    'impact', 0.32,
    'urgency', 0.28,
    'score', 42
  )
),
(
  'EVT-240048',
  'Shadow IT SaaS upload spike',
  'CASB unsanctioned app upload threshold',
  'low',
  'active',
  'watchlist',
  'Sales-User-24',
  '103.44.55.20',
  'Remote',
  'FileSharePro',
  '34.120.67.12',
  'External SaaS',
  'Remote workforce',
  DATE_SUB(NOW(), INTERVAL 75 MINUTE),
  JSON_ARRAY('casb', 'shadow-it', 'upload'),
  JSON_OBJECT(
    'confidence', 0.42,
    'impact', 0.28,
    'urgency', 0.34,
    'score', 35
  )
),
(
  'EVT-240037',
  'OT network microsegmentation bypass attempt',
  'OT IDS segmentation bypass signature',
  'high',
  'active',
  'escalated',
  'OT-Gateway-02',
  '10.150.11.2',
  'OT Gateway',
  'PLC-Factory-09',
  '10.150.21.9',
  'Production line',
  'OT',
  DATE_SUB(NOW(), INTERVAL 23 MINUTE),
  JSON_ARRAY('ot', 'segmentation', 'anomaly'),
  JSON_OBJECT(
    'confidence', 0.87,
    'impact', 0.82,
    'urgency', 0.7,
    'score', 80
  )
);

-- Create a view for easier querying of recent high-priority events
CREATE OR REPLACE VIEW high_priority_events AS
SELECT
  id,
  title,
  severity,
  status,
  source_ip,
  destination_ip,
  segment,
  event_timestamp,
  JSON_EXTRACT(metrics, '$.score') as score
FROM events
WHERE
  severity IN ('critical', 'high')
  AND status IN ('active', 'acknowledged')
  AND event_timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY event_timestamp DESC;

-- Show table structure
DESCRIBE events;

-- Display record count
SELECT COUNT(*) as total_events FROM events;
