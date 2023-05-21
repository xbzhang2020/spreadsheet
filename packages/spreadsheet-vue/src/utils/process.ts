// 判断是否为等差数列
export const getDiffValue = (list: number[]) => {
  if (list.length < 2) return 0;
  const diffValue = list[1] - list[0];
  for (let i = 2; i < list.length; i++) {
    if (isNaN(i) || list[i] !== list[i - 1] + diffValue) {
      return null;
    }
  }
  return diffValue;
};

// 扩展数据
export const getDestValues = (sourceValues: any[], length: number, appendFisrt = false) => {
  const diffValue = typeof sourceValues[0] === "number" ? getDiffValue(sourceValues as number[]) : null;
  const res = [];

  // 处理等差数列
  if (diffValue !== null) {
    if (appendFisrt) {
      let lastValue = Number(sourceValues[0]);
      for (let i = 0; i < length; i++) {
        lastValue -= diffValue;
        res[i] = lastValue;
      }
      return res.reverse();
    }
    let lastValue = Number(sourceValues[sourceValues.length - 1]);
    for (let i = 0; i < length; i++) {
      lastValue += diffValue;
      res[i] = lastValue;
    }
    return res;
  }

  for (let i = 0; i < length; i++) {
    const pos = i % sourceValues.length;
    res[i] = sourceValues[pos];
  }
  return res;
};
