import { QueryInterface } from "@/components/query-interface"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-3 text-balance font-mono uppercase tracking-wider drop-shadow-[0_0_15px_rgba(120,255,120,0.6)]">
            {">"} SQL Query Generator {"<"}
          </h1>
          <p className="text-accent text-lg font-mono">
            {">"} Describe what you need in natural language, get SQL queries instantly
          </p>
        </div>
        <QueryInterface />
      </div>
    </main>
  )
}
