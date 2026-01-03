-- Sprints and Sprint Issues

CREATE TABLE IF NOT EXISTS sprints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    goal TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sprint issue associations (for tracking sprint history)
CREATE TABLE IF NOT EXISTS sprint_issues (
    id TEXT PRIMARY KEY,
    sprint_id TEXT NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    removed_at TEXT,
    points INTEGER,
    UNIQUE(sprint_id, issue_id)
);

CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_dates ON sprints(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_sprint_issues_sprint ON sprint_issues(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_issues_issue ON sprint_issues(issue_id);
