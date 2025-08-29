import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KLV Data Extraction Suite',
  description: 'Complete toolkit for KLV data processing, parsing, and analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}