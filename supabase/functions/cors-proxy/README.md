# [已弃用] CORS代理 Edge Function

> **注意：此 Supabase Edge Function 已被弃用**
> 
> 由于 GitHub Pages 与 Vercel/Supabase 不兼容，我们已经迁移到使用公共免费的 CORS 代理服务。
> 请参考项目根目录下的 `CORS_SOLUTION.md` 文件了解新的解决方案。

## 历史功能

此 Edge Function 曾为 GitHub Pages 部署提供 CORS 代理服务，解决跨域访问问题。

- 支持图片、JSON、文本等多种内容类型
- 针对 Notion API 的特殊处理
- 域名白名单安全控制
- 完整的 CORS 头部支持
- 错误处理和日志记录

## 新的解决方案

我们现在使用多个公共 CORS 代理服务，包括：

1. corsproxy.io
2. api.allorigins.win
3. thingproxy.freeboard.io
4. cors-anywhere.herokuapp.com

这些服务提供了类似的功能，并且可以在客户端直接使用，无需部署自己的服务器。

## 迁移指南

如果您仍在使用此 Edge Function，请参考项目中的新 CORS 代理实现，位于 `src/lib/proxy` 目录。