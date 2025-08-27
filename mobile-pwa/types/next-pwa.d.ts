declare module 'next-pwa' {
  import { NextConfig } from 'next'
  
  interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    skipWaiting?: boolean
    runtimeCaching?: any[]
    buildExcludes?: string[]
    publicExcludes?: string[]
  }
  
  function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig
  
  export default withPWA
}