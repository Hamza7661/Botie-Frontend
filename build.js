const { execSync } = require('child_process');

// Get the public URL from environment variable
const publicUrl = process.env.RENDER_EXTERNAL_URL;

if (!publicUrl) {
  console.error('❌ RENDER_EXTERNAL_URL environment variable is not set!');
  console.error('Please set RENDER_EXTERNAL_URL in your environment or Render dashboard.');
  console.error('Example: RENDER_EXTERNAL_URL=https://your-app-name.onrender.com');
  process.exit(1);
}

console.log(`🌐 Building for public URL: ${publicUrl}`);

try {
  // Use the newer Expo CLI syntax with environment variable
  const command = `npx expo export --platform web`;
  
  console.log('🚀 Running:', command);
  
  // Set the environment variable for the export process
  const env = { ...process.env };
  
  execSync(command, { 
    stdio: 'inherit',
    env: env
  });
  
  console.log('✅ Build completed successfully!');
  console.log(`📁 Static files exported to: dist/`);
  console.log(`🌐 Your app will be available at: ${publicUrl}`);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 