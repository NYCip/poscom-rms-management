-- Issue Relationships
-- Supports: blocks, blocked_by, duplicates, duplicated_by, relates_to

CREATE TABLE IF NOT EXISTS issue_relationships (
    id TEXT PRIMARY KEY,
    from_issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    to_issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('blocks', 'blocked_by', 'duplicates', 'duplicated_by', 'relates_to')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(from_issue_id, to_issue_id, type)
);

CREATE INDEX IF NOT EXISTS idx_relationships_from ON issue_relationships(from_issue_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON issue_relationships(to_issue_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON issue_relationships(type);
