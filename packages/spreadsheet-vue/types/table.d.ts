declare interface BaseObject {
  [key: string]: unknown;
}

declare interface TableDataSource {
  rows: BaseObject[];
  columns: ColumnOption[];
}

declare interface ColumnOption extends BaseObject {
  key: string;
  title: string;
}

declare interface CellOption {
  row: BaseObject;
  column: ColumnOption;
  cell: HTMLElement;
  rowKey?: string | ((row) => string);
  columnKey?: string;
  expandRowKey?: string[];
  treeProps?: {
    children: string;
  };
}

type GetCellValue = (row: BaseObject, column: ColumnOption) => any;
type SetCellValue = (row: BaseObject, column: ColumnOption, value: any) => boolean;

declare interface TableOption {
  data: any;
  columns: ColumnOption[];
  mouseEnteredCell: CellOption;
  isMounted: boolean;
  getTableBodyContainer?: () => Element;
  getCellValue?: (row: BaseObject, column: ColumnOption) => any;
  setCellValue?: (row: BaseObject, column: ColumnOption, value: any) => boolean;
}
