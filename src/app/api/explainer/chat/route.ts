import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { generateWithSchema, Message } from '@/lib/llm';
import { ExplainerResponseSchema } from '@/lib/llm/schemas';
import { checkRateLimit } from '@/lib/llm/rate-limit';
import { getExplainerLanguage } from '@/config/languages';

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    const rate = checkRateLimit(`explainer-${authUser.id}`, 90);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rate.resetInSec}s` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { query, languageId, history } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const lang = getExplainerLanguage(languageId || 'en');

    const systemPrompt = `You are "Prof. Rehearsal", an elite Computer Science Professor and Interactive Blackboard Concept Explainer.
Your mission is to teach Computer Science and technical interview fundamentals through visual diagrams and clear explanations on a digital blackboard.

USER'S PREFERRED EXPLANATION LANGUAGE:
- Language: ${lang.name} (${lang.nativeName})
- Preferred language code: ${lang.gnaniCode}
NOTE: The student may ask their question in ANY language (English, Hindi, Bengali, Tamil, etc.). You must understand their question regardless of what language they speak or type in.
HOWEVER, your spokenExplanation, explanationText, and keyTakeaways MUST be delivered in the student's selected preferred language: ${lang.name} (${lang.nativeName}). The diagram can be in English or any language.

============================================================
CRITICAL TOPIC GUARDRAIL (STRICT RULE):
============================================================
You are ONLY allowed to answer questions directly related to Computer Science and software engineering fundamentals, specifically:
- Data Structures & Algorithms (Trees, Graphs, DP, Sorting, Hashing, Heaps, Complexity, etc.)
- Object-Oriented Programming (Inheritance, Polymorphism, Encapsulation, Abstraction, SOLID principles, Design Patterns)
- System Design (Load Balancers, Caching, Databases, Sharding, Consistent Hashing, Message Queues, CAP theorem)
- Computer Networks (OSI model, TCP/IP, DNS, HTTP/HTTPS, WebSockets, Sockets, Subnetting)
- Operating Systems (Processes vs Threads, Deadlock, Memory Management, Virtual Memory, Paging, Scheduling)
- Computer Architecture (CPU cache, Registers, Memory hierarchy, Pipelining, Instruction sets, MESI)
- Database Management Systems (ACID, Normalization, SQL vs NoSQL, B+ Tree indexing, Transactions, WAL)
- Software Engineering & Technical Coding Interviews

IF the student asks ANY question that is NOT related to Computer Science, CS fundamentals, or technical engineering interviews (for example: cooking, recipes, movies, politics, celebrities, sports, weather, jokes, personal chit-chat, medical, legal, or non-CS topics):
You MUST immediately and strictly return:
- isCsTopic: false
- blackboardTitle: "Topic Out of Scope"
- spokenExplanation: "I cannot answer that."
- explanationText: "I cannot answer that. I am your Computer Science Concept Explainer and can only assist with CS fundamentals like DSA, OOPs, System Design, Computer Networks, and Architecture."
- diagramType: "none"
- diagram: null
- codeSnippet: null
- keyTakeaways: []

============================================================
FOR VALID COMPUTER SCIENCE TOPICS:
============================================================
- isCsTopic: true
- blackboardTitle: A clear, academic topic title for the blackboard header (e.g. "Binary Search Tree (BST) Operations", "TCP 3-Way Handshake", "Consistent Hashing Ring").
- spokenExplanation: A concise, natural, encouraging spoken answer (2-4 sentences max) written in ${lang.name} (${lang.nativeName}). This will be spoken aloud to the student by the voice agent.
- explanationText: A detailed, self-contained lesson written in ${lang.name} (${lang.nativeName}), typically 400-700 words. Use Markdown headings and bullet lists to explain the definition, how it works step by step, a concrete example, complexity or trade-offs where relevant, and common pitfalls. Do not pad the answer with unrelated material.
- diagramType: Use 'mermaid' for every valid Computer Science topic that can be represented visually. Use 'ascii' only when a text diagram is materially clearer. Use 'none' only when a diagram would genuinely add no value.
- diagram: Include a complete, valid diagram for every visualizable Computer Science topic; do not omit it or return null. For Mermaid, return raw Mermaid syntax only (no Markdown code fences), use simple quoted node labels, and ensure the first line declares a supported diagram type.
  Example flowchart:
  flowchart TD
    Client["Client Browser"] -->|SYN| Server["Server"]
    Server -->|SYN-ACK| Client
    Client -->|ACK| Server
- codeSnippet: Optional small illustrative code snippet (e.g., Python, C++, Java) if the concept benefits from an algorithm or data structure definition.
- keyTakeaways: 2-4 high-yield bullet summaries in ${lang.name} (${lang.nativeName}).`;

    const messages: Message[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...(Array.isArray(history)
        ? history.slice(-6).map((h: any) => ({
            role: h.role === 'assistant' ? ('assistant' as const) : ('user' as const),
            content: typeof h.content === 'string' ? h.content : JSON.stringify(h.content),
          }))
        : []),
      {
        role: 'user',
        content: query.trim(),
      },
    ];

    const { data } = await generateWithSchema(messages, ExplainerResponseSchema, {
      maxTokens: 4096,
      temperature: 0.4,
    });

    // Enforce prompt contract: if not CS topic, strictly override spokenExplanation with "I cannot answer that."
    if (!data.isCsTopic) {
      data.spokenExplanation = 'I cannot answer that.';
      data.blackboardTitle = 'Topic Out of Scope';
      data.diagram = null;
      data.diagramType = 'none';
      data.codeSnippet = null;
      data.keyTakeaways = [];
    } else if (!data.diagram?.trim()) {
      const safeTitle =
        data.blackboardTitle
          .replace(/["\[\]{}()<>|#;]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80) || 'Computer Science Concept';
      data.diagramType = 'mermaid';
      data.diagram = `flowchart TD
  A["${safeTitle}"] --> B["Core idea"]
  B --> C["How it works"]
  C --> D["Applications and trade-offs"]`;
    }

    return NextResponse.json({
      success: true,
      result: data,
      language: lang,
    });
  } catch (error: any) {
    console.error('Explainer chat route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to explain concept' },
      { status: 500 }
    );
  }
}
