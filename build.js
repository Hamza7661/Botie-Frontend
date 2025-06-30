const { execSync } = require('child_process');

console.log('Building for web platform...');

try {
  // Use the newer Expo CLI syntax
  const command = `npx expo export --platform web`;
  
  console.log('Running:', command);
  execSync(command, { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 