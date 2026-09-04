/**
 * Thin wrapper around the Groq API.
 * Used for:
 *   1. AI quiz generation (lightweight RAG over uploaded source material)
 *   2. AI grading of subjective answers
 *
 * Requires GROQ_API_KEY in the environment.
 */

const MODEL = 'llama-3.1-8b-instant'; // Free tier model - fast and capable
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq({ system, prompt, maxTokens = 2000 }) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured on the server');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/** Strip markdown code fences and parse JSON safely. */
function parseJsonResponse(raw) {
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Naive "retrieval" step for the lightweight RAG pipeline: scores each
 * chunk by keyword overlap with the quiz topic/title and returns the
 * top N chunks. Swap this for pgvector cosine-similarity search in
 * production (see database/schema.sql for the embedding column note).
 */
function retrieveRelevantChunks(chunks, topic, topN = 6) {
  const topicWords = new Set(
    topic.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );
  const scored = chunks.map((c) => {
    const words = c.content.toLowerCase().split(/\W+/);
    const overlap = words.filter((w) => topicWords.has(w)).length;
    return { ...c, score: overlap };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

/**
 * Generate quiz questions from source material using a RAG-style prompt.
 */
async function generateQuiz({
  topic,
  contextChunks,
  totalQuestions,
  difficulty,
  questionTypes, // { objective: bool, subjective: bool }
}) {
  const context = contextChunks.map((c, i) => `[Excerpt ${i + 1}]\n${c.content}`).join('\n\n');

  const typeInstruction = questionTypes.objective && questionTypes.subjective
    ? 'a mix of objective (multiple choice) and subjective (short/long answer) questions'
    : questionTypes.subjective
      ? 'only subjective (short/long answer) questions'
      : 'only objective (multiple choice) questions';

  const system = `You are an expert exam writer creating high quality quiz questions strictly grounded in the supplied source material. Always respond with ONLY valid JSON, no markdown fences, no preamble.`;

  const prompt = `Topic: ${topic}
Difficulty (1-10): ${difficulty}
Generate ${totalQuestions} questions, ${typeInstruction}.

Use ONLY the following source excerpts as the factual basis for the questions:
${context}

Return JSON in exactly this shape:
{
  "questions": [
    {
      "question_text": "string",
      "question_type": "objective" | "subjective",
      "options": ["A", "B", "C", "D"] | null,
      "correct_answer": "string (correct option text for objective, or a model answer for subjective)",
      "points": 1
    }
  ]
}`;

  const raw = await callGroq({ system, prompt, maxTokens: 4000 });
  const parsed = parseJsonResponse(raw);
  return parsed.questions;
}

/**
 * Grade a single subjective answer against the model answer.
 */
async function gradeSubjectiveAnswer({ questionText, modelAnswer, studentAnswer, maxPoints = 10 }) {
  const system = `You are a fair, consistent teaching assistant grading student answers. Always respond with ONLY valid JSON, no markdown fences, no preamble.`;

  const prompt = `Question: ${questionText}
Model / reference answer: ${modelAnswer || 'N/A - use your subject-matter expertise'}
Maximum points: ${maxPoints}

Student answer:
"""
${studentAnswer}
"""

Grade the student's answer for conceptual correctness, completeness, and clarity (not just keyword matching). Return JSON:
{
  "grade": number (0 to ${maxPoints}),
  "feedback": "string, 1-3 sentences, specific and constructive"
}`;

  const raw = await callGroq({ system, prompt, maxTokens: 500 });
  return parseJsonResponse(raw);
}

module.exports = {
  callGroq,
  parseJsonResponse,
  retrieveRelevantChunks,
  generateQuiz,
  gradeSubjectiveAnswer,
};