import { PresetCombination, CheatSeasoning } from '../types';

export interface IngredientCategory {
  category: string;
  items: string[];
}

export const CHEAT_SEASONINGS: CheatSeasoning[] = [
  {
    name: '참치액',
    category: '국물·감칠맛',
    emoji: '🐟',
    effect: '단 1스푼으로 2시간 푹 고아낸 깊은 훈연 육수의 맛과 감칠맛을 완성합니다.',
    recommendedWith: '김치찌개, 계란국, 볶음밥, 나물무침',
  },
  {
    name: '굴소스',
    category: '중식·불맛',
    emoji: '🦪',
    effect: '식당 볶음밥 특유의 진한 단짠 풍미와 윤기 나는 불맛을 입혀줍니다.',
    recommendedWith: '야채볶음, 볶음밥, 볶음면, 두부조림',
  },
  {
    name: '치킨스톡',
    category: '만능 육수',
    emoji: '🍗',
    effect: '맹물도 깊고 진한 감칠맛의 고급 육수로 둔갑시키는 일상 요리의 비밀 병기입니다.',
    recommendedWith: '파스타, 리소토, 짬뽕라면, 만두국',
  },
  {
    name: '불닭소스',
    category: '화끈한 매운맛',
    emoji: '🔥',
    effect: '자칫 밍밍하거나 느끼할 수 있는 요리에 화끈하고 중독적인 불맛을 더합니다.',
    recommendedWith: '치즈라면, 비빔면, 김치전, 볶음밥',
  },
  {
    name: '연두 (순식물성)',
    category: '깔끔한 감칠맛',
    emoji: '🌱',
    effect: '콩 발효 에센스로 인위적인 향 없이 채소와 계란 본연의 맛을 극대화합니다.',
    recommendedWith: '맑은 콩나물국, 계란찜, 버섯볶음',
  },
  {
    name: '버터',
    category: '고소한 풍미',
    emoji: '🧈',
    effect: '일반 식용유 대신 넣으면 평범한 김치볶음밥도 경양식 레스토랑 맛으로 변신합니다.',
    recommendedWith: '스팸김치볶음, 오므라이스, 토스트',
  },
  {
    name: '마요네즈',
    category: '크리미한 부드러움',
    emoji: '🥚',
    effect: '스크램블을 호텔 브런치처럼 부드럽게 만들고, 매운맛을 고소하게 중화합니다.',
    recommendedWith: '계란 스크램블, 참치마요덮밥, 비빔면',
  },
  {
    name: '쌈장',
    category: '구수한 만능양념',
    emoji: '🥣',
    effect: '된장·고추장·마늘·참기름이 황금비율로 섞여 있어 1스푼으로 양념 끝입니다.',
    recommendedWith: '쌈장라면, 돼지고기/스팸 볶음, 찌개',
  },
  {
    name: '트러플 오일',
    category: '고급스러운 향기',
    emoji: '✨',
    effect: '짜파게티나 반숙 계란후라이 위에 단 한 방울로 5성급 호텔 요리의 향을 냅니다.',
    recommendedWith: '짜장라면, 파스타, 감자볶음, 계란후라이',
  },
  {
    name: '돈까스/스테이크소스',
    category: '일식·단짠풍미',
    emoji: '🍖',
    effect: '새콤달콤한 우스타소스 기반으로 일본식 야키소바와 경양식 덮밥 맛을 냅니다.',
    recommendedWith: '볶음우동, 오므라이스, 계란말이',
  },
  {
    name: '미원/다시다',
    category: '원조 감칠맛',
    emoji: '🧂',
    effect: '한 꼬집으로 식당 찌개와 국물의 2% 부족한 감칠맛을 단번에 200% 채워줍니다.',
    recommendedWith: '모든 국물 요리, 찌개, 볶음밥',
  },
];

export const COMMON_INGREDIENTS: IngredientCategory[] = [
  {
    category: '🥩 단백질 & 햄/캔',
    items: ['계란', '스팸/런천미트', '참치캔', '비엔나소시지', '닭가슴살', '냉동만두', '베이컨', '두부'],
  },
  {
    category: '🥬 채소 & 김치',
    items: ['신김치', '대파', '양파', '다진마늘', '청양고추', '새송이버섯', '감자', '콩나물'],
  },
  {
    category: '🍚 밥 & 면/떡',
    items: ['찬밥/즉석밥', '라면사리', '떡국떡', '파스타면', '소면', '식빵', '우동사리'],
  },
  {
    category: '🧀 유제품 & 어묵',
    items: ['슬라이스치즈', '모짜렐라치즈', '사각어묵', '우유', '버터'],
  },
];

export const PRESET_COMBOS: PresetCombination[] = [
  {
    title: '냉파 만능 골든세트',
    tagline: '실패 없는 불멸의 든든한 소울푸드',
    ingredients: ['신김치', '스팸/런천미트', '찬밥/즉석밥', '계란'],
    emoji: '🍳',
    preference: '고소하고 매콤하게',
    tool: '후라이팬',
  },
  {
    title: '심야 야식 치즈면',
    tagline: '늦은 밤 10분 만에 끝내는 극강의 감칠맛',
    ingredients: ['라면사리', '슬라이스치즈', '계란', '대파'],
    emoji: '🍜',
    preference: '얼큰하고 꾸덕하게',
    tool: '냄비',
  },
  {
    title: '냉동만두 구출작전',
    tagline: '냉동실 한구석 만두로 만드는 초간단 전골/국',
    ingredients: ['냉동만두', '대파', '계란', '다진마늘'],
    emoji: '🥟',
    preference: '따끈하고 깊은 국물',
    tool: '냄비',
  },
  {
    title: '고단백 다이어트 볶음',
    tagline: '물리지 않게 뚝딱 볶아먹는 헬스 한끼',
    ingredients: ['닭가슴살', '양파', '계란', '새송이버섯'],
    emoji: '💪',
    preference: '담백하고 깔끔하게',
    tool: '후라이팬',
  },
];
