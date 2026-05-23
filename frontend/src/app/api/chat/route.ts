import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const responseText = `Wave interference happens when two or more waves meet and combine together.

There are two main types:

* **Constructive interference** \\u2192 waves combine to create a larger wave
* **Destructive interference** \\u2192 waves cancel each other out

A common real-world example is noise-cancelling headphones. They generate opposite sound waves to cancel unwanted noise.

Key formula:

$$Resultant\\ displacement = y_1 + y_2$$

Let me know if you would like me to generate flashcards or MCQs for wave interference!`;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Stream text in words/characters for a realistic effect
        const chunks = responseText.match(/[^ ]+ |[^ ]+/g) || [responseText];
        
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk + ' '));
          // Delay to simulate human-like reading/streaming flow
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
