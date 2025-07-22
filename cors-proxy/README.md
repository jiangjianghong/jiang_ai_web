# Favicon CORS Proxy

A simple serverless function to proxy favicon requests from favicon.im, solving CORS issues.

## Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in this directory
3. Follow the prompts to deploy

## Usage

Once deployed, use your proxy URL like this:

```
https://your-proxy.vercel.app/api/favicon?domain=example.com&size=64
```

Parameters:
- `domain`: The domain to get favicon for (required)
- `size`: Icon size, defaults to 64

## Example

```
https://your-proxy.vercel.app/api/favicon?domain=github.com&size=32
```