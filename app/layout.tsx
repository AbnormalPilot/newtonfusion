import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Instrument_Serif } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "NewtonFuse — AI Visual Studio",
  description:
    "A premium, Apple-inspired workspace for high-quality AI image generation.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${inter.variable} ${instrumentSerif.variable} relative antialiased`}
      >
        <div className="mesh-bg" />
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
