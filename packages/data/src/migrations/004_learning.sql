-- Learning and Pattern Detection tables for RMS-Learner agent

-- Track AI categorization overrides for learning
CREATE TABLE IF NOT EXISTS ai_overrides (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    original_value TEXT,
    original_confidence REAL,
    override_value TEXT NOT NULL,
    override_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Detected patterns
CREATE TABLE IF NOT EXISTS learning_patterns (
    id TEXT PRIMARY KEY,
    pattern_type TEXT NOT NULL,
    pattern_data_json TEXT NOT NULL,
    confidence REAL NOT NULL,
    sample_count INTEGER NOT NULL DEFAULT 1,
    first_detected_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1
);

-- Agent performance metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
    id TEXT PRIMARY KEY,
    agent_name TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Issue resolution history for pattern learning
CREATE TABLE IF NOT EXISTS resolution_history (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    duration_minutes INTEGER,
    transitioned_by TEXT,
    transitioned_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_overrides_issue ON ai_overrides(issue_id);
CREATE INDEX IF NOT EXISTS idx_ai_overrides_field ON ai_overrides(field_name);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_active ON learning_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent ON agent_metrics(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_name ON agent_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_recorded ON agent_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_resolution_history_issue ON resolution_history(issue_id);
