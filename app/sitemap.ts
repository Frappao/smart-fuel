import type { MetadataRoute } from 'next'
import { POPULAR_CITIES } from '../lib/cities/popularCities'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: 'https://rifornio.it/',
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://rifornio.it/prezzi-carburanti',
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://rifornio.it/come-funziona',
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://rifornio.it/il-progetto',
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://rifornio.it/guide/distributore-piu-lontano',
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://rifornio.it/guide/consumo-auto-convenienza',
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://rifornio.it/supporto',
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://rifornio.it/privacy',
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://rifornio.it/cookie',
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const cityRoutes: MetadataRoute.Sitemap = POPULAR_CITIES.map((city) => ({
    url: `https://rifornio.it/prezzi-carburanti/${city.slug}`,
    lastModified,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [...baseRoutes, ...cityRoutes]
}