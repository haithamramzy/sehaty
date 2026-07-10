/**
 * Thin MiniMax client. One function — `complete()` — used by every route.
 *
 * Uses MiniMax's OpenAI-compatible chat completions shape:
 *   { model, messages: [{ role, content }] }
 * where vision content is an array of {type:'text'} / {type:'image_url'} parts.
 *
 * MOCK_AI=1 short-circuits with canned JSON so the whole app ↔ proxy pipe can
 * be tested before the real key exists.
 */
'use strict';

const CONFIG = {
  apiKey: process.env.MINIMAX_API_KEY || '',
  baseUrl: process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1/text/chatcompletion_v2',
  chatModel: process.env.MINIMAX_CHAT_MODEL || 'MiniMax-Text-01',
  visionModel: process.env.MINIMAX_VISION_MODEL || 'MiniMax-VL-01',
  mock: process.env.MOCK_AI === '1',
};

class UpstreamError extends Error {
  constructor(status, body) {
    super(`MiniMax upstream error ${status}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * @param {object} opts
 * @param {string} opts.system      System prompt (JSON contract lives here).
 * @param {Array}  opts.messages    [{role:'user'|'assistant', content: string|parts[]}]
 * @param {boolean} [opts.vision]   Use the vision model.
 * @param {object} [opts.mockReply] Returned as-is when MOCK_AI=1.
 * @returns {Promise<object>} Parsed JSON object from the model's reply.
 */
async function complete({ system, messages, vision = false, mockReply }) {
  if (CONFIG.mock) return mockReply;

  const res = await fetch(CONFIG.baseUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: vision ? CONFIG.visionModel : CONFIG.chatModel,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new UpstreamError(res.status, body.slice(0, 500));
  }

  const data = await res.json();
  // MiniMax also signals some errors inside a 200 via base_resp.
  if (data.base_resp && data.base_resp.status_code && data.base_resp.status_code !== 0) {
    throw new UpstreamError(502, JSON.stringify(data.base_resp));
  }
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new UpstreamError(502, 'empty completion');
  return extractJson(text);
}

/** Models wrap JSON in prose/fences sometimes — pull out the outermost object. */
function extractJson(text) {
  const cleaned = text.replace(/```(?:json)?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new UpstreamError(502, `model did not return JSON: ${cleaned.slice(0, 200)}`);
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Build a vision user-message: image (data URI) + optional text. */
function imageMessage(imageBase64, mimeType, text) {
  const parts = [
    { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` } },
  ];
  if (text) parts.push({ type: 'text', text });
  return { role: 'user', content: parts };
}

module.exports = { complete, imageMessage, UpstreamError, CONFIG };
