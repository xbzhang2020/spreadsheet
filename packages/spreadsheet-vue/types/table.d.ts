declare interface BaseObject {
  [key: string]: unknown;
}

declare interface TableDataSource {
  rows: BaseObject[];
  columns: ColumnInfo[];
}

declare interface ColumnInfo extends BaseObject {
  key: string;
  title: string;
}

declare interface CellInfo {
  row: BaseObject;
  column: ColumnInfo;
  cell: HTMLElement;
}

type GetCellValue = (row: BaseObject, column: ColumnInfo) => any;
type SetCellValue = (row: BaseObject, column: ColumnInfo, value: any) => boolean;

declare interface TableInfo {
  dataSource: TableDataSource;
  mouseEnteredCell: CellInfo;
  isMounted: boolean;
  getTableBodyContainer?: () => Element;
  getCellValue?: (row: BaseObject, column: ColumnInfo) => any;
  setCellValue?: (row: BaseObject, column: ColumnInfo, value: any) => boolean;
}
