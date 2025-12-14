// 自动更新 Service Worker 版本号
// 每次构建时运行，使用 Git commit hash 作为版本号

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 获取版本号（优先使用环境变量，然后 Git，最后时间戳）
function getVersion() {
  // 1. 优先使用 GitHub Actions 的环境变量
  if (process.env.GITHUB_SHA) {
    const gitHash = process.env.GITHUB_SHA.substring(0, 7);
    console.log(`📍 使用 GitHub Actions commit hash: ${gitHash}`);
    return `v${gitHash}`;
  }

  // 2. 尝试从 Git 命令获取
  try {
    const gitHash = execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();
    console.log(`📍 使用本地 Git commit hash: ${gitHash}`);
    return `v${gitHash}`;
  } catch (error) {
    // 3. 如果不是 Git 仓库，使用时间戳
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    console.warn('⚠️  无法获取 Git commit hash，使用时间戳作为版本号');
    return `v${timestamp}`;
  }
}

// 更新文件中的版本号
function updateFile(filePath, searchPattern, replacement) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const updatedContent = content.replace(searchPattern, replacement);

    if (content !== updatedContent) {
      writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ 已更新: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  跳过（无变化）: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 更新失败: ${filePath}`, error.message);
    return false;
  }
}

// 主函数
function main() {
  console.log('\n🔄 开始自动更新 Service Worker 版本号...\n');

  const version = getVersion();
  console.log(`📦 新版本号: ${version}\n`);

  let updated = 0;

  // 1. 更新 src/lib/swConfig.ts
  const swConfigPath = join(rootDir, 'src/lib/swConfig.ts');
  if (updateFile(
    swConfigPath,
    /export const SW_VERSION = ['"`]v[^'"`]+['"`];/,
    `export const SW_VERSION = '${version}';`
  )) {
    updated++;
  }

  // 2. 更新 public/sw.js
  const swJsPath = join(rootDir, 'public/sw.js');
  if (updateFile(
    swJsPath,
    /const SW_VERSION = ['"`]v[^'"`]+['"`];/,
    `const SW_VERSION = '${version}';`
  )) {
    updated++;
  }

  console.log(`\n✨ 完成！共更新了 ${updated} 个文件\n`);

  if (updated === 0) {
    console.log('💡 提示：版本号可能已经是最新的\n');
  }
}

// 运行
main();
