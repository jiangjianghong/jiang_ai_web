// Supabase Edge Function - Notion API 代理
// 解决 CORS 跨域问题，安全转发请求到 Notion API

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

console.log("Notion Proxy function started")

serve(async (req) => {
  const { url, method } = req
  const requestUrl = new URL(url)
  
  // 处理 CORS 预检请求
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 提取 Notion API 路径
    // 实际路径格式: /notion-proxy/users/me -> /users/me
    const notionPath = requestUrl.pathname.replace('/notion-proxy', '')
    // 确保路径以 / 开头，如果为空则添加 /
    const cleanPath = !notionPath || notionPath === '' ? '' : (notionPath.startsWith('/') ? notionPath : `/${notionPath}`)
    const notionUrl = `https://api.notion.com/v1${cleanPath}${requestUrl.search}`
    
    console.log(`原始路径: ${requestUrl.pathname}`)
    console.log(`提取的路径: "${notionPath}"`)
    console.log(`清理后路径: "${cleanPath}"`)
    console.log(`最终 Notion URL: ${notionUrl}`)
    
    // 验证最终 URL 是否有效
    try {
      const testUrl = new URL(notionUrl)
      console.log(`URL 验证成功: ${testUrl.href}`)
    } catch (urlError) {
      console.error(`构建的 URL 无效: ${notionUrl}`, urlError)
      return new Response(
        JSON.stringify({ 
          object: "error", 
          status: 400, 
          code: "invalid_request_url", 
          message: `Invalid request URL: ${notionUrl}`,
          debug: {
            originalPath: requestUrl.pathname,
            extractedPath: notionPath,
            cleanPath: cleanPath,
            urlError: urlError.message
          }
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log(`代理请求: ${method} ${notionUrl}`)


    // 获取请求头 - 支持多种认证方式
    const authHeader = req.headers.get('authorization') || req.headers.get('x-api-key')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '缺少 Authorization 或 API Key 头部' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`收到认证头: ${authHeader.substring(0, 30)}...`)
    
    // 检查API Key格式并标准化
    let finalAuthHeader = authHeader
    if (!authHeader.startsWith('Bearer ')) {
      // 如果不是以Bearer开头，检查是否是有效的API Key格式
      if (authHeader.startsWith('secret_') || authHeader.startsWith('ntn_')) {
        finalAuthHeader = `Bearer ${authHeader}`
        console.log('添加Bearer前缀到API Key')
      } else {
        console.log('警告: 未识别的API Key格式')
      }
    }

    console.log(`最终认证头: ${finalAuthHeader.substring(0, 30)}...`)

    // 准备转发的头部
    const forwardHeaders: HeadersInit = {
      'Authorization': finalAuthHeader,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
      'User-Agent': 'Supabase-Edge-Function/1.0'
    }

    // 准备请求选项
    const fetchOptions: RequestInit = {
      method,
      headers: forwardHeaders,
    }

    // 如果是 POST/PUT/PATCH 请求，添加请求体
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const body = await req.text()
      if (body) {
        fetchOptions.body = body
      }
    }

    // 发送请求到 Notion API
    console.log(`发送请求到 Notion API: ${notionUrl}`)
    console.log(`请求头: ${JSON.stringify(forwardHeaders)}`)
    
    const response = await fetch(notionUrl, fetchOptions)
    const data = await response.text()

    console.log(`Notion API 响应: ${response.status} ${response.statusText}`)
    console.log(`响应内容: ${data.substring(0, 200)}...`)

    // 返回响应
    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('代理错误:', error)
    
    return new Response(
      JSON.stringify({ 
        error: '代理服务器内部错误',
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})