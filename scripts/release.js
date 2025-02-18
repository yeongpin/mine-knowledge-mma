const { execSync } = require('child_process');
const { version } = require('../package.json');

// Ensure version format is correct
if (!/^\d+\.\d+\.\d+(-\w+)?$/.test(version)) {
  console.error('Invalid version format in package.json');
  process.exit(1);
}

const tagName = `v${version}`;

try {
  // Delete existing local tag
  execSync(`git tag -d ${tagName}`, { stdio: 'ignore' });
} catch (error) {
  // Ignore tag not found error
}

try {
  // Delete remote tag
  execSync(`git push origin :refs/tags/${tagName}`, { stdio: 'ignore' });
} catch (error) {
  // Ignore remote tag not found error
}

// Create new tag
execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'inherit' });

// Push tag to remote
execSync(`git push origin ${tagName}`, { stdio: 'inherit' });

console.log(`Successfully created and pushed tag: ${tagName}`); 