/**
 * Configuration types for POS.com RMS
 */

export interface RMSConfig {
  database: DatabaseConfig;
  server: ServerConfig;
  sla: SLAConfig;
  git: GitConfig;
  teams?: TeamsConfig;
  logging: LoggingConfig;
}

export interface DatabaseConfig {
  path: string;
  walMode: boolean;
}

export interface ServerConfig {
  port: number;
  host: string;
  corsOrigins?: string[];
}

export interface SLAConfig {
  critical: number; // hours
  high: number;
  medium: number;
  low: number;
}

export interface GitConfig {
  autoLink: boolean;
  branchPrefix: string;
  conventionalCommits: boolean;
}

export interface TeamsConfig {
  webhookUrl: string;
  enabled: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  pretty: boolean;
}

export function getDefaultConfig(): RMSConfig {
  return {
    database: {
      path: './.rms/rms.db',
      walMode: true,
    },
    server: {
      port: 3847,
      host: 'localhost',
    },
    sla: {
      critical: 4,
      high: 24,
      medium: 72,
      low: 168,
    },
    git: {
      autoLink: true,
      branchPrefix: 'rms-',
      conventionalCommits: true,
    },
    logging: {
      level: 'info',
      pretty: true,
    },
  };
}
