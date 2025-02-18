const { execSync } = require('child_process');
const { version } = require('../package.json');

// 确保版本号格式正确
if (!/^\d+\.\d+\.\d+(-\w+)?$/.test(version)) {
  console.error('Invalid version format in package.json');
  process.exit(1);
}

const tagName = `v${version}`;

try {
  // 删除已存在的本地标签
  execSync(`git tag -d ${tagName}`, { stdio: 'ignore' });
} catch (error) {
  // 忽略标签不存在的错误
}

try {
  // 删除远程标签
  execSync(`git push origin :refs/tags/${tagName}`, { stdio: 'ignore' });
} catch (error) {
  // 忽略远程标签不存在的错误
}

// 创建新标签
execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'inherit' });

// 推送标签到远程
execSync(`git push origin ${tagName}`, { stdio: 'inherit' });

console.log(`Successfully created and pushed tag: ${tagName}`); 