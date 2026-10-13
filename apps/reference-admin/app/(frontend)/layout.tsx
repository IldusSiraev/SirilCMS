import type { Metadata } from 'next'
import React from 'react'

import '../globals.css'

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Siril CMS',
}

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => (
  <html lang="en">
    <body>{children}</body>
  </html>
)

export default Layout
