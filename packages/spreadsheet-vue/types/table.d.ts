declare interface BaseObject {
  [key: string]: unknown;
}

declare interface ColumnOption extends BaseObject {
  key: string;
  title: string;
}

declare interface CellOption {
  row: BaseObject;
  column: ColumnOption;
  cell: HTMLElement;
}

type GetCellValue = (row: BaseObject, column: ColumnOption) => any;
type SetCellValue = (row: BaseObject, column: ColumnOption, value: any) => boolean;

declare interface TableOption {
  data: any[];
  columns: ColumnOption[];
  mouseEnteredCell: CellOption;
  isMounted: boolean;
  rowKey?: string | ((row) => string);
  columnKey?: string;
  expandRowKey?: string[];
  treeProps?: {
    children: string;
  };
  getTableBodyContainer?: () => Element;
  getCellValue?: (row: BaseObject, column: ColumnOption) => any;
  setCellValue?: (row: BaseObject, column: ColumnOption, value: any) => boolean;
}
