// [已弃用] CORS代理 Edge Function
// 此文件已被弃用，保留仅作为参考
// 我们现在使用公共CORS代理服务，请参考 src/lib/proxy 目录

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req: Request) => {
  return new Response(
    JSON.stringify({ 
      error: '已弃用',
      message: '此CORS代理服务已被弃用，请使用新的公共代理服务'
    }), 
    { 
      status: 410, // Gone
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
})