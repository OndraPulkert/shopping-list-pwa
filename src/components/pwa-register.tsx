'use client'

import { useEffect } from 'react'

export function PwaRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .then(() => {
                    console.log('Service worker registered')
                })
                .catch((error) => {
                    console.error('Service worker registration failed:', error)
                })
        }
    }, [])

    return null
}
