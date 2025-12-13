#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const logPath = path.join(process.cwd(), 'ts-errors-raw.log');
const logContent = fs.readFileSync(logPath, 'utf8');

// Regex corrigée pour format : src/file.tsx(ligne,col): error TS2322: message
const errorRegex = /^(src\/[^(]+)\((\d+),(\d+)\): error (TS\d+): (.+)$/gm;
const errors = [];
let match;

while ((match = errorRegex.exec(logContent)) !== null) {
  errors.push({
    file: match[1],
    line: parseInt(match[2]),
    column: parseInt(match[3]),
    code: match[4],
    message: match[5],
  });
}

console.log(`📊 Total erreurs parsées: ${errors.length}`);

const clusters = {};

errors.forEach(error => {
  if (!clusters[error.code]) {
    clusters[error.code] = {
      code: error.code,
      count: 0,
      errors: [],
      patterns: {},
    };
  }

  clusters[error.code].count++;
  clusters[error.code].errors.push(error);

  const pattern = detectPattern(error.message);
  if (!clusters[error.code].patterns[pattern]) {
    clusters[error.code].patterns[pattern] = {
      pattern,
      count: 0,
      examples: [],
    };
  }

  clusters[error.code].patterns[pattern].count++;

  if (clusters[error.code].patterns[pattern].examples.length < 3) {
    clusters[error.code].patterns[pattern].examples.push({
      file: error.file,
      line: error.line,
      message: error.message,
    });
  }
});

function detectPattern(message) {
  if (message.includes("Type 'null' is not assignable")) {
    return 'null → undefined incompatibility';
  }
  if (message.includes("Type 'undefined' is not assignable")) {
    return 'undefined → null incompatibility';
  }
  if (message.includes('boolean | null') && message.includes('boolean')) {
    return 'boolean | null → boolean';
  }
  if (message.includes('Property') && message.includes('does not exist')) {
    const propMatch = message.match(/Property '(\w+)' does not exist/);
    return propMatch ? `Missing property: ${propMatch[1]}` : 'Missing property';
  }
  if (message.includes('is not assignable to type')) {
    return 'Type incompatibility';
  }
  if (
    message.includes('"') &&
    message.includes('|') &&
    message.includes('is not assignable')
  ) {
    return 'String literal union mismatch';
  }
  if (message.includes('[]') && message.includes('is not assignable')) {
    return 'Array type mismatch';
  }
  if (message.includes('Record<') && message.includes('is not assignable')) {
    return 'Record type mismatch';
  }
  return 'Other';
}

const sortedClusters = Object.values(clusters).sort(
  (a, b) => b.count - a.count
);

const stats = {
  totalErrors: errors.length,
  totalFamilies: sortedClusters.length,
  topFamilies: sortedClusters.slice(0, 10).map(c => ({
    code: c.code,
    count: c.count,
    percentage: ((c.count / errors.length) * 100).toFixed(1) + '%',
  })),
};

const output = {
  generatedAt: new Date().toISOString(),
  stats,
  clusters: sortedClusters,
};

const outputPath = path.join(process.cwd(), 'error-clusters.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Clustering terminé!`);
console.log(`📁 Fichier généré: error-clusters.json`);
console.log(`\n📊 Top 5 familles:`);
output.stats.topFamilies.slice(0, 5).forEach((f, i) => {
  console.log(`  ${i + 1}. ${f.code}: ${f.count} erreurs (${f.percentage})`);
});
