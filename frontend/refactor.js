const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const before = content;
      // Remove import
      content = content.replace(/import DashboardLayout from ['"]@\/components\/layout\/DashboardLayout['"];\n?/g, '');
      // Replace tags
      content = content.replace(/<DashboardLayout>/g, '<>');
      content = content.replace(/<\/DashboardLayout>/g, '</>');
      
      if (before !== content) {
        fs.writeFileSync(fullPath, content);
        console.log(`Refactored ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src', 'app', 'guard'));
console.log('Done!');
