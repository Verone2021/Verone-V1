export interface UploadPerformanceMetrics {
  // Identifiants
  uploadId: string;
  sessionId: string;
  userId?: string;

  // Timing détaillé
  timing: {
    startTime: number;
    optimizationTime: number;
    uploadTime: number;
    totalTime: number;
    endTime: number;
  };

  // Métriques taille/compression
  size: {
    originalBytes: number;
    optimizedBytes: number;
    compressionRatio: number;
    totalSaved: number;
  };

  // Performance réseau
  network: {
    uploadSpeedKbps: number;
    averageChunkSpeed: number;
    peakSpeed: number;
    latencyMs: number;
    retryCount: number;
  };

  // Contexte upload
  context: {
    fileType: string;
    variantsGenerated: number;
    uploadStrategy: string;
    chunkingUsed: boolean;
    concurrentUploads: number;
  };

  // Qualité/Erreurs
  quality: {
    successRate: number;
    errorCount: number;
    warningCount: number;
    criticalErrors: string[];
  };

  // Business metrics
  business: {
    userSegment: string;
    conversionImpact: number;
    productCategory?: string;
    clientType: 'b2b' | 'b2c' | 'prospect';
  };
}

export interface UploadPerformanceThresholds {
  // SLO targets Vérone
  optimizationTimeMs: number;
  uploadTimeMs: number;
  totalTimeMs: number;
  compressionRatioMin: number;
  successRateMin: number;
  speedKbpsMin: number;
}

export interface PerformanceAlert {
  type: 'warning' | 'critical' | 'info';
  metric: string;
  threshold: number;
  actual: number;
  message: string;
  escalationRequired: boolean;
  mcpAction?: string;
}

export interface UploadPerformanceReport {
  metrics: UploadPerformanceMetrics;
  alerts: PerformanceAlert[];
  recommendations: PerformanceRecommendation[];
  score: PerformanceScore;
  trends: PerformanceTrends;
}

export interface PerformanceRecommendation {
  category: 'optimization' | 'network' | 'configuration' | 'hardware';
  priority: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
  estimatedImpact: string;
  implementation: 'immediate' | 'next_session' | 'configuration_change';
}

export interface PerformanceScore {
  overall: number; // 0-100
  breakdown: {
    speed: number;
    compression: number;
    reliability: number;
    efficiency: number;
  };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  comparison: {
    vsLastSession: number;
    vsAverage: number;
    vsBestCase: number;
  };
}

export interface PerformanceTrends {
  period: '1h' | '24h' | '7d' | '30d';
  uploadCount: number;
  averageSpeed: number;
  successRate: number;
  compressionEfficiency: number;
  alerts: {
    critical: number;
    warnings: number;
  };
}

// Configuration SLO Vérone pour uploads
export const VERONE_UPLOAD_SLOS: UploadPerformanceThresholds = {
  optimizationTimeMs: 5000, // <5s pour optimisation
  uploadTimeMs: 10000, // <10s pour upload
  totalTimeMs: 15000, // <15s total
  compressionRatioMin: 30, // >30% compression
  successRateMin: 95, // >95% succès
  speedKbpsMin: 1000, // >1Mbps upload
};
