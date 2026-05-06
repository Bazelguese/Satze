// ============================================
// UTILITÀ - Shuffle Array
// ============================================

/**
 * Mescola un array usando l'algoritmo Fisher-Yates
 * @param {Array} array - Array da mescolare
 * @returns {Array} - Nuovo array mescolato
 */
export const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };