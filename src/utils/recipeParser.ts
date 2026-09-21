import { ParsedRecipe, ServingsBreakdown, ServingInfo, CookingDifficulty } from '../types';

function isSoupOrStew(dishName: string): boolean {
  const soupKeywords = ['국', '찌개', '탕', '라면', '수제비', '우동', '스프', '전골', '짬뽕', '국수', '뚝배기', '나베'];
  return soupKeywords.some((k) => dishName.includes(k));
}

function generateFallbackWater(dishName: string, multiplier: number): string {
  if (isSoupOrStew(dishName)) {
    if (multiplier === 1) return '물 350ml (종이컵 약 2컵)';
    if (multiplier === 2) return '물 600ml (종이컵 약 3.3컵)';
    return '물 1,100ml (종이컵 약 6.1컵)';
  } else if (dishName.includes('조림') || dishName.includes('두루치기') || dishName.includes('찜')) {
    if (multiplier === 1) return '물 100ml (종이컵 반 컵)';
    if (multiplier === 2) return '물 180ml (종이컵 1컵)';
    return '물 320ml (종이컵 약 1.8컵)';
  } else {
    // 볶음밥, 덮밥, 파스타, 전 등
    if (multiplier === 1) return '물 2스푼 (볶음 수분용) 또는 식용유 1스푼';
    if (multiplier === 2) return '물 3~4스푼 또는 식용유 2스푼';
    return '물 6~8스푼 또는 식용유 4스푼';
  }
}

function generateFallbackIngredients(usedIngredients: string[], multiplier: number): string[] {
  const ings = usedIngredients.length > 0 ? usedIngredients : ['선택 재료'];
  return ings.map((ing) => {
    if (multiplier === 1) {
      if (ing.includes('스팸')) return '스팸 1/2캔 (약 100g)';
      if (ing.includes('김치')) return '신김치 1종이컵 (송송 썬 것)';
      if (ing.includes('계란')) return '계란 1~2개';
      if (ing.includes('밥')) return '밥 1공기 (약 200g)';
      if (ing.includes('참치')) return '참치캔 1캔 (작은캔 85~100g)';
      if (ing.includes('양파')) return '양파 1/2개';
      if (ing.includes('대파')) return '대파 1/2대';
      return `${ing} 1인분 분량`;
    } else if (multiplier === 2) {
      if (ing.includes('스팸')) return '스팸 1캔 (200g)';
      if (ing.includes('김치')) return '신김치 2종이컵';
      if (ing.includes('계란')) return '계란 2~3개';
      if (ing.includes('밥')) return '밥 2공기 (약 400g)';
      if (ing.includes('참치')) return '참치캔 1~2캔 (150g)';
      if (ing.includes('양파')) return '양파 1개';
      if (ing.includes('대파')) return '대파 1대';
      return `${ing} 2배 분량 (2인분)`;
    } else {
      if (ing.includes('스팸')) return '스팸 2캔 (400g)';
      if (ing.includes('김치')) return '신김치 4종이컵';
      if (ing.includes('계란')) return '계란 4~5개';
      if (ing.includes('밥')) return '밥 4공기';
      if (ing.includes('참치')) return '참치캔 3캔';
      if (ing.includes('양파')) return '양파 2개';
      if (ing.includes('대파')) return '대파 2~3대';
      return `${ing} 4배 분량 (4인분)`;
    }
  });
}

function generateFallbackSeasoning(multiplier: number): string {
  if (multiplier === 1) return '기본 양념 각 1스푼 내외';
  if (multiplier === 2) return '기본 양념 각 1.8~2스푼';
  return '기본 양념 각 3~4스푼';
}

export function parseDifficulty(cleanText: string, cookingTime: string, steps: string[] = []): CookingDifficulty {
  // Check if explicitly written in text, e.g. **조리 난이도:** 초간단 or 난이도: 쉬움 / 보통
  const diffMatch = cleanText.match(/\*{0,2}(?:조리\s*)?난이도\*{0,2}\s*:\s*([^\n\r]+)/i);
  if (diffMatch && diffMatch[1]) {
    const val = diffMatch[1].replace(/\[|\]|\*/g, '').trim();
    if (val.includes('초간단')) {
      return { level: '초간단', stars: 1, description: '재료만 썰면 완성되는 칼퇴급 난이도' };
    }
    if (val.includes('쉬움')) {
      return { level: '쉬움', stars: 2, description: '기본 불 조절만 하면 성공하는 쉬운 난이도' };
    }
    if (val.includes('보통')) {
      return { level: '보통', stars: 3, description: '타이밍 맞추면 맛이 배가되는 알찬 조리' };
    }
  }

  // Calculate based on cookingTime and steps
  const minutes = parseInt(cookingTime.replace(/[^0-9]/g, ''), 10) || 15;
  if (minutes <= 10 && steps.length <= 3) {
    return { level: '초간단', stars: 1, description: '재료만 썰면 끝나는 칼퇴급 난이도' };
  }
  if (minutes <= 15) {
    return { level: '쉬움', stars: 2, description: '기본 불 조절만 하면 성공하는 쉬운 난이도' };
  }
  return { level: '보통', stars: 3, description: '타이밍 맞추면 맛이 배가되는 알찬 조리' };
}

export function parseServingsFromBlock(
  cleanText: string,
  dishName: string,
  usedIngredients: string[]
): ServingsBreakdown {
  const extractServingLine = (servingNumber: '1' | '2' | '4' | '3'): string | null => {
    // 1. Single line format: e.g. - **1인분:** ... or **1인분**: ... or 1인분: ...
    const lineRegex = new RegExp(
      `(?:^|\\n)\\s*[-*•]?\\s*\\*{0,2}${servingNumber}인분[^:\\n\\r]*?\\*{0,2}\\s*[:：]?\\s*\\*{0,2}\\s*([^\\n\\r]+)`,
      'i'
    );
    const match = cleanText.match(lineRegex);
    if (match && match[1] && match[1].trim()) {
      const cleaned = match[1].replace(/^[\s*:-]+/, '').replace(/\s*\*{1,2}$/, '').trim();
      if (cleaned) return cleaned;
    }

    // 2. Multi-line indented sub-bullets under this serving header
    const blockRegex = new RegExp(
      `(?:^|\\n)\\s*[-*•]?\\s*\\*{0,2}${servingNumber}인분[^\\n\\r]*\\n((?:[ \\t]*[-*•].*\\n?)+)`,
      'i'
    );
    const blockMatch = cleanText.match(blockRegex);
    if (blockMatch && blockMatch[1]) {
      const joined = blockMatch[1]
        .split('\n')
        .map((l) => l.replace(/^\s*[-*•]\s*/, '').trim())
        .filter(Boolean)
        .join(' | ');
      if (joined) return joined;
    }

    return null;
  };

  const line1 = extractServingLine('1');
  const line2 = extractServingLine('2');
  // Support 4인분, or fallback to 3인분 if older recipe format
  const line4 = extractServingLine('4') || extractServingLine('3');

  const parseSingleLine = (
    rawLine: string | null,
    servingType: '1인분' | '2인분' | '4인분',
    defaultLabel: string,
    multiplier: number
  ): ServingInfo => {
    if (rawLine) {
      let line = rawLine.replace(/^[\s*:-]+/, '').replace(/\s*\*{1,2}$/, '').trim();
      let water = '';
      let ingsStr = '';
      let seasonings = '';

      if (line.includes('|') || line.includes('│')) {
        // Split STRICTLY by pipe symbols so fractions like 1/2 or 1/4 are NEVER broken
        const parts = line.split(/\s*[|│]\s*/);
        for (const part of parts) {
          const trimmed = part.replace(/^[\s*]+|[\s*]+$/g, '').trim();
          if (!trimmed) continue;

          if (
            /^(?:물|육수|식용유|기름|조리수|버터)\b|^물\s*[:\s]|^육수\s*[:\s]|^식용유\s*[:\s]/i.test(trimmed) ||
            (!water && (/ml|종이컵/i.test(trimmed) || /^(?:물|육수|식용유)/i.test(trimmed)))
          ) {
            water = trimmed.replace(/^(?:물|육수)\s*[:\s]?/i, '').replace(/\[|\]/g, '').trim();
            if (!/^(?:물|육수|식용유|기름|조리수|버터)/i.test(water)) {
              water = `물 ${water}`;
            }
          } else if (/^(?:재료|주재료)\s*[:\s]?/i.test(trimmed)) {
            ingsStr = trimmed.replace(/^(?:재료|주재료)\s*[:\s]?/i, '').replace(/\[|\]/g, '').trim();
          } else if (/^(?:양념|소스|간)\s*[:\s]?/i.test(trimmed)) {
            seasonings = trimmed.replace(/^(?:양념|소스|간)\s*[:\s]?/i, '').replace(/\[|\]/g, '').trim();
          } else {
            // Fallback categorization if AI omitted prefixes
            if (!water && (/ml|종이컵/i.test(trimmed) || /^(?:물|육수|식용유)/i.test(trimmed))) {
              water = trimmed;
            } else if (!ingsStr) {
              ingsStr = trimmed;
            } else if (!seasonings) {
              seasonings = trimmed;
            }
          }
        }
      } else {
        // Line without pipes - extract by section keywords
        const waterMatch = line.match(/(?:^|[,;\s])(?:물|육수|식용유|기름|조리수)\s*[:\s]?\s*([^,;|\n]+(?:\([^)]*\))?[^,;|\n]*)/i);
        const ingsMatch = line.match(/(?:^|[,;|\s])(?:재료|주재료)\s*[:\s]?\s*([^|\n]+?)(?=(?:양념|소스|간\s*:)|$)/i);
        const sMatch = line.match(/(?:^|[,;|\s])(?:양념|소스|간)\s*[:\s]?\s*([^|\n]+)/i);

        if (waterMatch) water = waterMatch[1].replace(/\[|\]/g, '').trim();
        if (ingsMatch) ingsStr = ingsMatch[1].replace(/\[|\]/g, '').trim();
        if (sMatch) seasonings = sMatch[1].replace(/\[|\]/g, '').trim();

        if (!water && !ingsStr && !seasonings) {
          ingsStr = line;
        }
      }

      // Split ingredients by comma/plus outside parentheses without cutting fractions
      const parsedIngredients: string[] = [];
      if (ingsStr) {
        let current = '';
        let parenDepth = 0;
        for (let i = 0; i < ingsStr.length; i++) {
          const char = ingsStr[i];
          if (char === '(' || char === '[' || char === '{') parenDepth++;
          else if (char === ')' || char === ']' || char === '}') parenDepth = Math.max(0, parenDepth - 1);

          if ((char === ',' || char === '+' || char === '·') && parenDepth === 0) {
            const item = current.replace(/^[*•\s]+|[*•\s]+$/g, '').trim();
            if (item) parsedIngredients.push(item);
            current = '';
          } else {
            current += char;
          }
        }
        const lastItem = current.replace(/^[*•\s]+|[*•\s]+$/g, '').trim();
        if (lastItem) parsedIngredients.push(lastItem);
      }

      if (water || parsedIngredients.length > 0) {
        return {
          serving: servingType,
          label: defaultLabel,
          water: water || generateFallbackWater(dishName, multiplier),
          ingredients: parsedIngredients.length > 0 ? parsedIngredients : generateFallbackIngredients(usedIngredients, multiplier),
          seasonings: seasonings || generateFallbackSeasoning(multiplier),
        };
      }
    }

    return {
      serving: servingType,
      label: defaultLabel,
      water: generateFallbackWater(dishName, multiplier),
      ingredients: generateFallbackIngredients(usedIngredients, multiplier),
      seasonings: generateFallbackSeasoning(multiplier),
    };
  };

  return {
    one: parseSingleLine(line1, '1인분', '1인분 (기본 혼밥)', 1),
    two: parseSingleLine(line2, '2인분', '2인분 (2인 / 넉넉한 양)', 2),
    four: parseSingleLine(line4, '4인분', '4인분 (가족·친구 / 푸짐한 양)', 4),
  };
}

export function parseSingleRecipeBlock(
  block: string,
  ingredients: string[] = [],
  index: number = 1
): ParsedRecipe {
  let dishName = '';
  let cookingTime = '15분 이내';
  let styleTag = '';
  let usedIngredients: string[] = [];
  const steps: string[] = [];
  let cheatKeyName = '';
  let cheatKeyReason = '';

  const cleanText = block.replace(/\r\n/g, '\n');

  // Match style tag like [레시피 1: 볶음/덮밥] or [레시피 1]
  const styleMatch = cleanText.match(/(?:\[|\#\#\#\s*\[?)\s*레시피\s*\d+\s*(?::\s*([^\]\n]+))?\]?/i);
  if (styleMatch && styleMatch[1]) {
    styleTag = styleMatch[1].trim();
  }

  // Match 요리명
  const dishMatch = cleanText.match(/\*{0,2}요리명\*{0,2}\s*:\s*([^\n\r]+)/i);
  if (dishMatch && dishMatch[1]) {
    dishName = dishMatch[1].replace(/\[|\]|\*/g, '').trim();
  }

  // Match 소요 시간
  const timeMatch = cleanText.match(/\*{0,2}소요\s*시간\*{0,2}\s*:\s*([^\n\r]+)/i);
  if (timeMatch && timeMatch[1]) {
    cookingTime = timeMatch[1].replace(/\[|\]|\*/g, '').trim();
  }

  // Match 활용 재료 / 사용 재료
  const ingMatch = cleanText.match(/\*{0,2}(?:활용\s*재료|사용한?\s*재료)\*{0,2}\s*:\s*([^\n\r]+)/i);
  if (ingMatch && ingMatch[1]) {
    usedIngredients = ingMatch[1]
      .replace(/\[|\]|\*/g, '')
      .split(/[,+·]|(?<=[가-힣a-zA-Z])\/(?=[가-힣a-zA-Z])/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Match steps 1, 2, 3
  const step1Match = cleanText.match(/(?:^|\n)\s*1[.)]\s*([^\n\r]+(?:\n(?!\s*[2-9][.)]|\*{0,2}[💡🍳]).+)*)/i);
  const step2Match = cleanText.match(/(?:^|\n)\s*2[.)]\s*([^\n\r]+(?:\n(?!\s*[3-9][.)]|\*{0,2}[💡🍳]).+)*)/i);
  const step3Match = cleanText.match(/(?:^|\n)\s*3[.)]\s*([^\n\r]+(?:\n(?!\s*\*{0,2}[💡🍳]).+)*)/i);

  if (step1Match && step1Match[1]) steps.push(step1Match[1].replace(/\[|\]/g, '').trim());
  if (step2Match && step2Match[1]) steps.push(step2Match[1].replace(/\[|\]/g, '').trim());
  if (step3Match && step3Match[1]) steps.push(step3Match[1].replace(/\[|\]/g, '').trim());

  // Match Cheat key: e.g. **💡 맛 상승 치트키:** 참치액 - 깊은 훈연향과 감칠맛을 더해줍니다.
  const cheatMatch = cleanText.match(
    /(?:치트키|맛\s*상승\s*치트키)\*{0,2}\s*:\s*([^\n\r]+)/i
  );
  if (cheatMatch && cheatMatch[1]) {
    const rawCheat = cheatMatch[1].replace(/\[|\]|\*/g, '').trim();
    if (rawCheat.includes(' - ')) {
      const parts = rawCheat.split(' - ');
      cheatKeyName = parts[0]?.trim() || '';
      cheatKeyReason = parts.slice(1).join(' - ').trim();
    } else if (rawCheat.includes(':')) {
      const parts = rawCheat.split(':');
      cheatKeyName = parts[0]?.trim() || '';
      cheatKeyReason = parts.slice(1).join(':').trim();
    } else {
      cheatKeyName = rawCheat;
      cheatKeyReason = '요리의 감칠맛과 완성도를 폭발적으로 끌어올려 줍니다!';
    }
  }

  if (!dishName) {
    dishName = index === 1 ? '15분 자투리 미식 (추천 A)' : `15분 자투리 미식 (추천 ${index === 2 ? 'B' : String(index)})`;
  }

  const servings = parseServingsFromBlock(cleanText, dishName, usedIngredients.length > 0 ? usedIngredients : ingredients);
  const difficulty = parseDifficulty(cleanText, cookingTime, steps);
  const initialLikes = Math.floor(Math.random() * 12) + 5; // realistic initial community interest

  return {
    id: `recipe_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
    dishName,
    cookingTime,
    difficulty,
    likesCount: initialLikes,
    isLiked: false,
    styleTag: styleTag || (index === 1 ? '옵션 A: 든든한 한끼' : '옵션 B: 색다른 별미'),
    usedIngredients: usedIngredients.length > 0 ? usedIngredients : ingredients,
    servings,
    steps,
    cheatKey: {
      name: cheatKeyName || '참치액 or 굴소스',
      reason: cheatKeyReason || '부족한 육수 맛을 단번에 채워주는 필수 시판 조미료입니다.',
    },
    rawText: block,
    ingredients,
    createdAt: Date.now(),
  };
}

export function parseMultipleRecipesMarkdown(
  text: string,
  ingredients: string[] = []
): ParsedRecipe[] {
  if (!text || !text.trim()) return [];

  // Split by divider or recipe header
  const parts = text
    .split(/(?:^|\n)(?:---|\*{3,})\s*(?:\n|$)|(?=(?:^|\n)\s*(?:###\s*)?\[레시피\s*\d+)/i)
    .map((p) => p.trim())
    .filter((p) => p.includes('요리명') || p.includes('레시피') || p.includes('3단계'));

  if (parts.length === 0) {
    // If no distinct split found, try checking if multiple **요리명:** exist
    const dishSplit = text.split(/(?=\*{0,2}요리명\*{0,2}\s*:)/i).filter((p) => p.trim());
    if (dishSplit.length > 1) {
      return dishSplit.map((block, i) => parseSingleRecipeBlock(block, ingredients, i + 1));
    }
    return [parseSingleRecipeBlock(text, ingredients, 1)];
  }

  return parts.map((part, index) => parseSingleRecipeBlock(part, ingredients, index + 1));
}

export function parseRecipeMarkdown(
  text: string,
  ingredients: string[] = []
): ParsedRecipe {
  const recipes = parseMultipleRecipesMarkdown(text, ingredients);
  return recipes[0] || parseSingleRecipeBlock(text, ingredients, 1);
}

