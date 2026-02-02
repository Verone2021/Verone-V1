import { existsSync } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 📝 API Route - Console Error Logs
 *
 * Stockage simple des logs console en fichiers JSON
 * Compatible avec Console Error Tracker client-side
 */

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  receivedAt?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    // Type guard for log entry
    const isValidLogEntry = (obj: unknown): obj is LogEntry => {
      if (typeof obj !== 'object' || obj === null) return false;
      const entry = obj as Record<string, unknown>;
      return (
        typeof entry.timestamp === 'string' &&
        typeof entry.level === 'string' &&
        typeof entry.message === 'string'
      );
    };

    // Validation basique
    if (!isValidLogEntry(body)) {
      return NextResponse.json(
        { error: 'Champs requis: timestamp, level, message' },
        { status: 400 }
      );
    }

    // Créer répertoire logs si n'existe pas
    const logsDir = path.join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      await mkdir(logsDir, { recursive: true });
    }

    // Nom fichier : logs-YYYY-MM-DD.json
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `logs-${date}.json`);

    // Lire fichier existant ou créer nouveau
    let logs: LogEntry[] = [];
    if (existsSync(logFile)) {
      const content = await import('fs').then(fs =>
        fs.promises.readFile(logFile, 'utf-8')
      );
      try {
        const parsed: unknown = JSON.parse(content);
        logs = Array.isArray(parsed) ? (parsed as LogEntry[]) : [];
      } catch {
        logs = [];
      }
    }

    // Ajouter nouveau log
    logs.push({
      ...body,
      receivedAt: new Date().toISOString(),
    });

    // Écrire fichier (limiter à 1000 logs par fichier)
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }

    await writeFile(logFile, JSON.stringify(logs, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Log enregistré',
      file: `logs-${date}.json`,
    });
  } catch (error) {
    console.error('Erreur enregistrement log:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * 📊 GET - Récupérer logs du jour
 */
export async function GET(_request: NextRequest) {
  try {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(process.cwd(), 'logs', `logs-${date}.json`);

    if (!existsSync(logFile)) {
      return NextResponse.json({ logs: [], count: 0 });
    }

    const content = await import('fs').then(fs =>
      fs.promises.readFile(logFile, 'utf-8')
    );
    const parsed: unknown = JSON.parse(content);
    const logs: LogEntry[] = Array.isArray(parsed)
      ? (parsed as LogEntry[])
      : [];

    return NextResponse.json({
      logs,
      count: logs.length,
      date,
    });
  } catch (error) {
    console.error('Erreur lecture logs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
