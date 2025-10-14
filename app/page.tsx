"use client"

import { QueryInterface } from "@/components/query-interface"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function Home() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // const savedTheme = localStorage.getItem("theme")
    // const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    // const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark)

    setIsDark(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)

    if (newIsDark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center relative">
          <Button onClick={toggleTheme} variant="outline" size="icon" className="absolute right-0 top-0 bg-transparent">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <h1 className="text-4xl font-bold text-primary mb-3 text-balance font-mono uppercase tracking-wider">
            {">"} Database Query Generator {"<"}
          </h1>
          <p className="text-accent text-lg font-mono">
            {">"} Describe what you need in natural language, get database queries instantly
          </p>
        </div>
        <QueryInterface />
      </div>
    </main>
  )
}
