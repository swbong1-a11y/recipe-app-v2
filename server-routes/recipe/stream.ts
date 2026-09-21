import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ThinkingLevel } from '@google/genai';
import {
  getAiClient,
  buildRecipePrompt,
  SYSTEM_INSTRUCTION,
  CANDIDATE_MODELS,
} from '../gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { ingredients } = body || {};

  if (!ingredients || (typeof ingredients === 'string' && !ingredients.trim()) || (Array.isArray(ingredients) && ingredients.length === 0)) {
    res.status(400).json({ error: '식재료를 1개 이상 입력해주세요.' });
    return;
  }

  const promptText = buildRecipePrompt(body);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof (res as unknown as { flush?: () => void }).flush === 'function') {
      (res as unknown as { flush: () => void }).flush();
    }
  };

  try {
    const ai = getAiClient();
    let streamSuccess = false;
    let lastError: Error | null = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const config: Record<string, unknown> = {
          systemInstruction: [
            {
              text: SYSTEM_INSTRUCTION,
            },
          ],
        };

        try {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.MINIMAL,
          };
        } catch {
          // ignore if not supported
        }

        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          config,
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }],
            },
          ],
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            sendEvent({ text: chunk.text, type: 'chunk' });
          }
        }

        sendEvent({ done: true });
        streamSuccess = true;
        break;
      } catch (err: unknown) {
        lastError = err as Error;
        const msg = (err as Error)?.message || '';
        const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
        console.log(`[Recipe Stream] ${modelName} ${isQuota ? 'quota limit reached' : 'call failed'}, trying next model...`);
      }
    }

    if (!streamSuccess) {
      const errText = lastError?.message || '';
      let friendlyMsg = '레시피 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      if (errText.includes('429') || errText.includes('RESOURCE_EXHAUSTED')) {
        friendlyMsg = 'API 요청 한도(Quota)가 일시적으로 초과되었습니다. 10~20초 뒤 다시 시도해주세요.';
      }
      sendEvent({
        error: friendlyMsg,
      });
    }
  } catch (outerErr: unknown) {
    sendEvent({
      error: (outerErr as Error)?.message || '서버 오류가 발생했습니다.',
    });
  } finally {
    res.end();
  }
}
