import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Nákupní seznam',
        short_name: 'Nákup',
        description: 'Jednoduchý nákupní seznam pro mobil i desktop',
        start_url: '/',
        display: 'standalone',
        background_color: '#4338ca',
        theme_color: '#4338ca',
        orientation: 'portrait',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any',
            },
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable',
            },
        ],
    }
}
