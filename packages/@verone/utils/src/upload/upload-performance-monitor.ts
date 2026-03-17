/**
 * 📊 MONITORING PERFORMANCE UPLOAD - Vérone 2025
 * Système de monitoring avancé pour uploads optimisés
 * Intégration Analytics GDPR
 */

import { gdprAnalytics } from '../analytics/gdpr-analytics';

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

/**
 * 📊 Classe principale de monitoring performance
 */
export class UploadPerformanceMonitor {
  private metrics: Map<string, UploadPerformanceMetrics> = new Map();
  private sessionMetrics: UploadPerformanceMetrics[] = [];
  private thresholds: UploadPerformanceThresholds;
  private alertsEnabled: boolean = true;

  constructor(thresholds: UploadPerformanceThresholds = VERONE_UPLOAD_SLOS) {
    this.thresholds = thresholds;
    this.initializeMonitoring();
  }

  /**
   * 🚀 Initialisation du monitoring
   */
  private initializeMonitoring(): void {
    console.warn('📊 Initialisation monitoring performance uploads');

    // Nettoyer métriques anciennes (>24h)
    this.cleanupOldMetrics();

    // Charger tendances si disponibles
    this.loadHistoricalTrends();
  }

  /**
   * 🧹 Nettoyage métriques anciennes
   */
  private cleanupOldMetrics(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24h

    this.sessionMetrics = this.sessionMetrics.filter(
      metrics => now - metrics.timing.startTime < maxAge
    );

    console.warn(
      `🧹 Nettoyage: ${this.sessionMetrics.length} métriques conservées`
    );
  }

  /**
   * 📈 Charger tendances historiques
   */
  private loadHistoricalTrends(): void {
    if (typeof window === 'undefined') return; // SSR guard

    try {
      const stored = localStorage.getItem('verone_upload_trends');
      if (stored) {
        // TODO: Intégrer avec Upstash MCP pour persistance
        console.warn('📈 Tendances historiques chargées');
      }
    } catch (error) {
      console.warn('⚠️ Impossible de charger tendances:', error);
    }
  }

  /**
   * 🎯 Démarrer monitoring d'un upload
   */
  startUploadMonitoring(
    uploadId: string,
    context: {
      fileType: string;
      originalSize: number;
      userSegment: string;
      clientType: 'b2b' | 'b2c' | 'prospect';
    }
  ): void {
    const metrics: UploadPerformanceMetrics = {
      uploadId,
      sessionId: this.generateSessionId(),
      userId: this.getCurrentUserId(),

      timing: {
        startTime: performance.now(),
        optimizationTime: 0,
        uploadTime: 0,
        totalTime: 0,
        endTime: 0,
      },

      size: {
        originalBytes: context.originalSize,
        optimizedBytes: 0,
        compressionRatio: 0,
        totalSaved: 0,
      },

      network: {
        uploadSpeedKbps: 0,
        averageChunkSpeed: 0,
        peakSpeed: 0,
        latencyMs: 0,
        retryCount: 0,
      },

      context: {
        fileType: context.fileType,
        variantsGenerated: 0,
        uploadStrategy: '',
        chunkingUsed: false,
        concurrentUploads: 1,
      },

      quality: {
        successRate: 0,
        errorCount: 0,
        warningCount: 0,
        criticalErrors: [],
      },

      business: {
        userSegment: context.userSegment,
        conversionImpact: 0,
        clientType: context.clientType,
      },
    };

    this.metrics.set(uploadId, metrics);
    console.warn(`📊 Monitoring démarré: ${uploadId}`);
  }

  /**
   * ⏱️ Enregistrer timing optimisation
   */
  recordOptimizationTime(
    uploadId: string,
    optimizationTimeMs: number,
    details: {
      variantsGenerated: number;
      compressionRatio: number;
      optimizedSize: number;
    }
  ): void {
    const metrics = this.metrics.get(uploadId);
    if (!metrics) return;

    metrics.timing.optimizationTime = optimizationTimeMs;
    metrics.context.variantsGenerated = details.variantsGenerated;
    metrics.size.optimizedBytes = details.optimizedSize;
    metrics.size.compressionRatio = details.compressionRatio;
    metrics.size.totalSaved =
      metrics.size.originalBytes - details.optimizedSize;

    // Vérifier seuils optimisation
    this.checkOptimizationThresholds(uploadId, metrics);

    console.warn(
      `⏱️ Optimisation: ${optimizationTimeMs}ms, compression: ${details.compressionRatio}%`
    );
  }

  /**
   * 🌐 Enregistrer métriques réseau
   */
  recordNetworkMetrics(
    uploadId: string,
    networkData: {
      speedKbps: number;
      latencyMs: number;
      retryCount: number;
      chunkingUsed: boolean;
    }
  ): void {
    const metrics = this.metrics.get(uploadId);
    if (!metrics) return;

    metrics.network.uploadSpeedKbps = networkData.speedKbps;
    metrics.network.latencyMs = networkData.latencyMs;
    metrics.network.retryCount = networkData.retryCount;
    metrics.context.chunkingUsed = networkData.chunkingUsed;

    // Calculer vitesse moyenne et pic
    if (networkData.speedKbps > metrics.network.peakSpeed) {
      metrics.network.peakSpeed = networkData.speedKbps;
    }

    // Vérifier seuils réseau
    this.checkNetworkThresholds(uploadId, metrics);
  }

  /**
   * ✅ Finaliser monitoring avec succès
   */
  completeUploadMonitoring(
    uploadId: string,
    results: {
      uploadStrategy: string;
      successfulUploads: number;
      totalUploads: number;
      uploadTimeMs: number;
    }
  ): UploadPerformanceReport {
    const metrics = this.metrics.get(uploadId);
    if (!metrics) {
      throw new Error(`Métriques non trouvées pour upload ${uploadId}`);
    }

    // Finaliser timing
    metrics.timing.endTime = performance.now();
    metrics.timing.uploadTime = results.uploadTimeMs;
    metrics.timing.totalTime =
      metrics.timing.endTime - metrics.timing.startTime;

    // Finaliser qualité
    metrics.context.uploadStrategy = results.uploadStrategy;
    metrics.quality.successRate =
      (results.successfulUploads / results.totalUploads) * 100;

    // Générer rapport complet
    const report = this.generatePerformanceReport(metrics);

    // Archiver métriques
    this.sessionMetrics.push(metrics);
    this.metrics.delete(uploadId);

    // Analytics GDPR si consent
    this.trackAnalytics(metrics);

    // Escalade si nécessaire
    this.handleAlertEscalation(report.alerts);

    console.warn(
      `🎉 Monitoring terminé: ${uploadId}, score: ${report.score.overall}/100`
    );

    return report;
  }

  /**
   * ❌ Enregistrer échec upload
   */
  recordUploadFailure(
    uploadId: string,
    error: {
      type: string;
      message: string;
      critical: boolean;
      phase: string;
    }
  ): void {
    const metrics = this.metrics.get(uploadId);
    if (!metrics) return;

    metrics.quality.errorCount++;

    if (error.critical) {
      metrics.quality.criticalErrors.push(`${error.phase}: ${error.message}`);
    } else {
      metrics.quality.warningCount++;
    }

    // Escalade immédiate si critique
    if (error.critical && this.alertsEnabled) {
      this.escalateCriticalError(uploadId, error);
    }
  }

  /**
   * 🔍 Vérifier seuils optimisation
   */
  private checkOptimizationThresholds(
    _uploadId: string,
    metrics: UploadPerformanceMetrics
  ): void {
    const alerts: PerformanceAlert[] = [];

    // Temps optimisation
    if (metrics.timing.optimizationTime > this.thresholds.optimizationTimeMs) {
      alerts.push({
        type: 'warning',
        metric: 'optimization_time',
        threshold: this.thresholds.optimizationTimeMs,
        actual: metrics.timing.optimizationTime,
        message: `Optimisation lente: ${metrics.timing.optimizationTime}ms > ${this.thresholds.optimizationTimeMs}ms`,
        escalationRequired: false,
      });
    }

    // Ratio compression
    if (metrics.size.compressionRatio < this.thresholds.compressionRatioMin) {
      alerts.push({
        type: 'info',
        metric: 'compression_ratio',
        threshold: this.thresholds.compressionRatioMin,
        actual: metrics.size.compressionRatio,
        message: `Compression faible: ${metrics.size.compressionRatio}% < ${this.thresholds.compressionRatioMin}%`,
        escalationRequired: false,
      });
    }

    // Log alerts
    alerts.forEach(alert => {
      console.warn(`⚠️ ${alert.type.toUpperCase()}: ${alert.message}`);
    });
  }

  /**
   * 🌐 Vérifier seuils réseau
   */
  private checkNetworkThresholds(
    _uploadId: string,
    metrics: UploadPerformanceMetrics
  ): void {
    // Vitesse upload
    if (metrics.network.uploadSpeedKbps < this.thresholds.speedKbpsMin) {
      console.warn(
        `🐌 Vitesse lente: ${metrics.network.uploadSpeedKbps}Kbps < ${this.thresholds.speedKbpsMin}Kbps`
      );
    }

    // Retry excessifs
    if (metrics.network.retryCount > 3) {
      console.warn(`🔄 Retries excessifs: ${metrics.network.retryCount}`);
    }
  }

  /**
   * 📊 Générer rapport complet
   */
  private generatePerformanceReport(
    metrics: UploadPerformanceMetrics
  ): UploadPerformanceReport {
    const alerts = this.generateAlerts(metrics);
    const recommendations = this.generateRecommendations(metrics);
    const score = this.calculatePerformanceScore(metrics);
    const trends = this.calculateTrends();

    return {
      metrics,
      alerts,
      recommendations,
      score,
      trends,
    };
  }

  /**
   * 🚨 Générer alertes
   */
  private generateAlerts(
    metrics: UploadPerformanceMetrics
  ): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    // Vérifier tous les seuils
    if (metrics.timing.totalTime > this.thresholds.totalTimeMs) {
      alerts.push({
        type: 'critical',
        metric: 'total_time',
        threshold: this.thresholds.totalTimeMs,
        actual: metrics.timing.totalTime,
        message: `Upload trop lent: ${Math.round(metrics.timing.totalTime)}ms`,
        escalationRequired: true,
        mcpAction: 'console_escalation',
      });
    }

    if (metrics.quality.successRate < this.thresholds.successRateMin) {
      alerts.push({
        type: 'critical',
        metric: 'success_rate',
        threshold: this.thresholds.successRateMin,
        actual: metrics.quality.successRate,
        message: `Taux succès faible: ${metrics.quality.successRate}%`,
        escalationRequired: true,
        mcpAction: 'console_escalation',
      });
    }

    return alerts;
  }

  /**
   * 💡 Générer recommandations
   */
  private generateRecommendations(
    metrics: UploadPerformanceMetrics
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Recommandations basées sur les métriques
    if (metrics.timing.optimizationTime > 3000) {
      recommendations.push({
        category: 'optimization',
        priority: 'medium',
        suggestion:
          'Activer compression aggressive pour réduire temps optimisation',
        estimatedImpact: '-40% temps traitement',
        implementation: 'configuration_change',
      });
    }

    if (metrics.network.uploadSpeedKbps < 500) {
      recommendations.push({
        category: 'network',
        priority: 'high',
        suggestion: 'Activer chunked upload pour améliorer performance réseau',
        estimatedImpact: '+200% vitesse upload',
        implementation: 'configuration_change',
      });
    }

    if (metrics.size.compressionRatio < 20) {
      recommendations.push({
        category: 'optimization',
        priority: 'low',
        suggestion: 'Ajuster qualité WebP pour meilleure compression',
        estimatedImpact: '+15% compression',
        implementation: 'next_session',
      });
    }

    return recommendations;
  }

  /**
   * 🏆 Calculer score performance
   */
  private calculatePerformanceScore(
    metrics: UploadPerformanceMetrics
  ): PerformanceScore {
    // Calcul scores composants (0-100)
    const speedScore = Math.min(
      100,
      (metrics.network.uploadSpeedKbps / this.thresholds.speedKbpsMin) * 100
    );
    const compressionScore = Math.min(
      100,
      (metrics.size.compressionRatio / this.thresholds.compressionRatioMin) *
        100
    );
    const reliabilityScore = metrics.quality.successRate;
    const efficiencyScore = Math.max(
      0,
      100 - (metrics.timing.totalTime / this.thresholds.totalTimeMs) * 100
    );

    // Score global pondéré
    const overall = Math.round(
      speedScore * 0.3 +
        compressionScore * 0.2 +
        reliabilityScore * 0.3 +
        efficiencyScore * 0.2
    );

    // Grade
    const grade =
      overall >= 90
        ? 'A+'
        : overall >= 80
          ? 'A'
          : overall >= 70
            ? 'B'
            : overall >= 60
              ? 'C'
              : overall >= 50
                ? 'D'
                : 'F';

    return {
      overall,
      breakdown: {
        speed: Math.round(speedScore),
        compression: Math.round(compressionScore),
        reliability: Math.round(reliabilityScore),
        efficiency: Math.round(efficiencyScore),
      },
      grade,
      comparison: {
        vsLastSession: this.calculateSessionComparison(overall),
        vsAverage: this.calculateAverageComparison(overall),
        vsBestCase: overall - 100,
      },
    };
  }

  /**
   * 📈 Calculer tendances
   */
  private calculateTrends(): PerformanceTrends {
    const recentMetrics = this.sessionMetrics.slice(-50); // 50 derniers uploads

    if (recentMetrics.length === 0) {
      return {
        period: '1h',
        uploadCount: 0,
        averageSpeed: 0,
        successRate: 0,
        compressionEfficiency: 0,
        alerts: { critical: 0, warnings: 0 },
      };
    }

    const averageSpeed =
      recentMetrics.reduce((sum, m) => sum + m.network.uploadSpeedKbps, 0) /
      recentMetrics.length;
    const successRate =
      recentMetrics.reduce((sum, m) => sum + m.quality.successRate, 0) /
      recentMetrics.length;
    const compressionEfficiency =
      recentMetrics.reduce((sum, m) => sum + m.size.compressionRatio, 0) /
      recentMetrics.length;

    return {
      period: '24h',
      uploadCount: recentMetrics.length,
      averageSpeed: Math.round(averageSpeed),
      successRate: Math.round(successRate),
      compressionEfficiency: Math.round(compressionEfficiency),
      alerts: {
        critical: recentMetrics.filter(m => m.quality.criticalErrors.length > 0)
          .length,
        warnings: recentMetrics.filter(m => m.quality.warningCount > 0).length,
      },
    };
  }

  /**
   * 📊 Analytics GDPR
   */
  private trackAnalytics(metrics: UploadPerformanceMetrics): void {
    // Tracking performance upload si consent analytics
    gdprAnalytics.trackPerformance(
      'image_upload_complete',
      metrics.timing.totalTime
    );

    // Métriques business si consent
    gdprAnalytics.trackBusinessMetric(
      'upload_performance_score',
      metrics.quality.successRate,
      {
        client_type: metrics.business.clientType,
        file_type: metrics.context.fileType,
        compression_ratio: metrics.size.compressionRatio,
        variants_generated: metrics.context.variantsGenerated,
      }
    );
  }

  /**
   * 🚨 Escalade alertes critiques
   */
  private handleAlertEscalation(alerts: PerformanceAlert[]): void {
    const criticalAlerts = alerts.filter(alert => alert.escalationRequired);

    criticalAlerts.forEach(alert => {
      if (alert.mcpAction === 'console_escalation') {
        console.warn(`🚨 Escalade alerte critique: ${alert.message}`);
      }
    });
  }

  /**
   * 💥 Escalade erreur critique
   */
  private escalateCriticalError(
    uploadId: string,
    error: { type: string; message: string; critical: boolean; phase: string }
  ): void {
    console.error(`💥 Erreur critique upload ${uploadId}:`, error);

    // TODO: Notification temps réel si configuré
  }

  /**
   * 🔧 Utilitaires privés
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getCurrentUserId(): string | undefined {
    // TODO: Intégrer avec système auth
    return undefined;
  }

  private calculateSessionComparison(currentScore: number): number {
    const lastMetrics = this.sessionMetrics[this.sessionMetrics.length - 1];
    if (!lastMetrics) return 0;

    const lastScore = this.calculatePerformanceScore(lastMetrics).overall;
    return currentScore - lastScore;
  }

  private calculateAverageComparison(currentScore: number): number {
    if (this.sessionMetrics.length === 0) return 0;

    const averageScore =
      this.sessionMetrics.reduce((sum, metrics) => {
        return sum + this.calculatePerformanceScore(metrics).overall;
      }, 0) / this.sessionMetrics.length;

    return currentScore - averageScore;
  }
}

/**
 * 🎯 Instance globale du monitor
 */
export const uploadPerformanceMonitor = new UploadPerformanceMonitor();

/**
 * 🔧 Utilitaires de monitoring
 */
export const UploadMonitoringUtils = {
  /**
   * Formater métriques pour affichage
   */
  formatMetrics(metrics: UploadPerformanceMetrics): string {
    return (
      `Upload ${metrics.uploadId}: ${Math.round(metrics.timing.totalTime)}ms, ` +
      `${Math.round(metrics.size.compressionRatio)}% compression, ` +
      `${Math.round(metrics.quality.successRate)}% succès`
    );
  },

  /**
   * Générer résumé performance
   */
  generateSummary(report: UploadPerformanceReport): string {
    const { score, metrics } = report;

    return (
      `Performance ${score.grade}: ${score.overall}/100 ` +
      `(${Math.round(metrics.timing.totalTime)}ms, ` +
      `${Math.round(metrics.size.compressionRatio)}% compression)`
    );
  },

  /**
   * Vérifier si monitoring nécessaire
   */
  shouldMonitor(fileSize: number, context: string): boolean {
    // Toujours monitorer produits et gros fichiers
    return context === 'product' || fileSize > 1024 * 1024; // >1MB
  },
};
