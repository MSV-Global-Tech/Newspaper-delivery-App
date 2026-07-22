const { execSync } = require('child_process');
try {
  execSync('npx expo install expo-image-picker', { stdio: 'inherit' });
  console.log('Installation complete');
} catch (e) {
  console.error('Error during installation');
}
