export type DeepPartial<T> = {
  [U in keyof T]?: T[U] extends object ? DeepPartial<T[U]> : T[U];
};

export interface BaseObject {
  [key: string]: unknown;
}

export interface ColumnOption extends BaseObject {
  key: string;
  title: string;
}

export interface CellOption {
  row: BaseObject;
  column: ColumnOption;
  cell: HTMLElement;
}

export type GetCellValue = (row: BaseObject, column: ColumnOption) => any;
export type SetCellValue = (row: BaseObject, column: ColumnOption, value: any) => boolean;

export interface TableOption {
  dataSource?: any[];
  data: any[];
  columns: ColumnOption[];
  mouseEnteredCell: CellOption;
  isMounted: boolean;
  rowKey?: string;
  columnKey?: string;
  expandRowKeys?: string[];
  treeProps?: {
    children: string;
  };
  getTableBodyContainer?: () => Element;
  getCellValue?: (row: BaseObject, column: ColumnOption) => any;
  setCellValue?: (row: BaseObject, column: ColumnOption, value: any) => boolean;
}

export interface CellAreas {
  select: CellArea;
  main: CellArea;
  extension: CellArea;
  copy?: CellArea;
}

// 数据层
export interface CellArea {
  coord: CellAreaCoord;
  indices: CellAreaIndices[];
  data: CellAreaData;
  drag: CellAreaDrag;
  setArea?: Function;
}

// 数据访问层
export interface CellAreaDao {
  area: CellArea;
  setLayout: Function;
  getLayout: Function;
  setData: Function;
  getData: Function;
  setIndices: Function;
  getIndices: Function;
  setDragging: (value: boolean) => void;
  isDragging: () => boolean;
  clear: () => void;
}

export interface CellAreaCoord {
  rect: CellAreaRect;
  orientation: CellAreaOrientation[];
}

export interface CellAreaRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CellAreaTipRect {
  left?: number;
  right?: number;
  width?: number;
  height?: number;
  top?: number;
  right?: number;
}

export interface CellAreaData {
  rows: BaseObject[];
  columns: ColumnOption[];
  values: any[][];
}

export interface CellAreaDrag {
  mode: "clip" | "copy" | "default";
  dragging: boolean;
}

export type CellAreaDragMode = "row" | "column" | "cell";

export type CellAreaOrientation = "left" | "right" | "center" | "top" | "bottom";

export type CellAreaIndices = [number, number];
