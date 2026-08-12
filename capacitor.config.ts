import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'it.rifornio.app',
  appName: 'Rifornio',
  webDir: 'mobile/dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config
