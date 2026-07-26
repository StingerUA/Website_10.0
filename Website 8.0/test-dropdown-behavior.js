#!/usr/bin/env node
/**
 * Automated test for dropdown menu behavior
 */

const fs = require('fs');
const path = require('path');

// Read JavaScript file
const jsPath = path.join(__dirname, 'assets/js/menu-toggle.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

// Check for critical JavaScript patterns
const checks = [
  {
    name: 'toggleDropdown function exists',
    regex: /function toggleDropdown/,
    required: true
  },
  {
    name: 'Close all other dropdowns logic',
    regex: /document\.querySelectorAll\('\.dropdown\.active'\)\.forEach/,
    required: true
  },
  {
    name: 'pointer-events management in JS',
    regex: /pointerEvents\s*=\s*['"]none['"]|pointerEvents\s*=\s*['"]auto['"]/,
    required: true
  },
  {
    name: 'Explicit child pointer-events blocking',
    regex: /closingMenu\.querySelectorAll\(\'\*\'\)\.forEach|menu\.querySelectorAll\(\'\*\'\)\.forEach/,
    required: true
  },
  {
    name: 'Mobile detection breakpoint',
    regex: /CONFIG.*desktop_breakpoint|breakpoint.*1024/,
    required: true
  }
];

console.log('🔍 Checking JavaScript dropdown logic...\n');

let allPassed = true;
checks.forEach(check => {
  const found = check.regex.test(jsContent);
  const status = found ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  if (check.required && !found) {
    allPassed = false;
  }
});

console.log(`\n${allPassed ? '✅ All JS checks passed!' : '❌ Some JS checks failed!'}`);

// Also check that the header includes menu-toggle.js
const headerPath = path.join(__dirname, 'header-tr.html');
const headerContent = fs.readFileSync(headerPath, 'utf8');
const jsIncluded = /menu-toggle\.js/.test(headerContent);
console.log(`${jsIncluded ? '✅' : '❌'} menu-toggle.js included in header`);

process.exit(allPassed && jsIncluded ? 0 : 1);
