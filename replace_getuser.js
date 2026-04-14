import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace standard getUser calls
  content = content.replace(
    /const\s+{\s*data:\s*{\s*user\s*}\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);/g,
    'const { data: { session } } = await supabase.auth.getSession();\n      const user = session?.user;'
  );

  // Replace HomeScreen specific call
  content = content.replace(
    /const\s+{\s*data:\s*{\s*user\s*},\s*error:\s*authError\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);/g,
    'const { data: { session }, error: authError } = await supabase.auth.getSession();\n        const user = session?.user;'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Done replacing getUser with getSession');
