/**
 * Screenshot types for POS.com RMS
 */

export interface Screenshot {
  id: string;
  issueId: string;
  originalPath: string;
  annotatedPath: string | null;
  annotations: ScreenshotAnnotation[];
  context: ScreenshotContext | null;
  ocrText: string | null;
  createdAt: Date;
}

export interface ScreenshotAnnotation {
  type: 'arrow' | 'rectangle' | 'ellipse' | 'text' | 'freehand';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
  color: string;
  strokeWidth: number;
}

export interface ScreenshotContext {
  url?: string;
  viewport?: {
    width: number;
    height: number;
  };
  consoleErrors?: string[];
  networkErrors?: string[];
  timestamp: Date;
  userAgent?: string;
}

export interface CreateScreenshotInput {
  issueId: string;
  originalPath: string;
  context?: ScreenshotContext;
}

export interface UpdateScreenshotInput {
  annotatedPath?: string;
  annotations?: ScreenshotAnnotation[];
  ocrText?: string;
}
