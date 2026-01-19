const fs = require('fs');
const path = require('path');

const checkFile = (filePath) => {
  console.log(`Checking ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Custom parser to find duplicates
  const findDuplicates = (jsonString) => {
    let lines = jsonString.split('\n');
    let stack = [];
    let keys = new Map(); // Map<path, line>
    
    // This is a naive line-based check, standard JSON.parse doesn't report duplicates
    // Robust parsing would be complex, but let's try a simple regex approach for keys
    
    // Better approach: Use a parser that supports duplicate key detection or strict mode.
    // Or just iterate and build path.
    
    // Let's rely on the fact that these keys are likely on separate lines.
    // We will track the indentation level to guess the object depth
    
    // Actually, finding duplicates by running a regex over the file might be enough for "simple" duplicates in same object.
    
    // Let's try to parse with a revocable proxy or similar? No.
    // Let's simply regex for keys and check context? Too hard.
    
    // New plan: Use `json-lint` or similar if checked? No.
    
    // Let's regex for `"key":` and see if we find identical lines in close proximity?
    // No, duplicates might be far apart.
    
    // Let's use a stack-based approach for paths.
    
    let path = [];
    let duplicates = [];
    let seenKeysInCurrentObject = [new Set()];
    
    lines.forEach((line, lineNum) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // Detect object start
        if (trimmed.endsWith('{')) {
             // If it has a key before {
             const keyMatch = trimmed.match(/"([^"]+)":\s*\{/);
             if (keyMatch) {
                 const key = keyMatch[1];
                 const currentScope = seenKeysInCurrentObject[seenKeysInCurrentObject.length - 1];
                 if (currentScope.has(key)) {
                     duplicates.push({ key, line: lineNum + 1, path: path.join('.') });
                 } else {
                     currentScope.add(key);
                 }
                 path.push(key);
             } else {
                 // anonymous object (array?) or root
             }
             seenKeysInCurrentObject.push(new Set());
        }
        
        // Detect object end
        if (trimmed.startsWith('}') || trimmed.endsWith('},')) {
            seenKeysInCurrentObject.pop();
            path.pop();
        }
        
        // Detect simple key-value
        const kvMatch = trimmed.match(/"([^"]+)":/);
        if (kvMatch && !trimmed.endsWith('{')) {
             const key = kvMatch[1];
             const currentScope = seenKeysInCurrentObject[seenKeysInCurrentObject.length - 1];
             if (currentScope && currentScope.has(key)) {
                 duplicates.push({ key, line: lineNum + 1, path: path.join('.') });
             } else if (currentScope) {
                 currentScope.add(key);
             }
        }
    });
    
    return duplicates;
  };

  const dups = findDuplicates(content);
  if (dups.length > 0) {
    console.log('Found duplicates:');
    dups.forEach(d => console.log(`Key: "${d.key}" at line ${d.line} (Context: ${d.path || 'root'})`));
  } else {
    console.log('No obvious duplicates found.');
  }
};

checkFile('d:\\Work\\Qeema Tech\\StokShip\\stokship\\dashbaord\\src\\locales\\en.json');
checkFile('d:\\Work\\Qeema Tech\\StokShip\\stokship\\dashbaord\\src\\locales\\ar.json');
