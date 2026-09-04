import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://rifornio.it/',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://rifornio.it/come-funziona',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://rifornio.it/il-progetto',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://rifornio.it/guide/distributore-piu-lontano',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://rifornio.it/guide/consumo-auto-convenienza',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://rifornio.it/supporto',
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://rifornio.it/privacy',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://rifornio.it/cookie',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}