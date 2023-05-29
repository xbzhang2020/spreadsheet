import { ref } from "vue";

export const useGetMouseEnteredCell = () => {
  const mouseEnteredCell = ref(null);

  const mouseEnteredCellListener = (row: BaseObject, column: any, cell: any) => {
    mouseEnteredCell.value = {
      row,
      column: {
        key: column.property,
        title: column.label,
      },
      cell,
    };
  };

  return [mouseEnteredCell, mouseEnteredCellListener];
};
