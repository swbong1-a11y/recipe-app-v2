import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAiClient } from '../gemini.js';

// Curated high quality food photography fallback mapping for Korean and home dishes
function getFallbackFoodImage(dishName: string, ingredientsStr: string): string {
  const query = `${dishName} ${ingredientsStr}`.toLowerCase();

  if (query.includes('김치볶음') || (query.includes('김치') && query.includes('밥'))) {
    return 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80'; // Kimchi bokkeumbap with fried egg
  }
  if (query.includes('찌개') || query.includes('탕') || query.includes('국') || query.includes('전골')) {
    return 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=800&q=80'; // Korean stew in hot stone pot
  }
  if (query.includes('전') || query.includes('부침') || query.includes('튀김') || query.includes('팬케이크')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'; // Savory pancake
  }
  if (query.includes('계란말이') || query.includes('오믈렛') || query.includes('계란찜')) {
    return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80'; // Rolled omelette / eggs
  }
  if (query.includes('파스타') || query.includes('스파게티') || query.includes('면') || query.includes('국수') || query.includes('라면')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=800&q=80'; // Savory pasta / noodles
  }
  if (query.includes('덮밥') || query.includes('비빔밥') || query.includes('볶음밥')) {
    return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80'; // Rice bowl dish
  }
  if (query.includes('볶음') || query.includes('두루치기') || query.includes('조림') || query.includes('스팸')) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'; // Stir fry meat / dish
  }
  // General appetizing home-cooked meal
  return 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80';
}

const IMAGE_MODELS = [
  'gemini-3.1-flash-lite-image',
  'gemini-3.1-flash-image',
  'gemini-2.5-flash-image',
];

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

  const { dishName, ingredients, styleTag } = body || {};

  if (!dishName || typeof dishName !== 'string') {
    res.status(400).json({ error: '요리명(dishName)을 입력해주세요.' });
    return;
  }

  const ingredientsList = Array.isArray(ingredients)
    ? ingredients
    : typeof ingredients === 'string'
    ? [ingredients]
    : [];
  const ingredientsStr = ingredientsList.join(', ');

  const imagePrompt = `A mouth-watering, realistic gourmet food photograph of freshly cooked Korean dish "${dishName}"${
    styleTag ? ` (${styleTag})` : ''
  }. Prepared using ingredients: ${ingredientsStr || 'seasonal home ingredients'}. Served steaming hot on an elegant ceramic plate with natural garnish, warm kitchen table background, soft appetizing studio lighting, centered composition, appetizing food photography, 4:3 aspect ratio.`;

  let generatedImageUrl: string | null = null;
  let usedModelName: string | null = null;
  let lastErrorMessage = '';

  try {
    const ai = getAiClient();

    for (const modelName of IMAGE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [{ text: imagePrompt }],
            },
          ],
          config: {
            imageConfig: {
              aspectRatio: '4:3',
            },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
            usedModelName = modelName;
            break;
          }
        }

        if (generatedImageUrl) {
          break;
        }
      } catch (err: unknown) {
        lastErrorMessage = (err as Error)?.message || '';
        console.warn(`[ImageGen] ${modelName} failed or quota exceeded:`, lastErrorMessage);
      }
    }
  } catch (clientErr: unknown) {
    lastErrorMessage = (clientErr as Error)?.message || '';
  }

  if (generatedImageUrl) {
    res.status(200).json({
      imageUrl: generatedImageUrl,
      source: 'ai_generated',
      dishName,
      model: usedModelName,
    });
    return;
  }

  // Graceful fallback to verified curated food photo
  const fallbackUrl = getFallbackFoodImage(dishName, ingredientsStr);
  res.status(200).json({
    imageUrl: fallbackUrl,
    source: 'fallback_preset',
    dishName,
    note: 'AI 이미지 생성 모델 쿼터 제한 시 미식 요리 사진 프리셋이 적용되었습니다.',
  });
}
