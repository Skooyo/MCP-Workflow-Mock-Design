"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Send, Sparkles, Database, Check, Undo, RefreshCw, AlertCircle, Info } from "lucide-react"

interface TableData {
  headers: string[]
  rows: (string | number)[][]
}

interface Message {
  role: "user" | "assistant"
  content: string
  explanation?: string
  tableVisualization?: {
    before?: TableData
    after?: TableData
    title?: string
  }
}

export function QueryInterface() {
  const [userInput, setUserInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "user",
      content: "Show me all customers who made purchases over $1000 in the last 30 days",
    },
    {
      role: "assistant",
      content: `SELECT 
  c.customer_id,
  c.first_name,
  c.last_name,
  c.email,
  SUM(o.total_amount) as total_spent,
  COUNT(o.order_id) as order_count
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  AND o.total_amount > 1000
GROUP BY c.customer_id, c.first_name, c.last_name, c.email
ORDER BY total_spent DESC;`,
      explanation: `This query retrieves high-value customers from the last month. It joins the customers and orders tables, filters for orders over $1000 made in the past 30 days, then groups by customer to calculate their total spending and order count. Results are sorted by total spending in descending order to show the biggest spenders first.`,
      tableVisualization: {
        after: {
          headers: ["customer_id", "first_name", "last_name", "email", "total_spent", "order_count"],
          rows: [
            [1001, "Sarah", "Johnson", "sarah.j@email.com", 3450.0, 3],
            [1045, "Michael", "Chen", "m.chen@email.com", 2890.5, 2],
            [1023, "Emma", "Williams", "emma.w@email.com", 2150.0, 2],
            [1067, "James", "Brown", "j.brown@email.com", 1875.25, 1],
          ],
        },
        title: "Query Results (4 rows)",
      },
    },
    {
      role: "user",
      content: "Update the price of product 'Wireless Mouse' to $29.99",
    },
    {
      role: "assistant",
      content: `UPDATE products
SET price = 29.99,
    updated_at = NOW()
WHERE product_name = 'Wireless Mouse';`,
      explanation: `This query updates the price of the 'Wireless Mouse' product to $29.99. It also sets the updated_at timestamp to the current time to track when the change was made. The WHERE clause ensures only the specific product is modified.`,
      tableVisualization: {
        before: {
          headers: ["product_id", "product_name", "price", "stock", "updated_at"],
          rows: [[205, "Wireless Mouse", 24.99, 150, "2025-01-05 10:30:00"]],
        },
        after: {
          headers: ["product_id", "product_name", "price", "stock", "updated_at"],
          rows: [[205, "Wireless Mouse", 29.99, 150, "2025-01-07 14:22:15"]],
        },
        title: "Table Change Preview (1 row affected)",
      },
    },
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  const [confirmedQueries, setConfirmedQueries] = useState<Set<number>>(new Set())
  const [messageHistory, setMessageHistory] = useState<Message[][]>([])
  const [selectedExplanationIndex, setSelectedExplanationIndex] = useState<number | null>(null)

  const handleConfirm = (index: number) => {
    setConfirmedQueries((prev) => new Set(prev).add(index))
    console.log("[v0] Query confirmed:", messages[index].content)
  }

  const handleUndo = () => {
    if (messages.length > 0) {
      setMessageHistory((prev) => [...prev, messages])
      setMessages((prev) => prev.slice(0, -2)) // Remove last user message and assistant response
      console.log("[v0] Undid last query")
    }
  }

  const handleRegenerate = (userMessageIndex: number) => {
    const userMessage = messages[userMessageIndex]
    setIsGenerating(true)

    setTimeout(() => {
      const mockSQLQuery = `-- Regenerated query
SELECT c.customer_id, c.email, SUM(o.total_amount) as total
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND o.total_amount > 1000
GROUP BY c.customer_id, c.email;`

      const mockExplanation = `This is an alternative approach to the same query. It uses a simpler JOIN syntax and focuses on essential fields for better performance.`

      setMessages((prev) => {
        const newMessages = [...prev]
        newMessages[userMessageIndex + 1] = {
          role: "assistant",
          content: mockSQLQuery,
          explanation: mockExplanation,
          tableVisualization: newMessages[userMessageIndex + 1].tableVisualization,
        }
        return newMessages
      })
      setIsGenerating(false)
      console.log("[v0] Regenerated response for:", userMessage.content)
    }, 1500)
  }

  const handleReportError = (index: number) => {
    console.log("[v0] Error reported for query:", messages[index].content)
    alert("Error reported! This would send feedback to improve the SQL generation.")
  }

  const handleSubmit = async () => {
    if (!userInput.trim()) return

    const newUserMessage: Message = {
      role: "user",
      content: userInput,
    }

    setMessages((prev) => [...prev, newUserMessage])
    setUserInput("")
    setIsGenerating(true)

    setTimeout(() => {
      const mockSQLQuery = `SELECT users.name, orders.total, orders.created_at
FROM users
INNER JOIN orders ON users.id = orders.user_id
WHERE orders.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY orders.total DESC
LIMIT 10;`

      const mockExplanation = `This query retrieves the top 10 customers by order value from the last 30 days. It joins the users and orders tables, filters for recent orders, and sorts by total amount in descending order.`

      const assistantMessage: Message = {
        role: "assistant",
        content: mockSQLQuery,
        explanation: mockExplanation,
        tableVisualization: {
          after: {
            headers: ["name", "total", "created_at"],
            rows: [
              ["Alice Cooper", 1250.0, "2025-01-05"],
              ["Bob Smith", 980.5, "2025-01-03"],
              ["Carol White", 875.25, "2025-01-06"],
            ],
          },
          title: "Query Results (3 rows shown)",
        },
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsGenerating(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const TableVisualization = ({ data, label }: { data: TableData; label?: string }) => (
    <div className="space-y-2">
      {label && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              {data.headers.map((header, idx) => (
                <th key={idx} className="px-4 py-2 text-left font-semibold text-foreground border-b border-border">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border last:border-0 hover:bg-secondary/30">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-2 text-muted-foreground font-mono text-xs">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const handleShowExplanation = (index: number) => {
    setSelectedExplanationIndex((prev) => (prev === index ? null : index))
  }

  return (
    <div className="space-y-6">
      {/* Dual Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel - User Input */}
        <Card className="bg-card border-2 border-primary/40 p-6 flex flex-col shadow-[0_0_15px_rgba(120,255,120,0.3)]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-primary/30">
            <Sparkles className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(120,255,120,0.8)]" />
            <h2 className="text-lg font-bold text-primary uppercase tracking-wider font-mono">Your Prompt</h2>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-4 h-[50vh] max-h-[50vh]">
            {messages
              .filter((m) => m.role === "user")
              .map((message, idx) => (
                <div
                  key={idx}
                  className="bg-secondary border-2 border-primary/30 rounded p-4 text-foreground shadow-[0_0_10px_rgba(120,255,120,0.2)]"
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">{message.content}</p>
                </div>
              ))}
            {messages.filter((m) => m.role === "user").length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <p className="text-center font-mono">
                  {">"} Start by describing the data you need...
                  <br />
                  <span className="text-xs mt-2 block">
                    {">"} Example: "Get all users who signed up in the last month"
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="> Describe the query you need... (Press Enter to send)"
              className="min-h-[100px] bg-input border-2 border-primary/30 text-foreground placeholder:text-muted-foreground resize-none font-mono focus:border-primary focus:shadow-[0_0_10px_rgba(120,255,120,0.4)]"
            />
            <Button
              onClick={handleSubmit}
              disabled={!userInput.trim() || isGenerating}
              className="w-full bg-[var(--retro-green)] hover:bg-[var(--retro-green)]/80 text-background font-bold uppercase tracking-wide border-2 border-[var(--retro-green)] shadow-[0_0_15px_rgba(120,255,120,0.5)] font-mono"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate Query
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Right Panel - SQL Output */}
        <Card className="bg-card border-2 border-accent/40 p-6 flex flex-col shadow-[0_0_15px_rgba(255,200,100,0.3)]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-accent/30">
            <Database className="w-5 h-5 text-accent drop-shadow-[0_0_8px_rgba(255,200,100,0.8)]" />
            <h2 className="text-lg font-bold text-accent uppercase tracking-wider font-mono">Generated SQL</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 h-[50vh] max-h-[50vh]">
            {messages
              .filter((m) => m.role === "assistant")
              .map((message, idx) => {
                const actualIndex = messages.findIndex((m) => m === message)
                const isConfirmed = confirmedQueries.has(actualIndex)
                const userMessageIndex = actualIndex - 1

                return (
                  <div key={idx} className="space-y-3">
                    <div className="bg-secondary border-2 border-accent/30 rounded p-4 overflow-x-auto shadow-[0_0_10px_rgba(255,200,100,0.2)]">
                      <pre className="text-sm font-mono text-accent leading-relaxed drop-shadow-[0_0_5px_rgba(255,200,100,0.6)]">
                        <code>{message.content}</code>
                      </pre>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={isConfirmed ? "default" : "outline"}
                        onClick={() => handleConfirm(actualIndex)}
                        disabled={isConfirmed}
                        className={`text-xs font-bold uppercase font-mono border-2 ${
                          isConfirmed
                            ? "bg-[var(--retro-green)] border-[var(--retro-green)] text-background shadow-[0_0_10px_rgba(120,255,120,0.5)]"
                            : "border-[var(--retro-green)] text-[var(--retro-green)] hover:bg-[var(--retro-green)] hover:text-background"
                        }`}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {isConfirmed ? "Confirmed" : "Confirm"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRegenerate(userMessageIndex)}
                        disabled={isGenerating}
                        className="text-xs font-bold uppercase font-mono border-2 border-[var(--retro-blue)] text-[var(--retro-blue)] hover:bg-[var(--retro-blue)] hover:text-background"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReportError(actualIndex)}
                        className="text-xs font-bold uppercase font-mono border-2 border-[var(--retro-red)] text-[var(--retro-red)] hover:bg-[var(--retro-red)] hover:text-background"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Report Error
                      </Button>

                      <Button
                        size="sm"
                        variant={selectedExplanationIndex === actualIndex ? "default" : "outline"}
                        onClick={() => handleShowExplanation(actualIndex)}
                        className={`text-xs font-bold uppercase font-mono border-2 ${
                          selectedExplanationIndex === actualIndex
                            ? "bg-[var(--retro-cyan)] border-[var(--retro-cyan)] text-background shadow-[0_0_10px_rgba(100,200,255,0.5)]"
                            : "border-[var(--retro-cyan)] text-[var(--retro-cyan)] hover:bg-[var(--retro-cyan)] hover:text-background"
                        }`}
                      >
                        <Info className="w-3 h-3 mr-1" />
                        Info
                      </Button>
                    </div>
                  </div>
                )
              })}
            {messages.filter((m) => m.role === "assistant").length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <p className="text-center font-mono">
                  {">"} SQL queries will appear here...
                  <br />
                  <span className="text-xs mt-2 block">{">"} Ready to be copied and executed</span>
                </p>
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-accent/30">
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                disabled={messages.length === 0}
                className="w-full text-xs font-bold uppercase font-mono border-2 border-[var(--retro-amber)] text-[var(--retro-amber)] hover:bg-[var(--retro-amber)] hover:text-background bg-transparent"
              >
                <Undo className="w-3 h-3 mr-1" />
                Undo Last Query
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Explanation Section Below */}
      {selectedExplanationIndex !== null && messages[selectedExplanationIndex]?.role === "assistant" && (
        <Card className="bg-card border-2 border-primary/40 p-6 shadow-[0_0_15px_rgba(120,255,120,0.3)]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-primary/30">
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-primary text-lg drop-shadow-[0_0_8px_rgba(120,255,120,0.8)]">💡</span>
            </div>
            <h2 className="text-lg font-bold text-primary uppercase tracking-wider font-mono">Query Explanation</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded border-2 border-primary bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mt-0.5 font-mono shadow-[0_0_8px_rgba(120,255,120,0.4)]">
                {messages.filter((m, idx) => m.role === "assistant" && idx <= selectedExplanationIndex).length}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 font-mono">
                {messages[selectedExplanationIndex].explanation || "This query was generated based on your prompt."}
              </p>
            </div>

            {messages[selectedExplanationIndex].tableVisualization && (
              <div className="ml-9 space-y-4">
                {messages[selectedExplanationIndex].tableVisualization!.title && (
                  <h3 className="text-sm font-bold text-accent uppercase tracking-wide font-mono">
                    {messages[selectedExplanationIndex].tableVisualization!.title}
                  </h3>
                )}

                {messages[selectedExplanationIndex].tableVisualization!.before &&
                messages[selectedExplanationIndex].tableVisualization!.after ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TableVisualization
                      data={messages[selectedExplanationIndex].tableVisualization!.before!}
                      label="Before"
                    />
                    <TableVisualization
                      data={messages[selectedExplanationIndex].tableVisualization!.after!}
                      label="After"
                    />
                  </div>
                ) : messages[selectedExplanationIndex].tableVisualization!.after ? (
                  <TableVisualization data={messages[selectedExplanationIndex].tableVisualization!.after!} />
                ) : null}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
