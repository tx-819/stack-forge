import type { Config } from '@alova/wormhole'

export default <Config>{
  generator: [
    {
      input: 'openapi.json',
      platform: 'swagger',
      output: 'src/api',
      responseMediaType: 'application/json',
      bodyMediaType: 'application/json',
      version: 3,
      type: 'typescript',
      global: 'Apis',
      handleApi: (apiDescriptor) => {
        if (apiDescriptor.deprecated) {
          return undefined
        }
        return apiDescriptor
      },
    },
  ],
  autoUpdate: false,
}
