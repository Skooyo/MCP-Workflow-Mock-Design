"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Send, Sparkles, Database, Undo, RefreshCw, AlertCircle, Info, Play, X, Check, Eye } from "lucide-react"

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

interface QueryResult {
  headers: string[]
  rows: (string | number)[][]
  rowCount: number
  executedAt: string
}

type DatabaseType = "SQL" | "MongoDB" | "PostgreSQL" | "MySQL"

export function QueryInterface() {
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType>("SQL")
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
  const [queryResults, setQueryResults] = useState<Map<number, QueryResult>>(new Map())
  const [messageHistory, setMessageHistory] = useState<Message[][]>([])
  const [selectedExplanationIndex, setSelectedExplanationIndex] = useState<number | null>(null)
  const [showResultsPopup, setShowResultsPopup] = useState(false)
  const [popupQueryIndex, setPopupQueryIndex] = useState<number | null>(null)

  const handleRunQuery = (index: number) => {
    setConfirmedQueries((prev) => new Set(prev).add(index))

    const message = messages[index]
    const isSelectQuery = message.content.trim().toUpperCase().startsWith("SELECT")
    const isUpdateQuery = message.content.trim().toUpperCase().startsWith("UPDATE")

    setTimeout(() => {
      let mockResult: QueryResult

      if (isSelectQuery) {
        mockResult = {
          headers: ["customer_id", "first_name", "last_name", "email", "total_spent", "order_count"],
          rows: [
            [1001, "Sarah", "Johnson", "sarah.j@email.com", 3450.0, 3],
            [1045, "Michael", "Chen", "m.chen@email.com", 2890.5, 2],
            [1023, "Emma", "Williams", "emma.w@email.com", 2150.0, 2],
            [1067, "James", "Brown", "j.brown@email.com", 1875.25, 1],
          ],
          rowCount: 4,
          executedAt: new Date().toLocaleString(),
        }
      } else if (isUpdateQuery) {
        mockResult = {
          headers: ["Status"],
          rows: [["1 row(s) affected"]],
          rowCount: 1,
          executedAt: new Date().toLocaleString(),
        }
      } else {
        mockResult = {
          headers: ["Result"],
          rows: [["Query executed successfully"]],
          rowCount: 1,
          executedAt: new Date().toLocaleString(),
        }
      }

      setQueryResults((prev) => new Map(prev).set(index, mockResult))
      setPopupQueryIndex(index)
      setShowResultsPopup(true)
      console.log("[v0] Query executed:", message.content)
    }, 800)
  }

  const handleUndo = () => {
    if (messages.length > 0) {
      setMessageHistory((prev) => [...prev, messages])
      setMessages((prev) => prev.slice(0, -2))
      setQueryResults(() => new Map())
      console.log("[v0] Undid last query")
    }
  }

  const handleConfirmFromPopup = () => {
    setShowResultsPopup(false)
    setPopupQueryIndex(null)
  }

  const handleUndoFromPopup = () => {
    if (popupQueryIndex !== null) {
      setConfirmedQueries((prev) => {
        const newSet = new Set(prev)
        newSet.delete(popupQueryIndex)
        return newSet
      })
      setQueryResults((prev) => {
        const newMap = new Map(prev)
        newMap.delete(popupQueryIndex)
        return newMap
      })
    }
    setShowResultsPopup(false)
    setPopupQueryIndex(null)
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

      const mockExplanation = `This query retrieves the top 10 customers by order value from the last 30 days. It joins the users and orders tables, filters for recent orders, and sorts by total amount in descending order.`

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
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              {data.headers.map((header, idx) => (
                <th key={idx} className="px-4 py-3 text-left font-semibold text-foreground border-b border-border">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-3 text-muted-foreground font-mono text-xs">
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
      {showResultsPopup && popupQueryIndex !== null && queryResults.has(popupQueryIndex) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-card border border-border p-6 max-w-5xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Query Results</h2>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowResultsPopup(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Execution Summary</h3>
                  <span className="text-xs text-muted-foreground">{queryResults.get(popupQueryIndex)!.executedAt}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rows Affected:</span>
                    <span className="text-lg font-semibold text-foreground">
                      {queryResults.get(popupQueryIndex)!.rowCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span className="text-sm font-semibold text-[var(--success-green)]">Success</span>
                  </div>
                </div>
              </div>

              {messages[popupQueryIndex].tableVisualization?.before &&
              messages[popupQueryIndex].tableVisualization?.after ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Before & After Comparison</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TableVisualization data={messages[popupQueryIndex].tableVisualization!.before!} label="Before" />
                    <TableVisualization data={messages[popupQueryIndex].tableVisualization!.after!} label="After" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Result Set</h3>
                  <div className="overflow-x-auto rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary">
                        <tr>
                          {queryResults.get(popupQueryIndex)!.headers.map((header, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-3 text-left font-semibold text-foreground border-b border-border"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.get(popupQueryIndex)!.rows.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                          >
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-4 py-3 text-muted-foreground font-mono text-sm">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  onClick={handleConfirmFromPopup}
                  className="flex-1 bg-[var(--success-green)] hover:bg-[var(--success-green)]/90 text-white font-medium"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Changes
                </Button>
                <Button
                  onClick={handleUndoFromPopup}
                  variant="outline"
                  className="flex-1 font-medium border-[var(--warning-amber)] text-[var(--warning-amber)] hover:bg-[var(--warning-amber)] hover:text-white bg-transparent"
                >
                  <Undo className="w-4 h-4 mr-2" />
                  Undo Query
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="bg-card border border-border p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Database className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Database Type:</span>
          <div className="flex gap-2 flex-wrap">
            {(["SQL", "MongoDB", "PostgreSQL", "MySQL"] as DatabaseType[]).map((db) => (
              <Button
                key={db}
                size="sm"
                variant={selectedDatabase === db ? "default" : "outline"}
                onClick={() => setSelectedDatabase(db)}
                className={`text-xs font-medium ${
                  selectedDatabase === db
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {db}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border border-border p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Your Prompt</h2>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-3 h-[50vh] max-h-[50vh]">
            {messages
              .filter((m) => m.role === "user")
              .map((message, idx) => (
                <div key={idx} className="bg-secondary/50 rounded-lg p-4 text-foreground">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
            {messages.filter((m) => m.role === "user").length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <p className="text-center">
                  Start by describing the data you need...
                  <br />
                  <span className="text-xs mt-2 block">Example: "Get all users who signed up in the last month"</span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the query you need... (Press Enter to send)"
              className="min-h-[100px] bg-input border border-border text-foreground placeholder:text-muted-foreground resize-none focus:border-primary"
            />
            <Button
              onClick={handleSubmit}
              disabled={!userInput.trim() || isGenerating}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
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

        <Card className="bg-card border border-border p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <Database className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Generated {selectedDatabase} Query</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 h-[50vh] max-h-[50vh]">
            {messages
              .filter((m) => m.role === "assistant")
              .map((message, idx) => {
                const actualIndex = messages.findIndex((m) => m === message)
                const isConfirmed = confirmedQueries.has(actualIndex)
                const hasResults = queryResults.has(actualIndex)
                const userMessageIndex = actualIndex - 1

                return (
                  <div key={idx} className="space-y-3">
                    <div className="bg-secondary/50 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm font-mono text-foreground leading-relaxed">
                        <code>{message.content}</code>
                      </pre>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={isConfirmed ? "default" : "outline"}
                        onClick={() => handleRunQuery(actualIndex)}
                        disabled={isConfirmed}
                        className={`text-xs font-medium ${
                          isConfirmed
                            ? "bg-[var(--success-green)] text-white hover:bg-[var(--success-green)]/90"
                            : "border-[var(--success-green)] text-[var(--success-green)] hover:bg-[var(--success-green)] hover:text-white"
                        }`}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {isConfirmed ? "Executed" : "Run Query"}
                      </Button>

                      {hasResults && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPopupQueryIndex(actualIndex)
                            setShowResultsPopup(true)
                          }}
                          className="text-xs font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Show Results
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRegenerate(userMessageIndex)}
                        disabled={isGenerating}
                        className="text-xs font-medium border-[var(--info-blue)] text-[var(--info-blue)] hover:bg-[var(--info-blue)] hover:text-white"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReportError(actualIndex)}
                        className="text-xs font-medium border-[var(--error-red)] text-[var(--error-red)] hover:bg-[var(--error-red)] hover:text-white"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Report Error
                      </Button>

                      <Button
                        size="sm"
                        variant={selectedExplanationIndex === actualIndex ? "default" : "outline"}
                        onClick={() => handleShowExplanation(actualIndex)}
                        className={`text-xs font-medium ${
                          selectedExplanationIndex === actualIndex
                            ? "bg-[var(--neutral-cyan)] text-white hover:bg-[var(--neutral-cyan)]/90"
                            : "border-[var(--neutral-cyan)] text-[var(--neutral-cyan)] hover:bg-[var(--neutral-cyan)] hover:text-white"
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
                <p className="text-center">
                  Database queries will appear here...
                  <br />
                  <span className="text-xs mt-2 block">Ready to be copied and executed</span>
                </p>
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                disabled={messages.length === 0}
                className="w-full text-xs font-medium border-[var(--warning-amber)] text-[var(--warning-amber)] hover:bg-[var(--warning-amber)] hover:text-white bg-transparent"
              >
                <Undo className="w-3 h-3 mr-1" />
                Undo Last Query
              </Button>
            </div>
          )}
        </Card>
      </div>

      {selectedExplanationIndex !== null && messages[selectedExplanationIndex]?.role === "assistant" && (
        <Card className="bg-card border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Query Explanation</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {messages[selectedExplanationIndex].explanation || "This query was generated based on your prompt."}
            </p>

            {queryResults.has(selectedExplanationIndex) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Query Results ({queryResults.get(selectedExplanationIndex)!.rowCount} rows)
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Executed at: {queryResults.get(selectedExplanationIndex)!.executedAt}
                  </span>
                </div>
                <TableVisualization
                  data={{
                    headers: queryResults.get(selectedExplanationIndex)!.headers,
                    rows: queryResults.get(selectedExplanationIndex)!.rows,
                  }}
                />
              </div>
            )}

            {!queryResults.has(selectedExplanationIndex) && (
              <div className="p-6 border border-border rounded-lg bg-secondary/20">
                <div className="text-center space-y-2">
                  <Database className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">No results yet</p>
                  <p className="text-xs text-muted-foreground">
                    Click "Run Query" to execute this query and see the results
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
