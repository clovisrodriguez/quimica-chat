# Quimica Chat ⚗️

Tutor interactivo de Quimica Organica con IA y constructor visual de moleculas.

## Que es?

Una aplicacion web educativa que combina:

- **Chat con IA** — Un tutor que explica quimica organica en espanol, con analogias simples y ejemplos.
- **Constructor de Moleculas** — Editor visual para armar moleculas atomo por atomo, con validacion de valencias.
- **Modelo de Bohr** — Visualizacion interactiva de la estructura atomica de cada elemento.
- **Modo Clase** — Curriculum estructurado de 10 lecciones que guia al estudiante desde el modelo atomico hasta reacciones organicas.

La IA puede dibujar moleculas y mostrar modelos de Bohr directamente en el constructor, haciendo las lecciones interactivas.

## Lecciones del Modo Clase

| # | Tema | Ejercicio |
|---|------|-----------|
| 1 | Modelo atomico de Bohr | Observar modelos de Bohr de H, C, O |
| 2 | Tabla periodica y electronegatividad | Comparar capas electronicas de C, N, O |
| 3 | Enlaces quimicos | Construir H₂O |
| 4 | Hidrocarburos | Construir etano y etileno |
| 5 | Grupos funcionales | Construir etanol |
| 6 | Isomeria | Comparar etanol vs dimetil eter |
| 7 | Acidos y bases | Construir acido acetico |
| 8 | Concentraciones y soluciones | Conceptual |
| 9 | Reacciones organicas | Esterificacion |
| 10 | Repaso y evaluacion | Desafio libre |

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- Una API key de [OpenAI](https://platform.openai.com/api-keys)

## Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/clovisrodriguez/quimica-chat.git
cd quimica-chat

# Instalar dependencias
npm run install:all

# Configurar la API key
cp server/.env.example server/.env
# Editar server/.env y agregar tu OPENAI_API_KEY
```

## Uso

```bash
# Terminal 1: iniciar el servidor
npm run dev:server

# Terminal 2: iniciar el cliente
npm run dev:client
```

Abrir http://localhost:5173 en el navegador.

## Estructura del proyecto

```
quimica-chat/
├── server/          # API Express + OpenAI
│   └── index.js     # Endpoint /api/chat con streaming SSE
├── client/          # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       │   ├── Chat.jsx           # Chat libre con IA
│       │   ├── ChatMessage.jsx    # Burbuja de mensaje
│       │   ├── MoleculeBuilder.jsx# Constructor visual
│       │   ├── BohrModel.jsx      # Modelo atomico de Bohr
│       │   ├── ClassMode.jsx      # Orquestador del modo clase
│       │   ├── LessonList.jsx     # Lista de lecciones
│       │   └── LessonChat.jsx     # Chat de leccion individual
│       └── data/
│           ├── chemistry.js       # Elementos, valencias, deteccion de moleculas
│           ├── curriculum.js      # 10 lecciones con prompts
│           └── progress.js        # Progreso en localStorage
└── package.json
```

## Tests

```bash
cd client
npx vitest run
```

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Express, OpenAI API (GPT)
- **Comunicacion:** Server-Sent Events (SSE) para streaming

## Licencia

MIT
