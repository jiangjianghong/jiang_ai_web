# Supabase 邮件模板配置指南

## 如何自定义注册确认邮件

### 1. 登录 Supabase 控制台
访问：https://supabase.com/dashboard

### 2. 进入邮件模板设置
1. 选择你的项目
2. 点击左侧菜单 "Authentication" 
3. 点击 "Email Templates"
4. 选择 "Confirm signup"

### 3. 自定义邮件内容

将默认模板替换为以下内容：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>欢迎注册江江的网站</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .welcome-text {
            font-size: 18px;
            margin-bottom: 30px;
            color: #555;
            text-align: center;
        }
        .confirm-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
        .confirm-button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
        }
        .button-container {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌟 江江的网站</div>
        </div>
        
        <div class="welcome-text">
            你好呀！欢迎使用江江的网站，点击下面的链接确认注册哦。祝您使用愉快！
        </div>
        
        <div class="button-container">
            <a href="{{ .ConfirmationURL }}" class="confirm-button">
                确认注册 ✨
            </a>
        </div>
        
        <p style="text-align: center; margin-top: 20px; color: #666;">
            如果按钮无法点击，请复制以下链接到浏览器：<br>
            <a href="{{ .ConfirmationURL }}" style="color: #2563eb;">{{ .ConfirmationURL }}</a>
        </p>
        
        <div class="footer">
            <p>这封邮件是自动发送的，请勿回复。</p>
            <p>如有疑问，请联系客服。</p>
        </div>
    </div>
</body>
</html>
```

### 4. 邮件主题设置

Subject 字段设置为：
```
🌟 欢迎注册江江的网站 - 请确认您的邮箱
```

### 5. 保存设置

点击 "Save" 保存邮件模板。

## 可用变量

在邮件模板中，你可以使用以下变量：

- `{{ .ConfirmationURL }}` - 确认链接
- `{{ .Email }}` - 用户邮箱
- `{{ .SiteURL }}` - 网站URL
- `{{ .Token }}` - 确认令牌

## 注意事项

1. **测试邮件**：保存后建议先用测试邮箱注册测试一下
2. **垃圾邮件**：第一次可能会进入垃圾邮件文件夹
3. **链接有效期**：确认链接默认24小时有效
4. **移动端适配**：模板已包含响应式设计

## 完成后效果

用户注册后会收到一封包含你自定义内容的精美邮件，点击确认按钮即可完成注册。
