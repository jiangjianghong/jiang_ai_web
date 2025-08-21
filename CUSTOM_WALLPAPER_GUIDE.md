# 自定义壁纸功能使用指南

## 功能概述

新增的自定义壁纸功能允许用户上传自己的图片作为背景壁纸，图片仅存储在本地浏览器缓存中，不会上传到服务器。

## 主要特性

### 🖼️ **支持格式**
- JPG/JPEG
- PNG  
- WebP

### 📏 **文件限制**
- 最大文件大小: 10MB
- 自动压缩优化
- 最大分辨率: 4K (3840x2160)

### 💾 **存储方式**
- 本地 IndexedDB 存储
- 不上传到云端服务器
- 缓存有效期: 1年
- 自动内存管理

## 使用方法

### 1. 上传壁纸
1. 打开设置页面
2. 找到"壁纸设置"区域
3. 在"自定义壁纸"部分点击"上传壁纸"
4. 选择图片文件
5. 等待上传和处理完成

### 2. 使用自定义壁纸
1. 上传成功后，壁纸分辨率会自动切换到"自定义壁纸"
2. 也可以手动选择"自定义壁纸"选项
3. 背景会立即更新为上传的图片

### 3. 管理壁纸
- **更换**: 重新上传新图片会替换旧的
- **删除**: 点击垃圾桶图标删除自定义壁纸
- **查看信息**: 显示文件大小等信息

## 技术实现

### 前端组件
- `customWallpaperManager.ts`: 核心管理器
- `TransparencyContext.tsx`: 状态管理
- `Settings.tsx`: 用户界面
- `OptimizedWallpaperService.ts`: 壁纸服务集成

### 处理流程
1. **文件验证**: 检查格式和大小
2. **图片处理**: Canvas 压缩优化
3. **本地存储**: IndexedDB 缓存
4. **内存管理**: Blob URL 管理
5. **状态同步**: Context 状态更新

### 缓存策略
```typescript
// 缓存键
const CUSTOM_WALLPAPER_KEY = 'custom-wallpaper';

// 有效期: 1年
const CACHE_DURATION = 365 * 24 * 60 * 60 * 1000;

// 自动清理
memoryManager.cleanup('custom-wallpaper');
```

## 性能优化

### 🚀 **加载优化**
- 立即从缓存加载
- Blob URL 复用
- 内存自动释放

### 📦 **存储优化**  
- 智能压缩 (85% 质量)
- 分辨率限制 (最大4K)
- 过期自动清理

### 🔄 **状态管理**
- React Context 集成
- 本地存储持久化
- 实时状态同步

## 用户体验

### ✅ **优点**
- 隐私安全 (本地存储)
- 加载快速 (缓存机制)
- 操作简单 (拖拽上传)
- 自动优化 (压缩处理)

### ⚠️ **注意事项**
- 清除浏览器数据会丢失壁纸
- 不同设备间不会同步
- 大文件会自动压缩
- 仅支持图片格式

## 故障排除

### 上传失败
- 检查文件格式是否支持
- 确认文件大小不超过10MB
- 尝试刷新页面重试

### 显示异常
- 检查浏览器是否支持IndexedDB
- 清除浏览器缓存重试
- 确认图片文件未损坏

### 性能问题
- 避免上传过大的图片
- 定期清理浏览器缓存
- 关闭其他占用内存的标签页

## API 参考

### CustomWallpaperManager

```typescript
// 上传壁纸
await customWallpaperManager.uploadWallpaper(file);

// 获取壁纸
await customWallpaperManager.getCustomWallpaper();

// 删除壁纸
await customWallpaperManager.deleteCustomWallpaper();

// 检查是否存在
await customWallpaperManager.hasCustomWallpaper();

// 获取信息
await customWallpaperManager.getWallpaperInfo();
```

### Context 使用

```typescript
const { 
  wallpaperResolution, 
  customWallpaperUrl,
  setWallpaperResolution,
  setCustomWallpaperUrl 
} = useTransparency();

// 切换到自定义壁纸
setWallpaperResolution('custom');
```

## 更新日志

### v1.0.0 (2024-12-21)
- ✨ 新增自定义壁纸上传功能
- 🔧 集成到现有壁纸系统
- 💾 本地 IndexedDB 存储
- 🎨 设置页面 UI 集成
- ⚡ 性能优化和内存管理