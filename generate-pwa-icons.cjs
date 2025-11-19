const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceIcon = path.join(__dirname, 'public', 'icon', 'favicon.png');
const outputDir = path.join(__dirname, 'public', 'icon');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 需要生成的图标尺寸
const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

async function generateIcons() {
  console.log('📱 开始生成PWA图标...');
  console.log(`📂 源文件: ${sourceIcon}`);

  try {
    // 读取源图标信息
    const metadata = await sharp(sourceIcon).metadata();
    console.log(`✅ 源图标尺寸: ${metadata.width}x${metadata.height}`);

    // 生成各个尺寸的图标
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);

      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ 生成: ${name} (${size}x${size})`);
    }

    console.log('\n🎉 所有图标生成完成！');
    console.log('\n📋 生成的文件:');
    sizes.forEach(({ name }) => {
      console.log(`   - public/icon/${name}`);
    });

    console.log('\n⚠️  下一步: 更新 manifest.json 中的图标配置');

  } catch (error) {
    console.error('❌ 生成图标失败:', error.message);
    process.exit(1);
  }
}

generateIcons();
