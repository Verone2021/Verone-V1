/**
 * Roadmap Engine - Moteur de génération automatique de tâches
 * Utilise le framework RICE pour prioriser les tâches basées sur les badges/alertes
 *
 * RICE = (Reach × Impact × Confidence) / Effort
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

// Types de badges source
export type BadgeSource = 'stock' | 'consultations' | 'linkme' | 'organisations' | 'commandes' | 'finance';
export type BadgeSeverity = 'urgent' | 'warning' | 'info';

// Input : Données des badges
export interface BadgeData {
  source: BadgeSource;
  count: number;
  severity: BadgeSeverity;
  details?: Record<string, unknown>;
}

// Tâche générée par le moteur
export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  category: BadgeSource;
  actionUrl: string;
  actionLabel: string;
  rice: {
    reach: number;
    impact: 1 | 2 | 3;
    confidence: number;
    effortHours: number;
    score: number;
  };
  badge: BadgeData;
  createdAt: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// Règle de génération de tâche
interface TaskRule {
  id: string;
  trigger: {
    source: BadgeSource;
    minCount: number;
    severity?: BadgeSeverity[];
  };
  task: {
    titleTemplate: string;
    descriptionTemplate: string;
    actionUrl: string;
    actionLabel: string;
    rice: {
      impact: 1 | 2 | 3;
      confidence: number;
      effortHours: number;
    };
  };
}

/**
 * Règles de génération automatique
 * Chaque règle définit quand générer une tâche et ses paramètres RICE
 */
const AUTO_ROADMAP_RULES: TaskRule[] = [
  // === STOCK ===
  {
    id: 'stock-critical',
    trigger: {
      source: 'stock',
      minCount: 1,
      severity: ['urgent'],
    },
    task: {
      titleTemplate: 'Réapprovisionner {{count}} produit(s) en rupture',
      descriptionTemplate: '{{count}} produit(s) sont en rupture de stock. Action immédiate requise pour éviter la perte de ventes.',
      actionUrl: '/stocks/alertes?severity=critical',
      actionLabel: 'Voir les alertes',
      rice: {
        impact: 3, // High - perte CA directe
        confidence: 0.95,
        effortHours: 2,
      },
    },
  },
  {
    id: 'stock-low',
    trigger: {
      source: 'stock',
      minCount: 5,
      severity: ['warning'],
    },
    task: {
      titleTemplate: 'Surveiller {{count}} produit(s) à stock faible',
      descriptionTemplate: '{{count}} produit(s) ont un stock inférieur au seuil d\'alerte. Planifier un réapprovisionnement.',
      actionUrl: '/stocks/alertes?severity=low',
      actionLabel: 'Planifier réappro',
      rice: {
        impact: 2, // Medium
        confidence: 0.8,
        effortHours: 1,
      },
    },
  },

  // === CONSULTATIONS ===
  {
    id: 'consultations-pending',
    trigger: {
      source: 'consultations',
      minCount: 1,
      severity: ['urgent', 'warning'],
    },
    task: {
      titleTemplate: 'Traiter {{count}} consultation(s) en attente',
      descriptionTemplate: '{{count}} demande(s) client en attente de réponse. Répondre rapidement pour améliorer la satisfaction.',
      actionUrl: '/consultations?status=en_attente',
      actionLabel: 'Répondre',
      rice: {
        impact: 2, // Medium - satisfaction client
        confidence: 0.9,
        effortHours: 0.5,
      },
    },
  },
  {
    id: 'consultations-high-priority',
    trigger: {
      source: 'consultations',
      minCount: 3,
    },
    task: {
      titleTemplate: 'Prioriser {{count}} consultation(s) actives',
      descriptionTemplate: 'Plusieurs consultations sont en cours. Optimiser le traitement pour accélérer les réponses.',
      actionUrl: '/consultations?status=en_attente,en_cours&sort=priority',
      actionLabel: 'Voir priorités',
      rice: {
        impact: 2,
        confidence: 0.7,
        effortHours: 1,
      },
    },
  },

  // === LINKME ===
  {
    id: 'linkme-pending',
    trigger: {
      source: 'linkme',
      minCount: 1,
      severity: ['urgent', 'warning'],
    },
    task: {
      titleTemplate: 'Valider {{count}} commande(s) LinkMe',
      descriptionTemplate: '{{count}} commande(s) LinkMe en attente de validation. Traiter pour débloquer les expéditions.',
      actionUrl: '/linkme/commandes/a-traiter',
      actionLabel: 'Traiter',
      rice: {
        impact: 3, // High - CA engagé
        confidence: 0.95,
        effortHours: 0.5,
      },
    },
  },
  {
    id: 'linkme-commissions',
    trigger: {
      source: 'linkme',
      minCount: 5,
    },
    task: {
      titleTemplate: 'Vérifier les commissions LinkMe',
      descriptionTemplate: 'Plusieurs commandes LinkMe ont été traitées. Vérifier le calcul des commissions affiliés.',
      actionUrl: '/linkme/commissions',
      actionLabel: 'Vérifier',
      rice: {
        impact: 1, // Low - admin
        confidence: 0.6,
        effortHours: 0.5,
      },
    },
  },

  // === ORGANISATIONS ===
  {
    id: 'organisations-incomplete',
    trigger: {
      source: 'organisations',
      minCount: 5,
      severity: ['warning'],
    },
    task: {
      titleTemplate: 'Compléter {{count}} fiche(s) organisation',
      descriptionTemplate: '{{count}} organisation(s) ont des informations incomplètes (SIRET, adresse, etc.).',
      actionUrl: '/contacts-organisations?incomplete=true',
      actionLabel: 'Compléter',
      rice: {
        impact: 1, // Low - data quality
        confidence: 0.7,
        effortHours: 2,
      },
    },
  },

  // === COMMANDES ===
  {
    id: 'commandes-draft',
    trigger: {
      source: 'commandes',
      minCount: 3,
      severity: ['warning'],
    },
    task: {
      titleTemplate: 'Finaliser {{count}} commande(s) en brouillon',
      descriptionTemplate: '{{count}} commande(s) sont en brouillon depuis plus de 7 jours. Finaliser ou archiver.',
      actionUrl: '/commandes/clients?status=draft',
      actionLabel: 'Finaliser',
      rice: {
        impact: 2,
        confidence: 0.8,
        effortHours: 1,
      },
    },
  },

  // === FINANCE ===
  {
    id: 'finance-overdue',
    trigger: {
      source: 'finance',
      minCount: 1,
      severity: ['urgent'],
    },
    task: {
      titleTemplate: 'Relancer {{count}} facture(s) impayée(s)',
      descriptionTemplate: '{{count}} facture(s) sont échues. Effectuer les relances pour améliorer la trésorerie.',
      actionUrl: '/finance/factures?status=overdue',
      actionLabel: 'Relancer',
      rice: {
        impact: 3, // High - cash flow
        confidence: 0.9,
        effortHours: 1,
      },
    },
  },
];

/**
 * Calcule le score RICE pour une tâche
 * RICE = (Reach × Impact × Confidence) / Effort
 */
function calculateRICE(
  reach: number,
  impact: 1 | 2 | 3,
  confidence: number,
  effortHours: number
): number {
  // Normaliser reach (logarithmique pour éviter les valeurs extrêmes)
  const normalizedReach = Math.log10(Math.max(reach, 1) + 1) * 10;

  // Score final
  return (normalizedReach * impact * confidence) / Math.max(effortHours, 0.1);
}

/**
 * Détermine la priorité basée sur le score RICE
 */
function getPriority(riceScore: number): RoadmapTask['priority'] {
  if (riceScore >= 15) return 'critical';
  if (riceScore >= 10) return 'high';
  if (riceScore >= 5) return 'medium';
  return 'low';
}

/**
 * Remplace les placeholders dans un template
 */
function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    String(data[key] ?? '')
  );
}

/**
 * Vérifie si une règle match les données du badge
 */
function matchesRule(badge: BadgeData, rule: TaskRule): boolean {
  // Vérifier la source
  if (rule.trigger.source !== badge.source) return false;

  // Vérifier le count minimum
  if (badge.count < rule.trigger.minCount) return false;

  // Vérifier la sévérité si spécifiée
  if (rule.trigger.severity && !rule.trigger.severity.includes(badge.severity)) {
    return false;
  }

  return true;
}

/**
 * Génère une tâche à partir d'une règle et des données badge
 */
function createTask(badge: BadgeData, rule: TaskRule): RoadmapTask {
  const templateData = {
    count: badge.count,
    ...badge.details,
  };

  const rice = {
    reach: badge.count,
    impact: rule.task.rice.impact,
    confidence: rule.task.rice.confidence,
    effortHours: rule.task.rice.effortHours,
    score: calculateRICE(
      badge.count,
      rule.task.rice.impact,
      rule.task.rice.confidence,
      rule.task.rice.effortHours
    ),
  };

  return {
    id: `task_${rule.id}_${Date.now()}`,
    title: interpolateTemplate(rule.task.titleTemplate, templateData),
    description: interpolateTemplate(rule.task.descriptionTemplate, templateData),
    category: badge.source,
    actionUrl: rule.task.actionUrl,
    actionLabel: rule.task.actionLabel,
    rice,
    badge,
    createdAt: new Date(),
    priority: getPriority(rice.score),
  };
}

/**
 * Génère la roadmap automatique basée sur les badges actuels
 *
 * @param badges - Données des badges du sidebar
 * @returns Liste de tâches triées par score RICE décroissant
 *
 * @example
 * ```ts
 * const badges: BadgeData[] = [
 *   { source: 'stock', count: 5, severity: 'urgent' },
 *   { source: 'consultations', count: 3, severity: 'warning' },
 * ];
 * const tasks = generateRoadmap(badges);
 * // -> Tâches triées par priorité RICE
 * ```
 */
export function generateRoadmap(badges: BadgeData[]): RoadmapTask[] {
  const tasks: RoadmapTask[] = [];

  // Appliquer chaque règle sur chaque badge
  for (const badge of badges) {
    for (const rule of AUTO_ROADMAP_RULES) {
      if (matchesRule(badge, rule)) {
        tasks.push(createTask(badge, rule));
      }
    }
  }

  // Dédupliquer par règle (garder la plus récente)
  const uniqueTasks = new Map<string, RoadmapTask>();
  for (const task of tasks) {
    const ruleId = task.id.split('_').slice(0, -1).join('_'); // Remove timestamp
    const existing = uniqueTasks.get(ruleId);
    if (!existing || task.rice.score > existing.rice.score) {
      uniqueTasks.set(ruleId, task);
    }
  }

  // Trier par score RICE décroissant
  return Array.from(uniqueTasks.values())
    .sort((a, b) => b.rice.score - a.rice.score);
}

/**
 * Filtre les tâches par priorité minimum
 */
export function filterByPriority(
  tasks: RoadmapTask[],
  minPriority: RoadmapTask['priority']
): RoadmapTask[] {
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const minOrder = priorityOrder[minPriority];

  return tasks.filter(task => priorityOrder[task.priority] >= minOrder);
}

/**
 * Limite le nombre de tâches retournées
 */
export function limitTasks(tasks: RoadmapTask[], limit: number): RoadmapTask[] {
  return tasks.slice(0, limit);
}

// Export des règles pour tests
export { AUTO_ROADMAP_RULES };
