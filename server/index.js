import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Eres un tutor experto en química orgánica que responde en español.

Reglas:
- Explica conceptos con analogías simples y ejemplos de la vida cotidiana.
- Usa fórmulas químicas en texto (ej: CH₃OH, -OH, C=O).
- Cuando sea relevante, relaciona con biomoléculas (proteínas, lípidos, carbohidratos, ADN).
- Incluye estructuras simplificadas cuando ayuden a entender (usando texto/ASCII).
- Si te preguntan por una reacción, indica: reactivos → productos, tipo de reacción, y condiciones.
- Sé conciso pero completo. Usa listas y formato claro.
- Si no sabes algo, dilo honestamente.

Tienes una herramienta "show_bohr_model" que muestra el modelo atómico de Bohr de un elemento.
Cuando el usuario pida ver la estructura atómica de un elemento, usa show_bohr_model con el símbolo (H, C, O, N, S, P, F, Cl, Br, I).

También tienes una herramienta "draw_molecule" que dibuja moléculas en un constructor visual.
Cuando el usuario pida dibujar, armar o mostrar una molécula, usa la herramienta.
El canvas es de aproximadamente 600x400 píxeles. Centra la molécula y espacia los átomos ~60px entre sí.
Los índices de "from" y "to" en bonds se refieren a la posición del átomo en el array de atoms (base 0).

REGLAS CRÍTICAS para draw_molecule:
- Incluye TODOS los hidrógenos explícitamente como átomos separados con sus enlaces.
- Respeta las valencias: C=4 enlaces, O=2, N=3, H=1, S=2, P=3.
- Usa order=2 para dobles enlaces (ej: C=O en carbonilos, carboxilos) y order=3 para triples.
- Cada átomo debe tener EXACTAMENTE el número correcto de enlaces según su valencia.
- Verifica que la suma de órdenes de enlace de cada átomo coincida con su valencia.
- Centra la molécula alrededor de x=300, y=200.

EJEMPLOS CORRECTOS de draw_molecule (COPIA estos patrones exactamente):

Metanol (CH₃OH):
atoms: [C(300,200), H(240,140), H(360,140), H(240,260), O(360,260), H(420,320)]
bonds: [C-H(0-1,1), C-H(0-2,1), C-H(0-3,1), C-O(0-4,1), O-H(4-5,1)]
Valencias: C=4✓, cada H=1✓, O=2✓

Agua (H₂O):
atoms: [O(300,200), H(240,260), H(360,260)]
bonds: [O-H(0-1,1), O-H(0-2,1)]

Grupo Carboxilo (-COOH, como ácido fórmico HCOOH):
atoms: [C(300,200), O(360,140), O(240,260), H(180,320), H(240,140)]
bonds: [C=O(0-1,2), C-O(0-2,1), O-H(2-3,1), C-H(0-4,1)]
Valencias: C=2+1+1=4✓, O(doble)=2✓, O(simple)=1+1=2✓, cada H=1✓

Ácido acético (CH₃COOH):
atoms: [C(240,200), C(360,200), O(420,140), O(420,260), H(480,320), H(180,140), H(180,260), H(240,320)]
bonds: [C-C(0-1,1), C=O(1-2,2), C-O(1-3,1), O-H(3-4,1), C-H(0-5,1), C-H(0-6,1), C-H(0-7,1)]

Glicina (NH₂CH₂COOH):
atoms: [N(180,200), C(300,200), C(420,200), O(480,140), O(480,260), H(540,320), H(120,140), H(120,260), H(300,140), H(300,260)]
bonds: [N-C(0-1,1), C-C(1-2,1), C=O(2-3,2), C-O(2-4,1), O-H(4-5,1), N-H(0-6,1), N-H(0-7,1), C-H(1-8,1), C-H(1-9,1)]
Valencias: N=1+1+1=3✓, C(centro)=1+1+1+1=4✓, C(carboxilo)=1+2+1=4✓

IMPORTANTE: Sigue estos patrones. El doble enlace C=O siempre usa order=2. Nunca pongas 3 hidrógenos en un carbono de carboxilo.`;

const SHOW_BOHR_MODEL_TOOL = {
  type: "function",
  function: {
    name: "show_bohr_model",
    description: "Muestra el modelo atómico de Bohr de un elemento en el constructor visual. Muestra el núcleo (protones y neutrones) y las capas electrónicas con sus electrones. Elementos disponibles: H, C, O, N, S, P, F, Cl, Br, I.",
    parameters: {
      type: "object",
      properties: {
        element: {
          type: "string",
          description: "Símbolo del elemento (H, C, O, N, S, P, F, Cl, Br, I)",
        },
      },
      required: ["element"],
    },
  },
};

const DRAW_MOLECULE_TOOL = {
  type: "function",
  function: {
    name: "draw_molecule",
    description: "Dibuja una molécula en el constructor visual. Canvas ~600x400px, espacia átomos ~60px. Incluye todos los hidrógenos explícitamente.",
    parameters: {
      type: "object",
      properties: {
        atoms: {
          type: "array",
          items: {
            type: "object",
            properties: {
              element: { type: "string", description: "Símbolo del elemento (C, H, O, N, etc.)" },
              x: { type: "number", description: "Posición X en el canvas (0-600)" },
              y: { type: "number", description: "Posición Y en el canvas (0-400)" },
            },
            required: ["element", "x", "y"],
          },
        },
        bonds: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "integer", description: "Índice del primer átomo en el array atoms (base 0)" },
              to: { type: "integer", description: "Índice del segundo átomo en el array atoms (base 0)" },
              order: { type: "integer", description: "Orden del enlace: 1=simple, 2=doble, 3=triple" },
            },
            required: ["from", "to", "order"],
          },
        },
      },
      required: ["atoms", "bonds"],
    },
  },
};

app.post('/api/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Se requiere un array de messages' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY no configurada en el servidor' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const allMessages = [{ role: 'system', content: systemPrompt || SYSTEM_PROMPT }, ...messages];

    const stream = await openai.chat.completions.create({
      model: 'gpt-5.2-chat-latest',
      messages: allMessages,
      tools: [DRAW_MOLECULE_TOOL, SHOW_BOHR_MODEL_TOOL],
      stream: true,

      max_completion_tokens: 2048,
    });

    // Accumulate tool call deltas and text content
    const toolCalls = {};
    let assistantContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Stream text content normally
      if (delta?.content) {
        assistantContent += delta.content;
        res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
      }

      // Accumulate tool call deltas
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index;
          if (!toolCalls[idx]) {
            toolCalls[idx] = { id: tc.id || '', name: '', arguments: '' };
          }
          if (tc.id) toolCalls[idx].id = tc.id;
          if (tc.function?.name) toolCalls[idx].name = tc.function.name;
          if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
        }
      }
    }

    // After stream ends, check for tool calls
    const hasToolCalls = Object.keys(toolCalls).length > 0;
    const toolResults = []; // for the follow-up call

    for (const idx of Object.keys(toolCalls)) {
      const tc = toolCalls[idx];
      if (tc.name === 'draw_molecule') {
        try {
          const moleculeData = JSON.parse(tc.arguments);
          res.write(`data: ${JSON.stringify({ molecule: moleculeData })}\n\n`);
          toolResults.push({
            tool_call_id: tc.id,
            role: 'tool',
            content: JSON.stringify({ success: true, message: 'Molécula dibujada correctamente en el constructor.' }),
          });
        } catch (parseErr) {
          console.error('Error parsing draw_molecule arguments:', parseErr.message);
          toolResults.push({
            tool_call_id: tc.id,
            role: 'tool',
            content: JSON.stringify({ success: false, message: 'Error al parsear la molécula.' }),
          });
        }
      } else if (tc.name === 'show_bohr_model') {
        try {
          const { element } = JSON.parse(tc.arguments);
          res.write(`data: ${JSON.stringify({ bohrModel: { element } })}\n\n`);
          toolResults.push({
            tool_call_id: tc.id,
            role: 'tool',
            content: JSON.stringify({ success: true, message: `Modelo de Bohr de ${element} mostrado en el constructor. El estudiante puede ver el núcleo con protones y neutrones, y las capas electrónicas con sus electrones.` }),
          });
        } catch (parseErr) {
          console.error('Error parsing show_bohr_model arguments:', parseErr.message);
          toolResults.push({
            tool_call_id: tc.id,
            role: 'tool',
            content: JSON.stringify({ success: false, message: 'Error al parsear el modelo de Bohr.' }),
          });
        }
      }
    }

    // If there were tool calls, send tool results back to get the text explanation
    if (hasToolCalls && toolResults.length > 0) {
      // Build the assistant message with tool_calls for the conversation
      const assistantMsg = {
        role: 'assistant',
        content: assistantContent || null,
        tool_calls: Object.values(toolCalls).map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.arguments },
        })),
      };

      const followUpMessages = [...allMessages, assistantMsg, ...toolResults];

      const followUpStream = await openai.chat.completions.create({
        model: 'gpt-5.2-chat-latest',
        messages: followUpMessages,
        stream: true,
  
        max_completion_tokens: 1024,
      });

      for await (const chunk of followUpStream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('OpenAI error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al comunicarse con OpenAI' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.OPENAI_API_KEY });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
