// Universal CORS Proxy - 支持多种外部API代理
// 特别针对中国网络环境优化

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

console.log("Universal Proxy function started")

serve(async (req) => {
  const { url, method } = req
  const requestUrl = new URL(url)
  
  // 处理 CORS 预检请求
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 从查询参数获取目标URL
    const targetUrl = requestUrl.searchParams.get('url')
    
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: '缺少目标URL参数' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`代理请求: ${method} ${targetUrl}`)

    // 检查目标URL是否允许
    const allowedDomains = [
      'api.notion.com',
      'favicon.im',  
      'www.google.com',
      'bing.img.run',
      'bing.com',
      's2.googleusercontent.com'
    ]
    
    const targetDomain = new URL(targetUrl).hostname
    const isAllowed = allowedDomains.some(domain => 
      targetDomain === domain || targetDomain.endsWith('.' + domain)
    )
    
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: '目标域名不在允许列表中' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 准备转发的头部
    const forwardHeaders: HeadersInit = {
      'User-Agent': 'Universal-Proxy/1.0'
    }

    // 如果是Notion API，添加必要头部
    if (targetDomain === 'api.notion.com') {
      const authHeader = req.headers.get('authorization') || req.headers.get('x-api-key')
      if (authHeader) {
        forwardHeaders['Authorization'] = authHeader
        forwardHeaders['Content-Type'] = 'application/json'
        forwardHeaders['Notion-Version'] = '2022-06-28'
      }
    }

    // 如果是图片请求，添加图片头部
    if (targetUrl.includes('.jpg') || targetUrl.includes('.png') || targetUrl.includes('.jpeg') || targetUrl.includes('bing.img.run')) {
      forwardHeaders['Accept'] = 'image/*'
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

    // 发送请求到目标API
    const response = await fetch(targetUrl, fetchOptions)
    
    console.log(`目标API响应: ${response.status}`)

    // 处理不同类型的响应
    let responseData: string | ArrayBuffer
    const contentType = response.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      responseData = await response.text()
    } else if (contentType.startsWith('image/')) {
      // 对于图片，返回二进制数据
      responseData = await response.arrayBuffer()
      return new Response(responseData, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
        },
      })
    } else {
      responseData = await response.text()
    }

    // 返回响应
    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType || 'application/json',
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