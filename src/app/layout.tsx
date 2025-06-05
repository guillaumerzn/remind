import './globals.css'
import { Geist } from 'next/font/google'

const geist = Geist({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-geist' })

export const metadata = {
  title: 'Remind',
  description: 'Dashboard de rappels de rendez-vous',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={geist.variable}>
      <body>{children}</body>
    </html>
  )
}
