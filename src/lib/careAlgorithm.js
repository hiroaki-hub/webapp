// 季節を判定する関数
function getSeason(date) {
  const month = date.getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring_fall';
  if (month >= 10 && month <= 11) return 'spring_fall';
  if (month >= 6 && month <= 9) return 'summer';
  if (month === 12 || month <= 2) return 'winter';
  return 'spring_fall';
}

// 基準となる日数データ
const CARE_INTERVALS = {
  water: {
    '多肉・サボテン': {
      spring_fall: { '室内': 14, '屋外': 10 },
      summer: { '室内': 21, '屋外': 21 },
      winter: { '室内': 30, '屋外': 999 }, // 999はほぼ不要（休眠）
    },
    '乾燥系観葉': {
      spring_fall: { '室内': 10, '屋外': 7 },
      summer: { '室内': 7, '屋外': 5 },
      winter: { '室内': 21, '屋外': 999 },
    },
    '標準観葉': {
      spring_fall: { '室内': 7, '屋外': 5 },
      summer: { '室内': 5, '屋外': 3 },
      winter: { '室内': 14, '屋外': 999 },
    },
    '湿潤系観葉': {
      spring_fall: { '室内': 5, '屋外': 3 },
      summer: { '室内': 3, '屋外': 2 },
      winter: { '室内': 10, '屋外': 999 },
    },
    '季節植物・草花': {
      spring_fall: { '室内': 3, '屋外': 2 },
      summer: { '室内': 2, '屋外': 2 },
      winter: { '室内': 7, '屋外': 999 },
    }
  },
  fertilizer: {
    '多肉・サボテン': {
      spring_fall: { '室内': 60, '屋外': 60 },
      summer: { '室内': 999, '屋外': 999 }, // 真夏は肥料焼けを防ぐため休止
      winter: { '室内': 999, '屋外': 999 }, // 冬季休止
    },
    '乾燥系観葉': {
      spring_fall: { '室内': 30, '屋外': 30 },
      summer: { '室内': 45, '屋外': 60 },
      winter: { '室内': 999, '屋外': 999 },
    },
    '標準観葉': {
      spring_fall: { '室内': 30, '屋外': 30 },
      summer: { '室内': 45, '屋外': 60 },
      winter: { '室内': 999, '屋外': 999 },
    },
    '湿潤系観葉': {
      spring_fall: { '室内': 30, '屋外': 30 },
      summer: { '室内': 45, '屋外': 60 },
      winter: { '室内': 999, '屋外': 999 },
    },
    '季節植物・草花': {
      spring_fall: { '室内': 14, '屋外': 14 },
      summer: { '室内': 14, '屋外': 14 },
      winter: { '室内': 999, '屋外': 999 },
    }
  }
};

/**
 * 次回のお世話日を計算する
 * @param {Object} plant 植物データ
 * @param {string} actionType 'water' または 'fertilizer'
 * @param {Date} baseDate 計算の基準となる日（通常は現在の日付か前回のお世話日）
 * @returns {Date | null} 次回予定日（休眠中などで不要な場合はnull）
 */
export function calculateNextCareDate(plant, actionType, baseDate = new Date()) {
  let intervalDays = 0;

  // 手動モードは「水やり」のみに適用。肥料は常に自動アルゴリズムを使用する。
  const isManualWater = actionType === 'water' && (plant.isManualMode || false);

  if (isManualWater) {
    // 水やり手動モード: ユーザー設定の日数を使用
    intervalDays = plant.manualNextWateringDays || 7;
  } else {
    // 自動アルゴリズムモード（肥料は常にここ、水やりは手動OFFのみここ）
    const group = plant.group || '標準観葉';
    const placement = plant.placement || '室内';
    const season = getSeason(baseDate);
    
    // データがない場合の安全対策フォールバック
    const groupData = CARE_INTERVALS[actionType][group] || CARE_INTERVALS[actionType]['標準観葉'];
    intervalDays = groupData[season][placement] || 7;
  }

  // 999日以上の場合は「休眠中/不要」として扱う
  if (intervalDays >= 999) return null;

  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + parseInt(intervalDays, 10));
  nextDate.setHours(0, 0, 0, 0); // 時間はリセット
  
  return nextDate;
}
