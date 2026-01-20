#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = '/Users/romeodossantos/verone-back-office-V1';
const APPS_DIR = path.join(ROOT, 'apps');
const PACKAGES_DIR = path.join(ROOT, 'packages');

// Helper functions
function walkSync(dir, filter, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.turbo')) {
        walkSync(filePath, filter, fileList);
      }
    } else if (filter(filePath)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function extractHooksFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hooks = [];

  // Match: export function useXxx or export const useXxx
  const hookRegex = /export\s+(?:function|const)\s+(use[A-Z]\w+)/g;
  let match;
  while ((match = hookRegex.exec(content)) !== null) {
    const hookName = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    // Extract function signature (simplified)
    const signatureMatch = content.substring(match.index).match(/use[A-Z]\w+[^{]*(?:\{|=>)/);
    const signature = signatureMatch ? signatureMatch[0].replace(/\s+/g, ' ').trim() : '';

    hooks.push({
      name: hookName,
      file: filePath.replace(ROOT, ''),
      lineNumber,
      signature
    });
  }

  return hooks;
}

function extractComponentsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const components = [];

  // Match: export function ComponentName or export const ComponentName
  const componentRegex = /export\s+(?:function|const)\s+([A-Z][A-Za-z0-9_]+)/g;
  let match;
  while ((match = componentRegex.exec(content)) !== null) {
    const componentName = match[1];

    // Skip non-component exports (types, constants, etc.)
    if (componentName.match(/^(Use|Type|Interface|Props|Config|Helpers|Constants?)/)) {
      continue;
    }

    const lineNumber = content.substring(0, match.index).split('\n').length;

    // Extract props interface/type if available
    const propsRegex = new RegExp(`interface\\s+${componentName}Props|type\\s+${componentName}Props`, 'g');
    const hasPropsInterface = propsRegex.test(content);

    components.push({
      name: componentName,
      file: filePath.replace(ROOT, ''),
      lineNumber,
      hasPropsInterface
    });
  }

  return components;
}

function findUsages(pattern, fileType = '*') {
  try {
    const cmd = `rg "${pattern}" ${ROOT} -g '*.${fileType}' --count --no-heading 2>/dev/null || echo ""`;
    const output = execSync(cmd, { encoding: 'utf8' });
    const lines = output.trim().split('\n').filter(Boolean);
    return lines.length;
  } catch (e) {
    return 0;
  }
}

function categorizeHook(hookName, filePath) {
  // Domain-based categorization
  if (filePath.includes('/auth/') || hookName.includes('Auth')) return 'auth';
  if (filePath.includes('/orders/') || hookName.includes('Order')) return 'orders';
  if (filePath.includes('/products/') || hookName.includes('Product')) return 'products';
  if (filePath.includes('/customers/') || hookName.includes('Customer')) return 'customers';
  if (filePath.includes('/finance/') || hookName.includes('Finance') || hookName.includes('Price') || hookName.includes('Payment')) return 'finance';
  if (filePath.includes('/stock/') || hookName.includes('Stock')) return 'stock';
  if (filePath.includes('/linkme/') || hookName.includes('LinkMe') || hookName.includes('Affiliate')) return 'linkme';
  if (filePath.includes('/dashboard/') || hookName.includes('Dashboard')) return 'dashboard';
  if (filePath.includes('/notifications/') || hookName.includes('Notification')) return 'notifications';

  // Pattern-based categorization
  if (hookName.match(/Query|Fetch|Get|Load/)) return 'query';
  if (hookName.match(/Mutation|Create|Update|Delete|Toggle/)) return 'mutation';
  if (hookName.match(/Mobile|WindowSize|MediaQuery|Debounce|LocalStorage/)) return 'utility';

  return 'common';
}

function categorizeComponent(componentName, filePath) {
  // Location-based
  if (filePath.includes('/ui/')) return 'ui-primitive';
  if (filePath.includes('/modals/')) return 'modal';
  if (filePath.includes('/forms/')) return 'form';
  if (filePath.includes('/sections/')) return 'section';
  if (filePath.includes('/layout/')) return 'layout';
  if (filePath.includes('/badges/')) return 'badge';
  if (filePath.includes('/widgets/')) return 'widget';

  // Name-based
  if (componentName.match(/Button|Input|Select|Checkbox|Radio|Switch/)) return 'ui-primitive';
  if (componentName.match(/Modal|Dialog|Drawer/)) return 'modal';
  if (componentName.match(/Form|Field/)) return 'form';
  if (componentName.match(/Card|Table|List/)) return 'composite';
  if (componentName.match(/Layout|Container|Grid|Stack/)) return 'layout';
  if (componentName.match(/Badge|Tag/)) return 'badge';

  return 'domain-specific';
}

// Main analysis
console.log('Analyzing hooks and components...\n');

// Find all hook files
const hookFiles = [
  ...walkSync(PACKAGES_DIR, f => f.match(/\.(ts|tsx)$/) && f.includes('/hooks/')),
  ...walkSync(APPS_DIR, f => f.match(/\.(ts|tsx)$/) && f.includes('/hooks/'))
];

console.log(`Found ${hookFiles.length} hook files`);

// Find all component files
const componentFiles = [
  ...walkSync(PACKAGES_DIR, f => f.match(/\.tsx$/) && f.includes('/components/')),
  ...walkSync(APPS_DIR, f => f.match(/\.tsx$/) && f.includes('/components/'))
];

console.log(`Found ${componentFiles.length} component files\n`);

// Extract hooks
const allHooks = [];
hookFiles.forEach(file => {
  const hooks = extractHooksFromFile(file);
  allHooks.push(...hooks);
});

console.log(`Extracted ${allHooks.length} hooks`);

// Extract components
const allComponents = [];
componentFiles.forEach(file => {
  const components = extractComponentsFromFile(file);
  allComponents.push(...components);
});

console.log(`Extracted ${allComponents.length} components\n`);

// Analyze hooks
const hooksAnalysis = allHooks.map(hook => {
  const domain = categorizeHook(hook.name, hook.file);
  const usageCount = findUsages(`import.*${hook.name}`, '{ts,tsx}');

  return {
    ...hook,
    domain,
    usageCount,
    location: hook.file.startsWith('/packages') ? 'packages' : 'apps'
  };
});

// Find duplicate hooks
const hooksByName = {};
hooksAnalysis.forEach(hook => {
  if (!hooksByName[hook.name]) {
    hooksByName[hook.name] = [];
  }
  hooksByName[hook.name].push(hook);
});

const duplicateHooks = Object.entries(hooksByName)
  .filter(([name, hooks]) => hooks.length > 1)
  .map(([name, hooks]) => ({ name, implementations: hooks }));

// Analyze components
const componentsAnalysis = allComponents.map(comp => {
  const category = categorizeComponent(comp.name, comp.file);
  const usageCount = findUsages(`import.*${comp.name}`, 'tsx');

  return {
    ...comp,
    category,
    usageCount,
    location: comp.file.startsWith('/packages') ? 'packages' : 'apps'
  };
});

// Find duplicate components
const componentsByName = {};
componentsAnalysis.forEach(comp => {
  if (!componentsByName[comp.name]) {
    componentsByName[comp.name] = [];
  }
  componentsByName[comp.name].push(comp);
});

const duplicateComponents = Object.entries(componentsByName)
  .filter(([name, comps]) => comps.length > 1)
  .map(([name, comps]) => ({ name, implementations: comps }));

// Generate reports
const hooksReport = {
  generated_at: new Date().toISOString(),
  summary: {
    total: allHooks.length,
    by_location: {
      packages: hooksAnalysis.filter(h => h.location === 'packages').length,
      apps: hooksAnalysis.filter(h => h.location === 'apps').length
    },
    by_domain: Object.entries(
      hooksAnalysis.reduce((acc, h) => {
        acc[h.domain] = (acc[h.domain] || 0) + 1;
        return acc;
      }, {})
    ).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
    duplicates: duplicateHooks.length
  },
  hooks: hooksAnalysis.sort((a, b) => a.name.localeCompare(b.name)),
  duplicates: duplicateHooks
};

const componentsReport = {
  generated_at: new Date().toISOString(),
  summary: {
    total: allComponents.length,
    by_location: {
      packages: componentsAnalysis.filter(c => c.location === 'packages').length,
      apps: componentsAnalysis.filter(c => c.location === 'apps').length
    },
    by_category: Object.entries(
      componentsAnalysis.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {})
    ).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
    duplicates: duplicateComponents.length
  },
  components: componentsAnalysis.sort((a, b) => a.name.localeCompare(b.name)),
  duplicates: duplicateComponents
};

// Write reports
const reportsDir = path.join(ROOT, 'tools/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

fs.writeFileSync(
  path.join(reportsDir, 'hooks-usage.json'),
  JSON.stringify(hooksReport, null, 2)
);

fs.writeFileSync(
  path.join(reportsDir, 'components-usage.json'),
  JSON.stringify(componentsReport, null, 2)
);

console.log('Analysis complete!');
console.log(`\nHooks summary:`);
console.log(`- Total: ${hooksReport.summary.total}`);
console.log(`- Packages: ${hooksReport.summary.by_location.packages}`);
console.log(`- Apps: ${hooksReport.summary.by_location.apps}`);
console.log(`- Duplicates: ${hooksReport.summary.duplicates}`);

console.log(`\nComponents summary:`);
console.log(`- Total: ${componentsReport.summary.total}`);
console.log(`- Packages: ${componentsReport.summary.by_location.packages}`);
console.log(`- Apps: ${componentsReport.summary.by_location.apps}`);
console.log(`- Duplicates: ${componentsReport.summary.duplicates}`);

console.log(`\nReports written to:`);
console.log(`- tools/reports/hooks-usage.json`);
console.log(`- tools/reports/components-usage.json`);
