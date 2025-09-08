#!/usr/bin/env node

/**
 * Migration script to convert Fuego Explorer from PHP to Node.js API
 * 
 * This script helps identify and update JavaScript files that need to be
 * modified to use our new API endpoints instead of PHP endpoints.
 */

const fs = require('fs');
const path = require('path');

// API endpoint mappings from PHP to our REST API
const API_MAPPINGS = {
  // Node endpoints
  'getinfo': '/node/info',
  'getheight': '/node/height', 
  'getblockcount': '/node/blockcount',
  'getlastblockheader': '/node/last_block_header',
  'getblockheaderbyheight': '/node/block_header_by_height',
  
  // Wallet endpoints
  'getbalance': '/wallet/balance',
  'get_height': '/wallet/height',
  'get_transfers': '/wallet/transfers',
  'transfer': '/wallet/transfer',
  'optimize': '/wallet/optimize'
};

// Common PHP patterns to replace
const PHP_PATTERNS = [
  {
    pattern: /fetch\s*\(\s*['"]\/config\.php['"]\s*,\s*{\s*method:\s*['"]POST['"]\s*,\s*body:\s*JSON\.stringify\s*\(\s*{\s*method:\s*['"]([^'"]+)['"]/g,
    replacement: (match, method) => {
      const newEndpoint = API_MAPPINGS[method];
      if (newEndpoint) {
        return `fetch('http://localhost:8787/v1${newEndpoint}'`;
      }
      return match;
    }
  },
  {
    pattern: /API_BASE\s*=\s*['"]\/config\.php['"]/g,
    replacement: "API_BASE = 'http://localhost:8787/v1'"
  }
];

function scanDirectory(dir, extensions = ['.js', '.html']) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

function migrateFile(filePath) {
  console.log(`\n🔍 Scanning: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const pattern of PHP_PATTERNS) {
      const newContent = content.replace(pattern.pattern, pattern.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`  ✅ Updated API calls in ${path.basename(filePath)}`);
      }
    }
    
    if (modified) {
      // Create backup
      const backupPath = filePath + '.backup';
      fs.writeFileSync(backupPath, fs.readFileSync(filePath));
      console.log(`  💾 Backup created: ${backupPath}`);
      
      // Write updated content
      fs.writeFileSync(filePath, content);
      console.log(`  ✨ Updated: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Fuego Explorer PHP to Node.js API Migration Tool');
  console.log('==================================================\n');
  
  const explorerDir = process.argv[2];
  
  if (!explorerDir) {
    console.log('Usage: node migration-script.js <explorer-directory>');
    console.log('\nExample: node migration-script.js ../fuego-explorer');
    process.exit(1);
  }
  
  if (!fs.existsSync(explorerDir)) {
    console.error(`❌ Directory not found: ${explorerDir}`);
    process.exit(1);
  }
  
  console.log(`📁 Scanning directory: ${explorerDir}`);
  
  const files = scanDirectory(explorerDir);
  console.log(`📄 Found ${files.length} files to scan\n`);
  
  let migratedCount = 0;
  
  for (const file of files) {
    const originalContent = fs.readFileSync(file, 'utf8');
    migrateFile(file);
    
    const newContent = fs.readFileSync(file, 'utf8');
    if (originalContent !== newContent) {
      migratedCount++;
    }
  }
  
  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Files modified: ${migratedCount}/${files.length}`);
  
  if (migratedCount > 0) {
    console.log(`\n📋 Next steps:`);
    console.log(`1. Review the changes in the modified files`);
    console.log(`2. Test the explorer functionality`);
    console.log(`3. Start the Node.js API gateway:`);
    console.log(`   cd api/gateway && npm install && node server.js`);
    console.log(`4. Update any remaining hardcoded PHP references`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { API_MAPPINGS, PHP_PATTERNS, migrateFile };
