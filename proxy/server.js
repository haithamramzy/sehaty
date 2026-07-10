/**
 * صحّتي — MiniMax proxy (runs on the VPS; the app never sees the real key).
 *
 * Endpoints (all POST, all require `Authorization: Bearer <APP_TOKEN>`):
 *   /api/ai/chat            message + history + context_card → {actions[], chat_reply}
 *   /api/ai/vision/meal     meal photo → items/calories/macros
 *   /api/ai/vision/gym      gym machine photo → identification + exercise
 *   /api/ai/vision/medical  prescription/lab photo → extracted data
 *   /api/ai/report          context_card → weekly report + weekly_memory
 *   GET /health             unauthenticated liveness check
 *
 * Stateless by design: nothing is written to disk, request bodies (which may
 * contain medical photos) are never logged — only method/path/status/latency.
 */
'use strict';

require('dotenv').config();

const express = require('express');

const { complete, imageMessage, UpstreamError, CONFIG } = require('./lib/minimax');
const P = require('./lib/prompts');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20mb' }));

// ── Access log (no bodies) ───────────────────────────────────────────────────
app.use((req, res, next) => {
  const t0 = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log(`${req.method} ${req.path} → ${res.statusCode} (${ms.toFixed(0)}ms)`);
  });
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true, mock: CONFIG.mock }));

// ── Auth ─────────────────────────────────────────────────────────────────────
app.use('/api', (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!process.env.APP_TOKEN) return res.status(500).json({ error: 'proxy misconfigured: APP_TOKEN not set' });
  if (token !== process.env.APP_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  next();
});

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

/** context_card arrives from the app already trimmed (memory + last 7 days). */
function contextBlock(card) {
  return card ? `\n\n[context_card]\n${JSON.stringify(card)}` : '';
}

app.post('/api/ai/chat', wrap(async (req, res) => {
  const { message, image_base64, mime_type, history = [], context_card } = req.body || {};
  if (!message && !image_base64) return res.status(400).json({ error: 'message or image_base64 required' });

  const messages = history
    .slice(-12)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .map((m) => ({ role: m.role, content: String(m.content) }));

  const userText = `${message || 'المستخدم بعت صورة بس من غير نص.'}${contextBlock(context_card)}`;
  messages.push(image_base64 ? imageMessage(image_base64, mime_type, userText) : { role: 'user', content: userText });

  const out = await complete({
    system: P.CHAT_SYSTEM,
    messages,
    vision: Boolean(image_base64),
    mockReply: P.MOCKS.chat,
  });
  res.json({ actions: Array.isArray(out.actions) ? out.actions : [], chat_reply: String(out.chat_reply ?? '') });
}));

app.post('/api/ai/vision/meal', wrap(async (req, res) => {
  const { image_base64, mime_type, note, context_card } = req.body || {};
  if (!image_base64) return res.status(400).json({ error: 'image_base64 required' });
  const out = await complete({
    system: P.VISION_MEAL_SYSTEM,
    messages: [imageMessage(image_base64, mime_type, `حلّل الوجبة دي.${note ? ` ملاحظة المستخدم: ${note}` : ''}${contextBlock(context_card)}`)],
    vision: true,
    mockReply: P.MOCKS.visionMeal,
  });
  res.json(out);
}));

app.post('/api/ai/vision/gym', wrap(async (req, res) => {
  const { image_base64, mime_type, context_card } = req.body || {};
  if (!image_base64) return res.status(400).json({ error: 'image_base64 required' });
  const out = await complete({
    system: P.VISION_GYM_SYSTEM,
    messages: [imageMessage(image_base64, mime_type, `إيه الجهاز ده وبيتستخدم إزاي؟${contextBlock(context_card)}`)],
    vision: true,
    mockReply: P.MOCKS.visionGym,
  });
  res.json(out);
}));

app.post('/api/ai/vision/medical', wrap(async (req, res) => {
  const { image_base64, mime_type, kind, context_card } = req.body || {};
  if (!image_base64) return res.status(400).json({ error: 'image_base64 required' });
  const out = await complete({
    system: P.VISION_MEDICAL_SYSTEM,
    messages: [imageMessage(image_base64, mime_type, `استخرج بيانات المستند الطبي ده.${kind ? ` النوع المتوقع: ${kind}.` : ''}${contextBlock(context_card)}`)],
    vision: true,
    mockReply: P.MOCKS.visionMedical,
  });
  res.json(out);
}));

app.post('/api/ai/report', wrap(async (req, res) => {
  const { context_card } = req.body || {};
  if (!context_card) return res.status(400).json({ error: 'context_card required' });
  const out = await complete({
    system: P.REPORT_SYSTEM,
    messages: [{ role: 'user', content: `اكتب تقرير الأسبوع.${contextBlock(context_card)}` }],
    mockReply: P.MOCKS.report,
  });
  res.json(out);
}));

// ── Errors ───────────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err instanceof UpstreamError) {
    console.error(`upstream ${err.status}: ${err.body}`);
    return res.status(502).json({ error: 'ai_upstream_failed' });
  }
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'image too large (max 20mb)' });
  console.error(err);
  res.status(500).json({ error: 'internal' });
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`sehaty-proxy listening on :${port} (mock=${CONFIG.mock ? 'ON' : 'off'})`);
  if (!process.env.APP_TOKEN) console.warn('⚠ APP_TOKEN not set — all /api requests will fail');
  if (!CONFIG.mock && !CONFIG.apiKey) console.warn('⚠ MINIMAX_API_KEY not set and MOCK_AI!=1');
});
