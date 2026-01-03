-- CLI Command execution tracking for Dashboard-CLI bridge

CREATE TABLE IF NOT EXISTS cli_commands (
    id TEXT PRIMARY KEY,
    command TEXT NOT NULL,
    args_json TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    output TEXT,
    error_output TEXT,
    exit_code INTEGER,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT DEFAULT 'dashboard'
);

-- Command history for quick access
CREATE TABLE IF NOT EXISTS command_history (
    id TEXT PRIMARY KEY,
    command_text TEXT NOT NULL,
    last_used_at TEXT NOT NULL DEFAULT (datetime('now')),
    use_count INTEGER NOT NULL DEFAULT 1,
    UNIQUE(command_text)
);

CREATE INDEX IF NOT EXISTS idx_cli_commands_status ON cli_commands(status);
CREATE INDEX IF NOT EXISTS idx_cli_commands_created ON cli_commands(created_at);
CREATE INDEX IF NOT EXISTS idx_command_history_used ON command_history(last_used_at);
CREATE INDEX IF NOT EXISTS idx_command_history_count ON command_history(use_count);
