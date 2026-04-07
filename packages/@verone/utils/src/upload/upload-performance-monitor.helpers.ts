import type {
  PerformanceAlert,
  PerformanceRecommendation,
  PerformanceScore,
  PerformanceTrends,
  UploadPerformanceMetrics,
  UploadPerformanceThresholds,
} from './upload-performance-monitor.types';

/**
 * Vérifier seuils optimisation — log warnings si dépassés
 */
export function checkOptimizationThresholds(
  metrics: UploadPerformanceMetrics,
  thresholds: UploadPerformanceThresholds
): void {
  if (metrics.timing.optimizationTime > thresholds.optimizationTimeMs) {
    console.warn(
      `⚠️ WARNING: Optimisation lente: ${metrics.timing.optimizationTime}ms > ${thresholds.optimizationTimeMs}ms`
    );
  }

  if (metrics.size.compressionRatio < thresholds.compressionRatioMin) {
    console.warn(
      `⚠️ INFO: Compression faible: ${metrics.size.compressionRatio}% < ${thresholds.compressionRatioMin}%`
    );
  }
}

/**
 * Vérifier seuils réseau — log warnings si dépassés
 */
export function checkNetworkThresholds(
  metrics: UploadPerformanceMetrics,
  thresholds: UploadPerformanceThresholds
): void {
  if (metrics.network.uploadSpeedKbps < thresholds.speedKbpsMin) {
    console.warn(
      `🐌 Vitesse lente: ${metrics.network.uploadSpeedKbps}Kbps < ${thresholds.speedKbpsMin}Kbps`
    );
  }

  if (metrics.network.retryCount > 3) {
    console.warn(`🔄 Retries excessifs: ${metrics.network.retryCount}`);
  }
}

/**
 * Générer alertes à partir des métriques et seuils
 */
export function generateAlerts(
  metrics: UploadPerformanceMetrics,
  thresholds: UploadPerformanceThresholds
): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];

  if (metrics.timing.totalTime > thresholds.totalTimeMs) {
    alerts.push({
      type: 'critical',
      metric: 'total_time',
      threshold: thresholds.totalTimeMs,
      actual: metrics.timing.totalTime,
      message: `Upload trop lent: ${Math.round(metrics.timing.totalTime)}ms`,
      escalationRequired: true,
      mcpAction: 'console_escalation',
    });
  }

  if (metrics.quality.successRate < thresholds.successRateMin) {
    alerts.push({
      type: 'critical',
      metric: 'success_rate',
      threshold: thresholds.successRateMin,
      actual: metrics.quality.successRate,
      message: `Taux succès faible: ${metrics.quality.successRate}%`,
      escalationRequired: true,
      mcpAction: 'console_escalation',
    });
  }

  return alerts;
}

/**
 * Générer recommandations basées sur les métriques
 */
export function generateRecommendations(
  metrics: UploadPerformanceMetrics
): PerformanceRecommendation[] {
  const recommendations: PerformanceRecommendation[] = [];

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
 * Calculer score performance (0-100)
 */
export function calculatePerformanceScore(
  metrics: UploadPerformanceMetrics,
  thresholds: UploadPerformanceThresholds,
  sessionMetrics: UploadPerformanceMetrics[]
): PerformanceScore {
  const speedScore = Math.min(
    100,
    (metrics.network.uploadSpeedKbps / thresholds.speedKbpsMin) * 100
  );
  const compressionScore = Math.min(
    100,
    (metrics.size.compressionRatio / thresholds.compressionRatioMin) * 100
  );
  const reliabilityScore = metrics.quality.successRate;
  const efficiencyScore = Math.max(
    0,
    100 - (metrics.timing.totalTime / thresholds.totalTimeMs) * 100
  );

  const overall = Math.round(
    speedScore * 0.3 +
      compressionScore * 0.2 +
      reliabilityScore * 0.3 +
      efficiencyScore * 0.2
  );

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

  // Comparaisons vs historique
  const lastMetrics = sessionMetrics[sessionMetrics.length - 1];
  const vsLastSession = lastMetrics
    ? overall - calculatePerformanceScore(lastMetrics, thresholds, []).overall
    : 0;

  const vsAverage =
    sessionMetrics.length > 0
      ? overall -
        Math.round(
          sessionMetrics.reduce(
            (sum, m) =>
              sum + calculatePerformanceScore(m, thresholds, []).overall,
            0
          ) / sessionMetrics.length
        )
      : 0;

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
      vsLastSession,
      vsAverage,
      vsBestCase: overall - 100,
    },
  };
}

/**
 * Calculer tendances depuis les métriques de session
 */
export function calculateTrends(
  sessionMetrics: UploadPerformanceMetrics[]
): PerformanceTrends {
  const recentMetrics = sessionMetrics.slice(-50);

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
