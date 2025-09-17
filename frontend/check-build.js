const fs = require('fs');
const path = require('path');

console.log('🔍 检查构建状态...\n');

// 检查构建目录
const buildDir = 'build';
const buildExists = fs.existsSync(buildDir);

if (!buildExists) {
  console.log('❌ build目录不存在');
  console.log('💡 请先运行: npm run build\n');
  process.exit(1);
}

// 检查关键文件
const requiredFiles = [
  'index.html',
  'static/js',
  'static/css',
  'static/media'
];

console.log('📁 检查构建文件:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(buildDir, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${file}: ${exists ? '✅' : '❌'}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ 构建不完整，请重新运行: npm run build');
  process.exit(1);
}

// 检查文件大小
console.log('\n📊 构建文件统计:');
try {
  const buildFiles = fs.readdirSync(buildDir, { recursive: true });
  const totalFiles = buildFiles.length;
  
  // 计算总大小
  let totalSize = 0;
  buildFiles.forEach(file => {
    if (typeof file === 'string') {
      const filePath = path.join(buildDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      } catch (e) {
        // 忽略错误
      }
    }
  });
  
  console.log(`  总文件数: ${totalFiles}`);
  console.log(`  总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  // 检查主要文件
  const mainFiles = ['index.html', 'static/js', 'static/css'];
  mainFiles.forEach(dir => {
    const dirPath = path.join(buildDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      console.log(`  ${dir}: ${files.length} 个文件`);
    }
  });
  
} catch (error) {
  console.error('❌ 读取构建目录失败:', error.message);
  process.exit(1);
}

// 检查Electron配置
console.log('\n⚡ 检查Electron配置:');
const electronFiles = [
  'public/electron.js',
  'public/preload.js'
];

electronFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${file}: ${exists ? '✅' : '❌'}`);
});

// 检查package.json配置
console.log('\n📦 检查package.json配置:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const configs = [
    { key: 'main', value: packageJson.main },
    { key: 'homepage', value: packageJson.homepage },
    { key: 'build.appId', value: packageJson.build?.appId },
    { key: 'build.productName', value: packageJson.build?.productName }
  ];
  
  configs.forEach(config => {
    console.log(`  ${config.key}: ${config.value || '❌ 缺失'}`);
  });
  
} catch (error) {
  console.error('❌ 解析package.json失败:', error.message);
}

console.log('\n✅ 构建检查完成！');
console.log('\n🚀 现在可以运行:');
console.log('  npm run electron-pack-mac    # 构建macOS应用');
console.log('  npm run electron-pack        # 构建应用');
console.log('  .\\build-mac.ps1             # 使用构建脚本');
