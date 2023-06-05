export const getElTableBodyContainer = (container: HTMLElement) => {
  if (!container) return null;
  const tBody = container.querySelector(".el-scrollbar__wrap");
  return tBody as HTMLElement;
};
