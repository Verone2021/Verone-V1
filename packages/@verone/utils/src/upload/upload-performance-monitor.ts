/**
 * 📊 MONITORING PERFORMANCE UPLOAD - Vérone 2025
 * Système de monitoring avancé pour uploads optimisés
 * Intégration Analytics GDPR
 */

import { gdprAnalytics } from '../analytics/gdpr-analytics';

import {
  calculatePerformanceScore,
  calculateTrends,
  checkNetworkThresholds,
  checkOptimizationThresholds,
  generateAlerts,
  generateRecommendations,
} from './upload-performance-monitor.helpers';
import type {
  PerformanceAlert,
  UploadPerformanceReport,
  UploadPerformanceThresholds,
} from './upload-performance-monitor.types';
import { VERONE_UPLOAD_SLOS } from './upload-performance-monitor.types';

export type {
  PerformanceAlert,
  PerformanceRecommendation,
  PerformanceScore,
  PerformanceTrends,
  UploadPerformanceMetrics,
  UploadPerformanceReport,
  UploadPerformanceThresholds,
} from './upload-performance-monitor.types';
export { VERONE_UPLOAD_SLOS } from './upload-performance-monitor.types';

import type { UploadPerformanceMetrics } from './upload-performance-monitor.types';

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

  private initializeMonitoring(): void {
    this.cleanupOldMetrics();
    this.loadHistoricalTrends();
  }

  private cleanupOldMetrics(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24h
    this.sessionMetrics = this.sessionMetrics.filter(
      metrics => now - metrics.timing.startTime < maxAge
    );
  }

  private loadHistoricalTrends(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('verone_upload_trends');
      if (stored) {
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

    checkOptimizationThresholds(metrics, this.thresholds);

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

    if (networkData.speedKbps > metrics.network.peakSpeed) {
      metrics.network.peakSpeed = networkData.speedKbps;
    }

    checkNetworkThresholds(metrics, this.thresholds);
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

    metrics.timing.endTime = performance.now();
    metrics.timing.uploadTime = results.uploadTimeMs;
    metrics.timing.totalTime =
      metrics.timing.endTime - metrics.timing.startTime;
    metrics.context.uploadStrategy = results.uploadStrategy;
    metrics.quality.successRate =
      (results.successfulUploads / results.totalUploads) * 100;

    const report = this.generatePerformanceReport(metrics);

    this.sessionMetrics.push(metrics);
    this.metrics.delete(uploadId);

    this.trackAnalytics(metrics);
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

    if (error.critical && this.alertsEnabled) {
      this.escalateCriticalError(uploadId, error);
    }
  }

  private generatePerformanceReport(
    metrics: UploadPerformanceMetrics
  ): UploadPerformanceReport {
    return {
      metrics,
      alerts: generateAlerts(metrics, this.thresholds),
      recommendations: generateRecommendations(metrics),
      score: calculatePerformanceScore(
        metrics,
        this.thresholds,
        this.sessionMetrics
      ),
      trends: calculateTrends(this.sessionMetrics),
    };
  }

  private trackAnalytics(metrics: UploadPerformanceMetrics): void {
    gdprAnalytics.trackPerformance(
      'image_upload_complete',
      metrics.timing.totalTime
    );
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

  private handleAlertEscalation(alerts: PerformanceAlert[]): void {
    alerts
      .filter(alert => alert.escalationRequired)
      .forEach(alert => {
        if (alert.mcpAction === 'console_escalation') {
          console.warn(`🚨 Escalade alerte critique: ${alert.message}`);
        }
      });
  }

  private escalateCriticalError(
    uploadId: string,
    error: { type: string; message: string; critical: boolean; phase: string }
  ): void {
    console.error(`💥 Erreur critique upload ${uploadId}:`, error);
    // TODO: Notification temps réel si configuré
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getCurrentUserId(): string | undefined {
    // TODO: Intégrer avec système auth
    return undefined;
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
  formatMetrics(metrics: UploadPerformanceMetrics): string {
    return (
      `Upload ${metrics.uploadId}: ${Math.round(metrics.timing.totalTime)}ms, ` +
      `${Math.round(metrics.size.compressionRatio)}% compression, ` +
      `${Math.round(metrics.quality.successRate)}% succès`
    );
  },

  generateSummary(report: UploadPerformanceReport): string {
    const { score, metrics } = report;
    return (
      `Performance ${score.grade}: ${score.overall}/100 ` +
      `(${Math.round(metrics.timing.totalTime)}ms, ` +
      `${Math.round(metrics.size.compressionRatio)}% compression)`
    );
  },

  shouldMonitor(fileSize: number, context: string): boolean {
    return context === 'product' || fileSize > 1024 * 1024;
  },
};
