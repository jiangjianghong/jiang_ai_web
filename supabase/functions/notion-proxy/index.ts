// Supabase Edge Function - Notion API 代理
// 解决 CORS 跨域问题，安全转发请求到 Notion API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // 例: /functions/v1/notion-proxy/databases/xxx -> /databases/xxx
    const notionPath = requestUrl.pathname.replace('/functions/v1/notion-proxy', '')
    const notionUrl = `https://api.notion.com/v1${notionPath}${requestUrl.search}`
    
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

    // 准备转发的头部
    const forwardHeaders: HeadersInit = {
      'Authorization': authHeader,
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
    const response = await fetch(notionUrl, fetchOptions)
    const data = await response.text()

    console.log(`Notion API 响应: ${response.status}`)

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