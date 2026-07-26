#!/usr/bin/env node
/**
 * Check if dropdown CSS rules are correctly applied
 */

const fs = require('fs');
const path = require('path');

// Read the CSS file
const cssPath = path.join(__dirname, 'assets/css/dropdown-optimized.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Check for critical rules
const checks = [
  {
    name: 'Inactive dropdown pointer-events: none',
    regex: /\.dropdown:not\(\.active\)\s*\.dropdown-menu,[\s\S]*?pointer-events:\s*none\s*!important/,
    required: true
  },
  {
    name: 'Active dropdown pointer-events: auto',
    regex: /\.dropdown\.active\s*\.dropdown-menu,[\s\S]*?pointer-events:\s*auto\s*!important/,
    required: true
  },
  {
    name: 'Mobile media query',
    regex: /@media\s*\(max-width:\s*1023px\)/,
    required: true
  },
  {
    name: 'Mobile backdrop overlay',
    regex: /\.dropdown\.active::before[\s\S]*?z-index:\s*1499/,
    required: true
  }
];

console.log('🔍 Checking dropdown CSS rules...\n');

let allPassed = true;
checks.forEach(check => {
  const found = check.regex.test(cssContent);
  const status = found ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  if (check.required && !found) {
    allPassed = false;
  }
});

console.log(`\n${allPassed ? '✅ All checks passed!' : '❌ Some checks failed!'}`);
process.exit(allPassed ? 0 : 1);
