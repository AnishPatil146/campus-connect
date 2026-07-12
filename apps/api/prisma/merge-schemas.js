const fs = require('fs');
const path = require('path');

const prismaDir = __dirname;
const modelsDir = path.join(prismaDir, 'models');
const schemaPath = path.join(prismaDir, 'schema.prisma');
const mergedPath = path.join(prismaDir, 'schema_merged.prisma');

try {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  // Strip the previewFeatures with prismaSchemaFolder
  schemaContent = schemaContent.replace(/previewFeatures\s*=\s*\["prismaSchemaFolder"\]/, '');

  const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.prisma'));
  let mergedContent = schemaContent + '\n\n';

  for (const file of modelFiles) {
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    mergedContent += `// From: ${file}\n` + content + '\n\n';
  }

  fs.writeFileSync(mergedPath, mergedContent, 'utf8');
  console.log(`✅ Merged schema written to ${mergedPath}`);
} catch (err) {
  console.error('❌ Failed to merge schemas:', err);
  process.exit(1);
}
