/**
 * Extract HTML from the malformed JSON response
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'test-evidence', '04-generated.html');
const outputFile = path.join(__dirname, 'test-evidence', '04-FINAL-landing-page.html');

// Read the file
const content = fs.readFileSync(inputFile, 'utf-8');

console.log('📖 Reading file:', inputFile);
console.log('📏 Content length:', content.length);

// Try to parse as JSON
try {
  const parsed = JSON.parse(content);
  
  if (parsed.html && parsed.css) {
    // Create complete HTML
    const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskFlow - Manage Your Tasks Effortlessly</title>
  <style>
${parsed.css}
  </style>
</head>
<body>
${parsed.html}
  <script>
${parsed.js || ''}
  </script>
</body>
</html>`;
    
    fs.writeFileSync(outputFile, completeHTML);
    console.log('✅ Successfully extracted and saved HTML to:', outputFile);
    console.log('📊 Stats:');
    console.log('   HTML length:', parsed.html.length);
    console.log('   CSS length:', parsed.css.length);
    console.log('   JS length:', (parsed.js || '').length);
  } else {
    console.log('❌ Parsed JSON but missing html/css fields');
  }
} catch (error) {
  console.log('⚠️  Failed to parse as JSON:', error.message);
  console.log('📝 Attempting manual extraction...');
  
  // Manual extraction
  const htmlMatch = content.match(/"html":\s*"([\s\S]*?)"/);
  const cssMatch = content.match(/"css":\s*"([\s\S]*?)"/);
  
  if (htmlMatch && cssMatch) {
    // Unescape the strings
    const html = htmlMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    
    const css = cssMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    
    const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskFlow - Manage Your Tasks Effortlessly</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;
    
    fs.writeFileSync(outputFile, completeHTML);
    console.log('✅ Successfully extracted and saved HTML to:', outputFile);
    console.log('📊 Stats:');
    console.log('   HTML length:', html.length);
    console.log('   CSS length:', css.length);
  } else {
    console.log('❌ Could not extract HTML/CSS from content');
  }
}

