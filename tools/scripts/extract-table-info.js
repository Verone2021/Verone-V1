#!/usr/bin/env node
/**
 * Extract detailed table information from supabase.ts type file
 */

const fs = require('fs');
const path = require('path');

const typesPath = '/Users/romeodossantos/verone-back-office-V1/packages/@verone/types/src/supabase.ts';
const content = fs.readFileSync(typesPath, 'utf-8');

// Extract Tables section
const tablesMatch = content.match(/Tables: \{([^}]+(?:\{[^}]+\}[^}]+)*)\s+\}\s+Views:/s);
if (!tablesMatch) {
  console.error('Could not find Tables section');
  process.exit(1);
}

const tablesSection = tablesMatch[1];

// Find all table names
const tablePattern = /^\s+([a-z_]+): \{$/gm;
let match;
const tables = [];

while ((match = tablePattern.exec(tablesSection)) !== null) {
  const tableName = match[1];
  
  // Skip meta properties
  if (['Row', 'Insert', 'Update', 'Relationships'].includes(tableName)) {
    continue;
  }
  
  tables.push(tableName);
}

// Remove duplicates and sort
const uniqueTables = [...new Set(tables)].sort();

console.log(JSON.stringify({
  generated_at: new Date().toISOString(),
  source: 'packages/@verone/types/src/supabase.ts',
  count: uniqueTables.length,
  tables: uniqueTables
}, null, 2));
