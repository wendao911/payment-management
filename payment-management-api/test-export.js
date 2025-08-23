const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your_test_token_here'; // 需要替换为有效的JWT token

// 测试导出功能
async function testExport() {
  try {
    console.log('🧪 开始测试Excel导出功能...');
    
    // 测试1: 不带参数的导出
    console.log('\n📋 测试1: 导出所有付款记录');
    await testExportWithParams({}, 'all_payment_records.xlsx');
    
    // 测试2: 带搜索条件的导出
    console.log('\n📋 测试2: 按日期范围导出');
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    await testExportWithParams({
      startDate: lastMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }, 'recent_payment_records.xlsx');
    
    // 测试3: 测试错误处理
    console.log('\n📋 测试3: 测试无效token');
    await testExportWithInvalidToken();
    
    console.log('\n✅ 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 测试带参数的导出
async function testExportWithParams(params, filename) {
  try {
    console.log(`   📤 导出参数:`, params);
    
    const response = await axios.get(`${API_BASE_URL}/payment-records/export/excel`, {
      params,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      responseType: 'stream'
    });
    
    // 保存文件到本地
    const filePath = path.join(__dirname, 'test-exports', filename);
    const writer = fs.createWriteStream(filePath);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`   ✅ 导出成功: ${filename}`);
        console.log(`   📁 文件保存到: ${filePath}`);
        resolve();
      });
      writer.on('error', reject);
    });
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ⚠️  认证失败，请检查token');
    } else {
      console.log(`   ❌ 导出失败: ${error.message}`);
    }
  }
}

// 测试无效token
async function testExportWithInvalidToken() {
  try {
    const response = await axios.get(`${API_BASE_URL}/payment-records/export/excel`, {
      headers: {
        'Authorization': 'Bearer invalid_token',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
    console.log('   ❌ 应该返回401错误，但收到了响应');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ✅ 正确返回401认证错误');
    } else {
      console.log(`   ❌ 意外的错误: ${error.message}`);
    }
  }
}

// 创建测试输出目录
function createTestDirectory() {
  const testDir = path.join(__dirname, 'test-exports');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
    console.log('📁 创建测试输出目录:', testDir);
  }
}

// 主函数
async function main() {
  console.log('🚀 付款记录Excel导出功能测试');
  console.log('='.repeat(50));
  
  // 检查依赖
  try {
    require('exceljs');
    console.log('✅ ExcelJS依赖已安装');
  } catch (error) {
    console.error('❌ ExcelJS依赖未安装，请先运行: npm install exceljs');
    return;
  }
  
  // 创建测试目录
  createTestDirectory();
  
  // 运行测试
  await testExport();
  
  console.log('\n📝 测试说明:');
  console.log('1. 请确保后端服务器正在运行 (npm start)');
  console.log('2. 请替换TEST_TOKEN为有效的JWT token');
  console.log('3. 检查test-exports目录中的生成文件');
  console.log('4. 验证Excel文件内容是否正确');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testExport, testExportWithParams };
