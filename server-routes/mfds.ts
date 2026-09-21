import type { ParsedRecipe, CookingDifficulty, ServingsBreakdown, ServingInfo } from '../src/types.js';

const MFDS_API_KEY = process.env.FOOD_SAFETY_API_KEY || '6852cf1471d44168b284';

// Common synonyms mapping for Korean culinary ingredients
const SYNONYM_MAP: Record<string, string[]> = {
  '계란': ['달걀'],
  '달걀': ['계란'],
  '소고기': ['쇠고기', '한우', '소'],
  '쇠고기': ['소고기', '한우', '소'],
  '돼지고기': ['삼겹살', '목살', '돼지', '제육', '앞다리살', '뒷다리살'],
  '스팸': ['햄', '통조림햄', '리챔'],
  '햄': ['스팸', '통조림햄', '비엔나'],
  '참치': ['참치캔', '다랑어', '통조림참치'],
  '대파': ['쪽파', '실파', '파'],
  '파': ['대파', '쪽파', '실파'],
  '두부': ['연두부', '순두부', '모두부'],
  '김치': ['배추김치', '신김치', '묵은지'],
  '닭가슴살': ['닭고기', '닭'],
  '닭고기': ['닭가슴살', '닭'],
  '버섯': ['느타리버섯', '새송이버섯', '팽이버섯', '표고버섯'],
  '감자': ['햇감자'],
  '양파': ['자색양파'],
  '치즈': ['모짜렐라', '체다치즈', '피자치즈'],
  '만두': ['교자', '물만두', '군만두'],
  '오징어': ['물오징어', '갑오징어'],
  '어묵': ['오뎅'],
  '소시지': ['소세지', '비엔나', '프랑크'],
  '베이컨': ['삼겹'],
  '애호박': ['호박'],
  '고추': ['청양고추', '홍고추', '풋고추'],
  '새우': ['칵테일새우', '대하'],
  '밥': ['찬밥', '햇반', '쌀'],
  '라면': ['라면사리', '면'],
};

export interface MfdsRawRow {
  RCP_SEQ: string;
  RCP_NM: string;
  RCP_WAY2: string; // 끓이기, 볶기, 찌기 등
  RCP_PAT2: string; // 국&찌개, 반찬, 밥, 후식 등
  INFO_WGT?: string;
  INFO_ENG?: string; // 열량 kcal
  INFO_CAR?: string; // 탄수화물
  INFO_PRO?: string; // 단백질
  INFO_FAT?: string; // 지방
  INFO_NA?: string; // 나트륨 mg
  HASH_TAG?: string;
  ATT_FILE_NO_MAIN?: string; // 소형 이미지
  ATT_FILE_NO_MK?: string; // 대형 이미지
  RCP_PARTS_DTLS?: string; // 재료정보
  RCP_NA_TIP?: string; // 저염 조리팁
  [key: string]: string | undefined;
}

export interface MfdsApiResponse {
  COOKRCP01?: {
    total_count: string;
    row?: MfdsRawRow[];
    RESULT?: {
      CODE: string;
      MSG: string;
    };
  };
}

/**
 * Parses raw ingredient string from MFDS DB into structured ServingsBreakdown
 */
function parseMfdsServings(partsText: string, dishName: string, matchedIngs: string[]): ServingsBreakdown {
  // Clean parts text into array of items
  const rawItems = (partsText || '')
    .split(/[\n,●]/)
    .map((s) => s.replace(/^[주부재료소스양념:\s]+/, '').trim())
    .filter((s) => s.length > 1 && !s.includes('재료') && !s.includes('소스'));

  const baseIngredients = rawItems.length > 0 ? rawItems.slice(0, 8) : matchedIngs;

  const isSoup = ['국', '찌개', '탕', '라면', '수제비', '우동', '전골'].some((k) => dishName.includes(k));

  const getWater = (serv: number) => {
    if (isSoup) {
      if (serv === 1) return '물 350ml (종이컵 약 2컵)';
      if (serv === 2) return '물 600ml (종이컵 약 3.3컵)';
      return '물 1,100ml (종이컵 약 6컵)';
    }
    if (dishName.includes('조림') || dishName.includes('찜')) {
      if (serv === 1) return '물 100ml (종이컵 반 컵)';
      if (serv === 2) return '물 180ml (종이컵 1컵)';
      return '물 320ml (종이컵 약 1.8컵)';
    }
    if (serv === 1) return '물 2스푼 (볶음 수분용) 또는 식용유 1스푼';
    if (serv === 2) return '물 3~4스푼 또는 식용유 2스푼';
    return '물 6~8스푼 또는 식용유 4스푼';
  };

  const getIngredients = (multiplier: number): string[] => {
    return baseIngredients.map((item) => {
      if (multiplier === 1) return item;
      if (multiplier === 2) return `${item} (약 1.5~2배 분량)`;
      return `${item} (약 3~4배 푸짐한 분량)`;
    });
  };

  const createServing = (serving: '1인분' | '2인분' | '4인분', label: string, mult: number): ServingInfo => ({
    serving,
    label,
    water: getWater(mult),
    ingredients: getIngredients(mult),
    seasonings: mult === 1 ? '식약처 공식 저염 레시피 기준' : mult === 2 ? '기본 양념 약 1.8배' : '기본 양념 약 3.5배',
  });

  return {
    one: createServing('1인분', '1인분 (기본 혼밥)', 1),
    two: createServing('2인분', '2인분 (2인 / 넉넉한 양)', 2),
    four: createServing('4인분', '4인분 (가족·친구 / 푸짐한 양)', 4),
  };
}

/**
 * Converts a raw MFDS row into ParsedRecipe format
 */
export function convertMfdsRowToRecipe(
  row: MfdsRawRow,
  userIngredients: string[],
  matchedIngs: string[],
  matchRate: number = 100,
  index: number = 1
): ParsedRecipe {
  // Extract steps from MANUAL01 ~ MANUAL20
  const steps: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const key = `MANUAL${i < 10 ? '0' + i : i}`;
    const rawStep = row[key];
    if (rawStep && rawStep.trim()) {
      // Remove step number prefix like "1. " or "1) " and trailing letters like "a\n"
      const cleaned = rawStep
        .replace(/^[0-9]+[.)\s]*/, '')
        .replace(/[a-zA-Z\n\r]+$/, '')
        .trim();
      if (cleaned) {
        steps.push(cleaned);
      }
    }
  }

  // Fallback step if none extracted
  if (steps.length === 0) {
    steps.push('재료를 먹기 좋은 크기로 손질합니다.');
    steps.push('팬이나 냄비에 재료를 넣고 알맞게 조리합니다.');
    steps.push('식약처 저염 조리법에 따라 간을 맞추고 완성합니다.');
  }

  // Difficulty
  let difficulty: CookingDifficulty = {
    level: '쉬움',
    stars: 2,
    description: '식약처 표준 공정에 따른 따라하기 쉬운 조리법',
  };
  if (steps.length <= 3) {
    difficulty = {
      level: '초간단',
      stars: 1,
      description: '간단한 조리 과정으로 빠르게 완성되는 공공 레시피',
    };
  } else if (steps.length >= 6) {
    difficulty = {
      level: '보통',
      stars: 3,
      description: '순서대로 조리하면 실패 없는 정석 조리법',
    };
  }

  const rawImage = row.ATT_FILE_NO_MK || row.ATT_FILE_NO_MAIN || '';
  const secureImage = rawImage ? rawImage.replace(/^http:\/\//, 'https://') : undefined;

  const servings = parseMfdsServings(row.RCP_PARTS_DTLS || '', row.RCP_NM, matchedIngs);
  const missing = userIngredients.filter((ing) => !matchedIngs.includes(ing));

  return {
    id: `mfds_${row.RCP_SEQ}_${Date.now()}_${index}`,
    dishName: row.RCP_NM.trim(),
    cookingTime: steps.length <= 3 ? '10분~15분' : '15분~20분',
    difficulty,
    likesCount: 38 + (parseInt(row.RCP_SEQ, 10) % 35),
    isLiked: false,
    styleTag: `🏛️ 식약처 공공 레시피 (1순위)`,
    sourceType: 'mfds_public',
    matchRate,
    publicMeta: {
      rcpSeq: row.RCP_SEQ,
      cookingMethod: row.RCP_WAY2,
      dishCategory: row.RCP_PAT2,
      lowSodiumTip: row.RCP_NA_TIP,
      mainImage: secureImage,
      matchRate,
      matchedIngredients: matchedIngs,
      missingIngredients: missing,
      totalSelectedCount: userIngredients.length,
      nutrition: {
        calorie: row.INFO_ENG ? `${row.INFO_ENG} kcal` : undefined,
        carbohydrate: row.INFO_CAR ? `${row.INFO_CAR} g` : undefined,
        protein: row.INFO_PRO ? `${row.INFO_PRO} g` : undefined,
        fat: row.INFO_FAT ? `${row.INFO_FAT} g` : undefined,
        sodium: row.INFO_NA ? `${row.INFO_NA} mg` : undefined,
      },
    },
    usedIngredients: matchedIngs.length > 0 ? matchedIngs : userIngredients,
    servings,
    steps,
    cheatKey: {
      name: '식약처 저염·감칠맛 비법',
      reason: row.RCP_NA_TIP || '식품의약품안전처 조리식품 DB에서 검증된 균형 잡힌 저염 조리법입니다.',
    },
    rawText: `[식약처 공공 레시피: ${row.RCP_NM}]\n재료: ${row.RCP_PARTS_DTLS}\n조리법:\n${steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`,
    ingredients: userIngredients,
    createdAt: Date.now(),
  };
}

/**
 * Searches the MFDS recipe OpenAPI with user ingredients.
 * Recommends recipes where user-selected ingredients have at least 70% match (minMatchRate).
 * Returns sorted list of matching ParsedRecipes, with the best matching at index 0 (1순위).
 */
export async function searchMfdsRecipes(params: {
  ingredients: string[];
  preference?: string;
  cookingTool?: string;
  excludeDishes?: string[];
  minMatchRate?: number;
  limit?: number;
}): Promise<ParsedRecipe[]> {
  const {
    ingredients = [],
    preference = '',
    cookingTool = '',
    excludeDishes = [],
    minMatchRate = 70,
    limit = 2,
  } = params;

  if (!ingredients || ingredients.length === 0) {
    return [];
  }

  const rowsMap = new Map<string, MfdsRawRow>();

  // Fetch candidate recipes for each user ingredient in parallel
  await Promise.all(
    ingredients.slice(0, 5).map(async (ing) => {
      try {
        const trimmed = ing.trim();
        if (!trimmed) return;
        const url = `http://openapi.foodsafetykorea.go.kr/api/${MFDS_API_KEY}/COOKRCP01/json/1/40/RCP_PARTS_DTLS=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (!res.ok) return;

        const data: MfdsApiResponse = await res.json();
        if (data.COOKRCP01?.row && Array.isArray(data.COOKRCP01.row)) {
          for (const row of data.COOKRCP01.row) {
            if (row.RCP_SEQ && !rowsMap.has(row.RCP_SEQ)) {
              rowsMap.set(row.RCP_SEQ, row);
            }
          }
        }
      } catch {
        // Silently skip failed sub-request
      }
    })
  );

  // If two or more ingredients, also search with combined query (e.g. 김치,두부)
  if (ingredients.length >= 2) {
    try {
      const combined = `${ingredients[0].trim()},${ingredients[1].trim()}`;
      const url = `http://openapi.foodsafetykorea.go.kr/api/${MFDS_API_KEY}/COOKRCP01/json/1/30/RCP_PARTS_DTLS=${encodeURIComponent(combined)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data: MfdsApiResponse = await res.json();
        if (data.COOKRCP01?.row && Array.isArray(data.COOKRCP01.row)) {
          for (const row of data.COOKRCP01.row) {
            if (row.RCP_SEQ && !rowsMap.has(row.RCP_SEQ)) {
              rowsMap.set(row.RCP_SEQ, row);
            }
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  const candidates = Array.from(rowsMap.values());
  if (candidates.length === 0) {
    return [];
  }

  const totalCount = ingredients.length;
  // Minimum number of matched ingredients required to achieve minMatchRate% (e.g. 70%)
  const minRequiredCount = Math.ceil(totalCount * (minMatchRate / 100));

  // Score each candidate against user ingredients and preferences
  interface ScoredCandidate {
    row: MfdsRawRow;
    score: number;
    matchRate: number;
    matchedIngredients: string[];
  }

  const scored: ScoredCandidate[] = [];

  for (const row of candidates) {
    const partsText = (row.RCP_PARTS_DTLS || '').toLowerCase();
    const dishName = (row.RCP_NM || '').toLowerCase();
    const matched: string[] = [];

    for (const ing of ingredients) {
      const lower = ing.trim().toLowerCase();
      if (!lower) continue;
      const syns = SYNONYM_MAP[lower] || SYNONYM_MAP[ing.trim()] || [];
      const isMatched =
        partsText.includes(lower) ||
        dishName.includes(lower) ||
        syns.some((s) => partsText.includes(s.toLowerCase()) || dishName.includes(s.toLowerCase()));

      if (isMatched) {
        matched.push(ing.trim());
      }
    }

    // ⭐️ 최소 70% 유사도 필터링 (사용자 선택 재료 기준) ⭐️
    const matchRate = totalCount > 0 ? Math.round((matched.length / totalCount) * 100) : 0;
    if (matched.length < minRequiredCount || matchRate < minMatchRate) {
      continue;
    }

    // 일치율이 높을수록 기본 점수 대폭 가산 (100% 일치 최우선)
    let score = matchRate * 10 + matched.length * 20;

    // 요리명에 주요 재료가 포함된 경우 추가 가산점
    for (const ing of matched) {
      if (dishName.includes(ing.toLowerCase())) {
        score += 15;
      }
    }

    // 선호 스타일 가산점
    if (preference) {
      if (preference.includes('국물') && (row.RCP_PAT2?.includes('국') || row.RCP_WAY2?.includes('끓이기'))) {
        score += 10;
      }
      if (preference.includes('고단백') && (parseFloat(row.INFO_PRO || '0') >= 12 || partsText.includes('닭') || partsText.includes('고기') || partsText.includes('두부'))) {
        score += 10;
      }
      if (preference.includes('저염') && (row.RCP_NA_TIP || parseFloat(row.INFO_NA || '999') <= 450)) {
        score += 10;
      }
      if (preference.includes('매콤') && (partsText.includes('고추') || partsText.includes('고춧가루'))) {
        score += 10;
      }
    }

    // 조리 도구 가산점
    if (cookingTool) {
      if (cookingTool.includes('후라이팬') && (row.RCP_WAY2?.includes('볶기') || row.RCP_WAY2?.includes('부치기'))) {
        score += 6;
      }
      if (cookingTool.includes('냄비') && (row.RCP_WAY2?.includes('끓이기') || row.RCP_WAY2?.includes('찌기'))) {
        score += 6;
      }
    }

    // 재추천 시 이전 추천 메뉴 감점
    if (excludeDishes.some((d) => d && row.RCP_NM.includes(d))) {
      score -= 200;
    }

    if (score > 0) {
      scored.push({
        row,
        score,
        matchRate,
        matchedIngredients: matched,
      });
    }
  }

  // 1차 기준: 재료 일치율(matchRate) 내림차순 (100% > 80% > 75%)
  // 2차 기준: 종합 점수(score) 내림차순
  scored.sort((a, b) => {
    if (b.matchRate !== a.matchRate) {
      return b.matchRate - a.matchRate;
    }
    return b.score - a.score;
  });

  return scored.slice(0, limit).map((s, idx) =>
    convertMfdsRowToRecipe(s.row, ingredients, s.matchedIngredients, s.matchRate, idx + 1)
  );
}
