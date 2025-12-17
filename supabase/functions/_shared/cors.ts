// CORS 配置文件
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-api-key, content-type, notion-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Expose-Headers': 'X-Wallpaper-Source, X-Wallpaper-Date, X-Is-Fallback, X-Wallpaper-Size, X-Wallpaper-Resolution',
}