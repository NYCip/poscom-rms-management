-- POS.com RMS Initial Schema
-- Creates core tables for issue management

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('bug', 'feature', 'improvement', 'task', 'epic', 'story')),
    category TEXT,
    ai_confidence REAL CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
    status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    sla_tier TEXT CHECK (sla_tier IS NULL OR sla_tier IN ('critical', 'high', 'medium', 'low')),
    sla_deadline INTEGER,
    assignee TEXT,
    reporter TEXT NOT NULL DEFAULT 'system',
    sprint_id TEXT,
    parent_id TEXT REFERENCES issues(id) ON DELETE SET NULL,
    branch_name TEXT,
    pr_url TEXT,
    resolution TEXT,
    labels_json TEXT DEFAULT '[]',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    original_path TEXT NOT NULL,
    annotated_path TEXT,
    annotations_json TEXT DEFAULT '[]',
    context_json TEXT,
    ocr_text TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_assignee ON issues(assignee);
CREATE INDEX IF NOT EXISTS idx_issues_sprint_id ON issues(sprint_id);
CREATE INDEX IF NOT EXISTS idx_issues_parent_id ON issues(parent_id);
CREATE INDEX IF NOT EXISTS idx_issues_sla_deadline ON issues(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);

CREATE INDEX IF NOT EXISTS idx_screenshots_issue_id ON screenshots(issue_id);
CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);

-- Full-text search for issues
CREATE VIRTUAL TABLE IF NOT EXISTS issues_fts USING fts5(
    id,
    title,
    description,
    content='issues',
    content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS issues_ai AFTER INSERT ON issues BEGIN
    INSERT INTO issues_fts(rowid, id, title, description)
    VALUES (NEW.rowid, NEW.id, NEW.title, NEW.description);
END;

CREATE TRIGGER IF NOT EXISTS issues_ad AFTER DELETE ON issues BEGIN
    INSERT INTO issues_fts(issues_fts, rowid, id, title, description)
    VALUES('delete', OLD.rowid, OLD.id, OLD.title, OLD.description);
END;

CREATE TRIGGER IF NOT EXISTS issues_au AFTER UPDATE ON issues BEGIN
    INSERT INTO issues_fts(issues_fts, rowid, id, title, description)
    VALUES('delete', OLD.rowid, OLD.id, OLD.title, OLD.description);
    INSERT INTO issues_fts(rowid, id, title, description)
    VALUES (NEW.rowid, NEW.id, NEW.title, NEW.description);
END;
