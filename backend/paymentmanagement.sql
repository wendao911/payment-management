/*
 Navicat Premium Dump SQL

 Source Server         : test_k6booking
 Source Server Type    : MySQL
 Source Server Version : 80042 (8.0.42)
 Source Host           : localhost:3306
 Source Schema         : paymentmanagement

 Target Server Type    : MySQL
 Target Server Version : 80042 (8.0.42)
 File Encoding         : 65001

 Date: 16/09/2025 17:31:48
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for attachments
-- ----------------------------
DROP TABLE IF EXISTS `attachments`;
CREATE TABLE `attachments`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `FileName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件名',
  `OriginalFileName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '原始文件名',
  `FilePath` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件路径',
  `FileSize` int NOT NULL COMMENT '文件大小(字节)',
  `FileType` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '文件类型',
  `MimeType` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'MIME类型',
  `RelatedTable` enum('PayableManagement','PaymentRecords','Contracts','Temp') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '关联表名',
  `RelatedId` int NULL DEFAULT NULL COMMENT '关联记录ID',
  `UploadedBy` int NULL DEFAULT NULL COMMENT '上传用户ID',
  `CreatedAt` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`) USING BTREE,
  INDEX `UploadedBy`(`UploadedBy` ASC) USING BTREE,
  CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`UploadedBy`) REFERENCES `users` (`Id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 68 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of attachments
-- ----------------------------

-- ----------------------------
-- Table structure for bankaccountbalances
-- ----------------------------
DROP TABLE IF EXISTS `bankaccountbalances`;
CREATE TABLE `bankaccountbalances`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `BankAccountId` int NOT NULL COMMENT '银行账户ID',
  `Balance` decimal(15, 2) NOT NULL COMMENT '余额',
  `BalanceStatus` enum('Available','Unavailable') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'Available' COMMENT '余额状态',
  `Notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE,
  INDEX `BankAccountId`(`BankAccountId` ASC) USING BTREE,
  CONSTRAINT `bankaccountbalances_ibfk_1` FOREIGN KEY (`BankAccountId`) REFERENCES `bankaccounts` (`Id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of bankaccountbalances
-- ----------------------------

-- ----------------------------
-- Table structure for bankaccounts
-- ----------------------------
DROP TABLE IF EXISTS `bankaccounts`;
CREATE TABLE `bankaccounts`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `BankId` int NOT NULL COMMENT '所属银行ID',
  `AccountNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '账户号码',
  `AccountName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '账户名称',
  `AccountType` enum('Checking','Savings','Investment','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'Checking' COMMENT '账户类型',
  `CurrencyCode` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '账户币种',
  `InitialBalance` decimal(15, 2) NULL DEFAULT 0.00 COMMENT '初始余额',
  `CurrentBalance` decimal(15, 2) NULL DEFAULT 0.00 COMMENT '当前余额',
  `IsActive` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `Notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE INDEX `unique_account_bank`(`BankId` ASC, `AccountNumber` ASC) USING BTREE,
  CONSTRAINT `bankaccounts_ibfk_1` FOREIGN KEY (`BankId`) REFERENCES `banks` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of bankaccounts
-- ----------------------------

-- ----------------------------
-- Table structure for banks
-- ----------------------------
DROP TABLE IF EXISTS `banks`;
CREATE TABLE `banks`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CountryId` int NOT NULL COMMENT '所属国家ID',
  `BankCode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '银行代码',
  `BankName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '银行名称',
  `BankType` enum('Commercial','Investment','Central','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'Commercial' COMMENT '银行类型',
  `Website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '银行官网',
  `IsActive` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE INDEX `unique_bank_country`(`CountryId` ASC, `BankCode` ASC) USING BTREE,
  CONSTRAINT `banks_ibfk_1` FOREIGN KEY (`CountryId`) REFERENCES `countries` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of banks
-- ----------------------------

-- ----------------------------
-- Table structure for contracts
-- ----------------------------
DROP TABLE IF EXISTS `contracts`;
CREATE TABLE `contracts`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ContractNumber` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '合同编号',
  `Title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '合同标题',
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '合同描述',
  `TotalAmount` decimal(18, 2) NULL DEFAULT NULL COMMENT '合同总金额',
  `ContractDate` datetime(6) NULL DEFAULT NULL COMMENT '合同签订日期',
  `StartDate` datetime(6) NULL DEFAULT NULL COMMENT '合同开始日期',
  `EndDate` datetime(6) NULL DEFAULT NULL COMMENT '合同结束日期',
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'Active' COMMENT '合同状态',
  `ParentContractId` int NULL DEFAULT NULL COMMENT '父合同ID（用于补充协议）',
  `SupplierId` int NULL DEFAULT NULL COMMENT '供应商ID',
  `ContractTextPath` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '合同文本文件路径',
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `UpdatedAt` datetime(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE INDEX `ContractNumber`(`ContractNumber` ASC) USING BTREE,
  INDEX `idx_contract_number`(`ContractNumber` ASC) USING BTREE,
  INDEX `idx_supplier_id`(`SupplierId` ASC) USING BTREE,
  INDEX `idx_parent_contract_id`(`ParentContractId` ASC) USING BTREE,
  INDEX `idx_contract_date`(`ContractDate` ASC) USING BTREE,
  INDEX `idx_status`(`Status` ASC) USING BTREE,
  INDEX `idx_contracts_supplier`(`SupplierId` ASC) USING BTREE,
  INDEX `idx_contracts_status`(`Status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '合同信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of contracts
-- ----------------------------

-- ----------------------------
-- Table structure for countries
-- ----------------------------
DROP TABLE IF EXISTS `countries`;
CREATE TABLE `countries`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Code` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '国家代码(ISO 3166-1 alpha-3)',
  `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '国家名称',
  `CurrencyCode` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '默认货币代码',
  `IsActive` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE INDEX `Code`(`Code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of countries
-- ----------------------------

-- ----------------------------
-- Table structure for currencies
-- ----------------------------
DROP TABLE IF EXISTS `currencies`;
CREATE TABLE `currencies`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Code` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '币种代码(ISO 4217)',
  `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '币种名称',
  `Symbol` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '币种符号',
  `ExchangeRate` decimal(18, 6) NULL DEFAULT 1.000000 COMMENT '对美元汇率（1 USD = ExchangeRate 单位的该币种）',
  `IsActive` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE INDEX `Code`(`Code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of currencies
-- ----------------------------

-- ----------------------------
-- Table structure for payablemanagement
-- ----------------------------
DROP TABLE IF EXISTS `payablemanagement`;
CREATE TABLE `payablemanagement`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ContractId` int NOT NULL COMMENT '合同ID',
  `SupplierId` int NOT NULL COMMENT '供应商ID',
  `PayableNumber` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '应付编号',
  `PayableAmount` decimal(18, 2) NOT NULL COMMENT '应付金额',
  `CurrencyCode` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CNY' COMMENT '币种',
  `PaymentDueDate` date NOT NULL COMMENT '付款截止日期',
  `Importance` enum('normal','important','very_important') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'normal' COMMENT '重要程度：一般、重要、非常重要',
  `Urgency` enum('normal','urgent','very_urgent','overdue') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'normal' COMMENT '紧急程度：一般、紧急、非常紧急、已延期',
  `Status` enum('pending','partial','completed','overdue') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '状态：待付款、部分付款、已完成、逾期',
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '应付说明',
  `Notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `CreatedAt` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE INDEX `PayableNumber`(`PayableNumber` ASC) USING BTREE,
  INDEX `ContractId`(`ContractId` ASC) USING BTREE,
  INDEX `SupplierId`(`SupplierId` ASC) USING BTREE,
  CONSTRAINT `payablemanagement_ibfk_1` FOREIGN KEY (`ContractId`) REFERENCES `contracts` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `payablemanagement_ibfk_2` FOREIGN KEY (`SupplierId`) REFERENCES `suppliers` (`Id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of payablemanagement
-- ----------------------------

-- ----------------------------
-- Table structure for paymentrecords
-- ----------------------------
DROP TABLE IF EXISTS `paymentrecords`;
CREATE TABLE `paymentrecords`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `PaymentNumber` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '付款编号',
  `PayableManagementId` int NOT NULL COMMENT '应付管理主表ID',
  `CurrencyCode` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CNY' COMMENT '币种',
  `PaymentDescription` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '付款说明',
  `PaymentAmount` decimal(18, 2) NOT NULL COMMENT '付款金额',
  `PaymentDate` date NOT NULL COMMENT '付款日期',
  `Notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `CreatedAt` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE INDEX `PaymentNumber`(`PaymentNumber` ASC) USING BTREE,
  INDEX `PayableManagementId`(`PayableManagementId` ASC) USING BTREE,
  INDEX `idx_payment_records_number`(`PaymentNumber` ASC) USING BTREE,
  CONSTRAINT `paymentrecords_ibfk_1` FOREIGN KEY (`PayableManagementId`) REFERENCES `payablemanagement` (`Id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of paymentrecords
-- ----------------------------

-- ----------------------------
-- Table structure for suppliers
-- ----------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '供应商名称',
  `Address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '地址',
  `ContactPerson` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联系人',
  `Phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '电话',
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱',
  `TaxNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '税号',
  `BankAccount` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '银行账户',
  `BankName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '银行名称',
  `IsActive` tinyint(1) NULL DEFAULT NULL COMMENT '是否启用',
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `UpdatedAt` datetime(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE INDEX `Name`(`Name` ASC) USING BTREE,
  INDEX `idx_name`(`Name` ASC) USING BTREE,
  INDEX `idx_contact_person`(`ContactPerson` ASC) USING BTREE,
  INDEX `idx_phone`(`Phone` ASC) USING BTREE,
  INDEX `idx_email`(`Email` ASC) USING BTREE,
  INDEX `idx_suppliers_name`(`Name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '供应商信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of suppliers
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Role` enum('admin','user','manager') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'user',
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `LastLoginAt` timestamp(6) NULL DEFAULT NULL,
  `CreatedAt` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE INDEX `Username`(`Username` ASC) USING BTREE,
  UNIQUE INDEX `Email`(`Email` ASC) USING BTREE,
  INDEX `idx_users_username`(`Username` ASC) USING BTREE,
  INDEX `idx_users_email`(`Email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', 'admin', 1, '2025-09-16 17:26:03.347452', '2025-08-15 14:04:04.212890', '2025-09-16 17:26:03.347452');

SET FOREIGN_KEY_CHECKS = 1;
