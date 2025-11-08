/**
 * Codemod: Unify Button Components
 *
 * Transforme automatiquement :
 * - ActionButton → ButtonUnified
 * - ModernActionButton → ButtonUnified
 * - StandardModifyButton → ButtonUnified
 * - ButtonV2 → ButtonUnified (alias déjà disponible)
 *
 * Usage:
 * npx jscodeshift -t scripts/codemods/unify-button.ts src/path/to/file.tsx
 *
 * @see /docs/audits/2025-11/PLAN-REFACTORISATION-COMPOSANTS-2025.md
 */

import type { API, FileInfo, Options } from 'jscodeshift';

export default function transformer(file: FileInfo, api: API, options: Options) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let hasChanges = false;

  // Mapping: ancien component → nouveau component + variant
  const componentMappings = {
    ActionButton: {
      newName: 'ButtonUnified',
      defaultVariant: 'default',
      propMappings: {
        color: (value: string) => {
          // ActionButton color → ButtonUnified variant
          const colorToVariant: Record<string, string> = {
            primary: 'default',
            success: 'default', // Garder default, ajouter color via className si nécessaire
            danger: 'destructive',
            warning: 'default',
            accent: 'default',
          };
          return colorToVariant[value] || 'default';
        },
        label: 'children', // label → children
        icon: 'icon', // Garder tel quel
        variant: (value: string) => {
          // ActionButton variant (square/inline) → ButtonUnified size
          return value === 'inline' ? 'md' : 'icon';
        },
      },
    },
    ModernActionButton: {
      newName: 'ButtonUnified',
      defaultVariant: 'default',
      propMappings: {
        action: (value: string) => {
          // ModernActionButton action → ButtonUnified variant + icon
          const actionToVariant: Record<string, { variant: string; icon: string }> = {
            edit: { variant: 'secondary', icon: 'Edit' },
            archive: { variant: 'outline', icon: 'Archive' },
            delete: { variant: 'destructive', icon: 'Trash2' },
            view: { variant: 'ghost', icon: 'Eye' },
            download: { variant: 'secondary', icon: 'Download' },
            upload: { variant: 'default', icon: 'Upload' },
            copy: { variant: 'ghost', icon: 'Copy' },
            approve: { variant: 'default', icon: 'Check' },
            reject: { variant: 'destructive', icon: 'X' },
          };
          return actionToVariant[value] || { variant: 'default', icon: '' };
        },
      },
    },
    StandardModifyButton: {
      newName: 'ButtonUnified',
      defaultVariant: 'outline',
      defaultSize: 'sm',
      defaultIcon: 'Edit',
      propMappings: {
        // Pas de props spécifiques, juste variant="outline" size="sm" icon={Edit}
      },
    },
  };

  // 1. Transformer les imports
  Object.keys(componentMappings).forEach((oldComponentName) => {
    root
      .find(j.ImportDeclaration, {
        source: {
          value: (v: string) => v.includes(oldComponentName.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()),
        },
      })
      .forEach((path) => {
        const importPath = path.value.source.value as string;

        // Remplacer l'import
        path.value.specifiers = path.value.specifiers?.map((spec) => {
          if (spec.type === 'ImportSpecifier' && spec.imported.name === oldComponentName) {
            hasChanges = true;
            return j.importSpecifier(
              j.identifier('ButtonUnified'),
              j.identifier('ButtonUnified')
            );
          }
          return spec;
        });

        // Mettre à jour le chemin d'import
        if (importPath.includes('/ui/')) {
          path.value.source.value = importPath.replace(
            /\/(action-button|modern-action-button|standard-modify-button)/,
            '/button-unified'
          );
        }
      });
  });

  // 2. Transformer les JSXElements ActionButton
  root.find(j.JSXElement).forEach((path) => {
    const openingElement = path.value.openingElement;
    const elementName = openingElement.name;

    if (elementName.type !== 'JSXIdentifier') return;
    const componentName = elementName.name;

    if (componentName === 'ActionButton') {
      hasChanges = true;
      elementName.name = 'ButtonUnified';

      // Transformer les props
      const attributes = openingElement.attributes || [];
      const newAttributes: any[] = [];
      let iconValue = null;
      let labelValue = null;
      let variantValue = 'default';
      let colorValue = null;

      attributes.forEach((attr) => {
        if (attr.type !== 'JSXAttribute') {
          newAttributes.push(attr);
          return;
        }

        const propName = attr.name.name as string;
        const propValue = attr.value;

        if (propName === 'label') {
          // Capturer label pour le transformer en children
          if (propValue?.type === 'StringLiteral') {
            labelValue = propValue.value;
          } else if (propValue?.type === 'JSXExpressionContainer') {
            labelValue = propValue.expression;
          }
        } else if (propName === 'icon') {
          // Garder icon tel quel
          iconValue = propValue;
          newAttributes.push(attr);
        } else if (propName === 'color') {
          // color → variant mapping
          if (propValue?.type === 'StringLiteral') {
            colorValue = propValue.value;
            if (colorValue === 'danger') {
              variantValue = 'destructive';
            }
          }
        } else if (propName === 'variant') {
          // variant (square/inline) → size
          if (propValue?.type === 'StringLiteral') {
            const variantVal = propValue.value;
            if (variantVal === 'square') {
              newAttributes.push(
                j.jsxAttribute(
                  j.jsxIdentifier('size'),
                  j.stringLiteral('icon')
                )
              );
            }
          }
        } else {
          // Garder les autres props (onClick, disabled, className, etc.)
          newAttributes.push(attr);
        }
      });

      // Ajouter variant si nécessaire
      if (variantValue !== 'default') {
        newAttributes.push(
          j.jsxAttribute(
            j.jsxIdentifier('variant'),
            j.stringLiteral(variantValue)
          )
        );
      }

      openingElement.attributes = newAttributes;

      // Transformer label en children
      if (labelValue && path.value.children) {
        if (typeof labelValue === 'string') {
          path.value.children = [j.jsxText(labelValue)];
        } else {
          path.value.children = [j.jsxExpressionContainer(labelValue)];
        }
      }

      // Mettre à jour closingElement si présent
      if (path.value.closingElement) {
        path.value.closingElement.name = j.jsxIdentifier('ButtonUnified');
      }
    }

    // StandardModifyButton → ButtonUnified
    if (componentName === 'StandardModifyButton') {
      hasChanges = true;
      elementName.name = 'ButtonUnified';

      // Ajouter props par défaut
      const attributes = openingElement.attributes || [];
      const hasVariant = attributes.some((attr) => attr.type === 'JSXAttribute' && attr.name.name === 'variant');
      const hasSize = attributes.some((attr) => attr.type === 'JSXAttribute' && attr.name.name === 'size');
      const hasIcon = attributes.some((attr) => attr.type === 'JSXAttribute' && attr.name.name === 'icon');

      if (!hasVariant) {
        attributes.unshift(
          j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('outline'))
        );
      }
      if (!hasSize) {
        attributes.unshift(
          j.jsxAttribute(j.jsxIdentifier('size'), j.stringLiteral('sm'))
        );
      }
      if (!hasIcon) {
        // Ajouter import Edit si pas déjà présent
        const hasEditImport = root.find(j.ImportDeclaration, {
          source: { value: 'lucide-react' },
        }).find(j.ImportSpecifier, {
          imported: { name: 'Edit' },
        }).length > 0;

        if (!hasEditImport) {
          // Ajouter Edit à l'import lucide-react
          root.find(j.ImportDeclaration, {
            source: { value: 'lucide-react' },
          }).forEach((importPath) => {
            if (importPath.value.specifiers) {
              importPath.value.specifiers.push(
                j.importSpecifier(j.identifier('Edit'))
              );
            }
          });

          // Si pas d'import lucide-react, en créer un
          if (!hasEditImport) {
            const firstImport = root.find(j.ImportDeclaration).at(0);
            if (firstImport.length > 0) {
              firstImport.insertBefore(
                j.importDeclaration(
                  [j.importSpecifier(j.identifier('Edit'))],
                  j.stringLiteral('lucide-react')
                )
              );
            }
          }
        }

        attributes.unshift(
          j.jsxAttribute(
            j.jsxIdentifier('icon'),
            j.jsxExpressionContainer(j.identifier('Edit'))
          )
        );
      }

      openingElement.attributes = attributes;

      if (path.value.closingElement) {
        path.value.closingElement.name = j.jsxIdentifier('ButtonUnified');
      }
    }

    // ModernActionButton → ButtonUnified
    if (componentName === 'ModernActionButton') {
      hasChanges = true;
      elementName.name = 'ButtonUnified';

      // TODO: Implémenter transformation ModernActionButton
      // (Plus complexe car nécessite mapping action → variant+icon)

      if (path.value.closingElement) {
        path.value.closingElement.name = j.jsxIdentifier('ButtonUnified');
      }
    }
  });

  // 3. Ajouter import ButtonUnified si pas déjà présent
  if (hasChanges) {
    const hasButtonUnifiedImport = root.find(j.ImportDeclaration, {
      source: { value: (v: string) => v.includes('button-unified') },
    }).length > 0;

    if (!hasButtonUnifiedImport) {
      const firstImport = root.find(j.ImportDeclaration).at(0);
      if (firstImport.length > 0) {
        firstImport.insertBefore(
          j.importDeclaration(
            [j.importSpecifier(j.identifier('ButtonUnified'))],
            j.stringLiteral('@/components/ui/button-unified')
          )
        );
      }
    }
  }

  return hasChanges ? root.toSource({ quote: 'single' }) : null;
}

module.exports = transformer;
module.exports.parser = 'tsx';
