// @ts-ignore: Deno runtime
// Favicon Service - 基于Supabase的跨域代理和缓存服务
// 作为公开镜像源的备用方案，解决跨域限制和缓存问题

// @ts-ignore: Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore: Deno import
import { corsHeaders } from '../_shared/cors.ts'

console.log("Favicon Service function started")

// 初始化Supabase客户端
// @ts-ignore: Deno global
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
// @ts-ignore: Deno global
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Favicon源列表（按优先级排序）
// 优先使用 favicon.im（国内访问友好），移除网站根目录检查
const FAVICON_SOURCES = [
  (domain: string) => `https://favicon.im/${domain}?larger=true`,
  (domain: string) => `https://favicon.im/${domain}`,
  (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
]

serve(async (req) => {
  const { url, method } = req
  const requestUrl = new URL(url)

  // 处理 CORS 预检请求
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 从查询参数获取域名
    const domain = requestUrl.searchParams.get('domain')
    const size = parseInt(requestUrl.searchParams.get('size') || '32')
    const forceRefresh = requestUrl.searchParams.get('refresh') === 'true'

    if (!domain) {
      return new Response(
        JSON.stringify({ error: '缺少domain参数' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 清理域名
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
    const cacheKey = `favicons/${cleanDomain}-${size}.ico`

    console.log(`Favicon请求: ${cleanDomain} (size: ${size})`)

    // 如果不强制刷新，先检查Supabase Storage中是否有缓存
    if (!forceRefresh) {
      try {
        const { data: existingFile } = await supabase.storage
          .from('favicons')
          .download(cacheKey)

        if (existingFile) {
          console.log(`使用缓存的favicon: ${cacheKey}`)
          return new Response(existingFile, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'image/x-icon',
              'Cache-Control': 'public, max-age=86400', // 1天缓存
            },
          })
        }
      } catch (error) {
        console.log(`缓存未找到: ${cacheKey}`)
      }
    }

    // 尝试从各个源获取favicon
    let faviconData: ArrayBuffer | null = null
    let contentType = 'image/x-icon'
    let successUrl = ''

    for (const source of FAVICON_SOURCES) {
      const faviconUrl = source(cleanDomain)

      try {
        console.log(`尝试获取favicon: ${faviconUrl}`)

        const response = await fetch(faviconUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FaviconBot/1.0)',
            'Accept': 'image/*,*/*;q=0.8',
          },
          // 设置5秒超时
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok && response.body) {
          faviconData = await response.arrayBuffer()
          contentType = response.headers.get('content-type') || 'image/x-icon'
          successUrl = faviconUrl
          console.log(`成功获取favicon: ${faviconUrl} (${faviconData.byteLength} bytes)`)
          break
        }
      } catch (error) {
        console.log(`获取favicon失败: ${faviconUrl} - ${error.message}`)
        continue
      }
    }

    // 如果所有源都失败，返回默认图标
    if (!faviconData) {
      console.log(`所有favicon源都失败，返回默认图标`)
      return new Response(
        JSON.stringify({
          error: '无法获取favicon',
          domain: cleanDomain,
          fallback: '/icon/favicon.png'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 将favicon保存到Supabase Storage
    try {
      const { error: uploadError } = await supabase.storage
        .from('favicons')
        .upload(cacheKey, faviconData, {
          contentType,
          cacheControl: '86400', // 1天缓存
          upsert: true, // 如果存在则覆盖
        })

      if (uploadError) {
        console.error('保存favicon到Storage失败:', uploadError)
      } else {
        console.log(`成功缓存favicon: ${cacheKey}`)
      }
    } catch (error) {
      console.error('Storage操作错误:', error)
    }

    // 返回favicon数据
    return new Response(faviconData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 1天缓存
        'X-Favicon-Source': successUrl,
        'X-Favicon-Size': faviconData.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Favicon服务错误:', error)

    return new Response(
      JSON.stringify({
        error: 'Favicon服务内部错误',
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