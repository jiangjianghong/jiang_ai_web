/**
 * 自动更新版本号脚本
 * 版本规则：
 * - 每次部署 patch 版本 +1
 * - patch 达到 100 时，minor +1，patch 重置为 1
 * - 例如：0.3.99 -> 0.3.100 -> 0.4.1
 */

const fs = require('fs');
const path = require('path');

// 读取 package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 解析当前版本
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// 计算新版本
let newMajor = major;
let newMinor = minor;
let newPatch = patch + 1;

// patch 超过 100 时，递增 minor 并重置 patch
if (newPatch > 100) {
    newMinor += 1;
    newPatch = 1;
}

const newVersion = `${newMajor}.${newMinor}.${newPatch}`;

// 更新 package.json（保持原有缩进风格）
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// 生成版本信息文件供前端使用
const versionInfo = {
    version: newVersion,
    buildTime: new Date().toISOString(),
    buildDate: new Date().toISOString().split('T')[0]
};

const versionFilePath = path.join(__dirname, '..', 'src', 'version.json');
fs.writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2) + '\n');

console.log(`✅ 版本更新: ${currentVersion} -> ${newVersion}`);
console.log(`📅 构建时间: ${versionInfo.buildDate}`);

