export const getElTableBodyContainer = (container: HTMLElement) => {
  if (!container) return null;
  // const tBody = container.querySelector(".el-table__body-wrapper");
  const tBody = container.querySelector(".el-scrollbar__wrap");
  return tBody;
};
