# Favicon Service

基于 Supabase 的统一 favicon 获取和缓存服务，用于替代外部镜像服务。

## 功能特性

- 🚀 **统一服务**: 通过单一 API 获取网站 favicon
- 💾 **智能缓存**: 自动缓存到 Supabase Storage，避免重复请求
- 🔄 **多源支持**: 支持多个 favicon 源，自动故障转移
- 🌍 **无需代理**: 直接部署在 Supabase Edge Functions，避免网络限制
- ⚡ **高性能**: 边缘计算，全球低延迟访问

## API 接口

### 获取 Favicon

```
GET /functions/v1/favicon-service
```

#### 查询参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `domain` | string | ✅ | - | 目标网站域名 |
| `size` | number | ❌ | 32 | 图标尺寸（像素） |
| `refresh` | boolean | ❌ | false | 强制刷新缓存 |

#### 示例请求

```bash
# 获取 GitHub 的 favicon
curl "https://your-project.supabase.co/functions/v1/favicon-service?domain=github.com&size=64"

# 强制刷新缓存
curl "https://your-project.supabase.co/functions/v1/favicon-service?domain=github.com&refresh=true"
```

#### 响应

**成功响应**:
- **状态码**: 200
- **Content-Type**: `image/x-icon` 或相应的图片类型
- **Headers**:
  - `X-Favicon-Source`: 成功获取的源 URL
  - `X-Favicon-Size`: 图标文件大小（字节）
  - `Cache-Control`: 缓存控制头

**错误响应**:
- **状态码**: 404 - 无法获取 favicon
- **状态码**: 400 - 缺少必需参数
- **状态码**: 500 - 服务器内部错误

## 前置要求

### 1. 创建 Storage Bucket

在 Supabase 控制台中创建名为 `favicons` 的 Storage Bucket：

```sql
-- 在 Supabase SQL Editor 中执行
INSERT INTO storage.buckets (id, name, public) 
VALUES ('favicons', 'favicons', true);

-- 设置 Storage 策略（允许匿名读取）
CREATE POLICY "Public favicon access" ON storage.objects 
FOR SELECT USING (bucket_id = 'favicons');

-- 允许 Service Role 写入
CREATE POLICY "Service role favicon upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'favicons');

CREATE POLICY "Service role favicon update" ON storage.objects 
FOR UPDATE USING (bucket_id = 'favicons');
```

### 2. 环境变量

确保以下环境变量已配置：

- `SUPABASE_URL`: Supabase 项目 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key（用于 Storage 操作）

## 部署

```bash
# 部署 Edge Function
supabase functions deploy favicon-service
```

## Favicon 源优先级

1. `https://{domain}/favicon.ico`
2. `https://{domain}/favicon.png` 
3. `https://{domain}/apple-touch-icon.png`
4. `https://www.google.com/s2/favicons?domain={domain}&sz={size}`
5. `https://www.google.com/s2/favicons?domain={domain}&sz=32`

## 缓存策略

- **Storage 缓存**: 1天（86400秒）
- **HTTP 缓存**: 1天（Cache-Control）
- **缓存键格式**: `favicons/{domain}-{size}.ico`

## 监控和日志

通过 Supabase Dashboard 的 Edge Functions 日志查看：

- 请求和响应信息
- 缓存命中/未命中
- 错误和性能指标

## 错误处理

- 自动重试不同的 favicon 源
- 超时保护（5秒）
- 优雅降级到默认图标
- 详细的错误日志记录