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
