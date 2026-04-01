import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ExtractedItem = {
  title: string
  description: string
  type: "TASK" | "BUG" | "FEATURE" | "ENQUIRY" | "NOTE" | "FOLLOW_UP" | "DECISION"
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  assigneeName?: string
  dueDate?: string       // ISO date string
  tags: string[]
  internalNotes?: string
  clientSafeSummary?: string
  metadata?: Record<string, string>
}

export type ExtractionResult = {
  items: ExtractedItem[]
  summary: string
  keyDecisions: string[]
  openQuestions: string[]
}

const SYSTEM_PROMPT = `You are an expert project manager AI assistant embedded in a team operations tool called PATT (Project & Task Tracker).

Your job is to analyse raw meeting notes and extract structured work items that should be tracked. You are precise, thorough, and conservative — only extract items that are clearly actionable or worth tracking.

Rules:
- Extract TASKS: concrete to-dos with a clear owner or next step
- Extract BUGS: reported issues, errors, or things "not working"
- Extract FEATURES: new functionality requests or improvements
- Extract ENQUIRIES: open questions requiring follow-up answers
- Extract NOTES: important context, reference info, or observations
- Extract FOLLOW_UPs: items that need to be checked on later
- Extract DECISIONS: decisions made during the meeting that should be recorded
- Set priority based on urgency language: "urgent/critical/blocker" → CRITICAL/HIGH, "when possible/low priority" → LOW, default → MEDIUM
- If a name is mentioned as owner/responsible, populate assigneeName
- If a date is mentioned (e.g. "by Friday", "next sprint", "end of month"), populate dueDate as ISO date (today is ${new Date().toISOString().split("T")[0]})
- For BUGs add metadata: stepsToReproduce, expectedBehavior, actualBehavior where available
- For FEATUREs add metadata: businessGoal, userValue where available
- For ENQUIRIEs add metadata: askedBy, responseNeededFrom where available
- Add relevant tags (e.g. "frontend", "api", "urgent", "client", "infra")
- clientSafeSummary: a clean, jargon-free one-liner suitable to share with a client (omit if purely internal)
- Deduplicate: if the same issue is mentioned twice, extract it once`

const extractionTool: Anthropic.Tool = {
  name: "extract_work_items",
  description:
    "Extract structured work items from meeting notes and return them along with a meeting summary.",
  input_schema: {
    type: "object" as const,
    properties: {
      items: {
        type: "array",
        description: "List of extracted work items",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short, action-oriented title (max 100 chars)" },
            description: { type: "string", description: "More detail about the item" },
            type: {
              type: "string",
              enum: ["TASK", "BUG", "FEATURE", "ENQUIRY", "NOTE", "FOLLOW_UP", "DECISION"],
            },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
            assigneeName: { type: "string", description: "Name of person responsible, if mentioned" },
            dueDate: { type: "string", description: "ISO date string (YYYY-MM-DD) if a deadline was mentioned" },
            tags: { type: "array", items: { type: "string" }, description: "Relevant tags" },
            internalNotes: { type: "string", description: "Internal context not suitable for clients" },
            clientSafeSummary: { type: "string", description: "Clean one-liner for client visibility" },
            metadata: {
              type: "object",
              description:
                "Type-specific fields: Bug→{stepsToReproduce,expectedBehavior,actualBehavior}, Feature→{businessGoal,userValue}, Enquiry→{askedBy,responseNeededFrom}",
              additionalProperties: { type: "string" },
            },
          },
          required: ["title", "type", "priority", "tags"],
          additionalProperties: false,
        },
      },
      summary: {
        type: "string",
        description: "A 2-4 sentence summary of the meeting",
      },
      keyDecisions: {
        type: "array",
        items: { type: "string" },
        description: "Key decisions made in this meeting",
      },
      openQuestions: {
        type: "array",
        items: { type: "string" },
        description: "Unanswered questions or things that need to be resolved",
      },
    },
    required: ["items", "summary", "keyDecisions", "openQuestions"],
    additionalProperties: false,
  },
}

export async function extractWorkItemsFromNotes(
  rawNotes: string,
  projectContext?: string
): Promise<ExtractionResult> {
  const userMessage = projectContext
    ? `Project context:\n${projectContext}\n\n---\n\nMeeting notes:\n${rawNotes}`
    : `Meeting notes:\n${rawNotes}`

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    tools: [extractionTool],
    tool_choice: { type: "tool", name: "extract_work_items" },
    messages: [{ role: "user", content: userMessage }],
  })

  // Find the tool_use block
  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  )
  if (!toolUse) {
    throw new Error("AI did not return structured extraction results")
  }

  return toolUse.input as ExtractionResult
}
