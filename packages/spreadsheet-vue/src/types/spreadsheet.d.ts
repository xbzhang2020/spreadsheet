declare type DeepPartial<T> = {
  [U in keyof T]?: T[U] extends object ? DeepPartial<T[U]> : T[U];
};

declare interface BaseObject {
  [key: string]: unknown;
}

declare interface TableInfo {
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

declare interface CellAreas {
  main: CellArea;
  extension: CellArea;
  copy?: CellArea;
}

declare interface CellArea {
  rect: CellAreaRect;
  data: CellAreaData;
  drag: CellAreaDrag;
}

declare interface CellAreaRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

declare interface CellAreaData {
  rows: BaseObject[];
  columns: ColumnInfo[];
}

declare interface CellAreaDrag {
  mode: "clip" | "copy" | "default";
  dragging: boolean;
  orientation: CellAreaDragOrientation[];
}

declare type CellAreaDragMode = "row" | "column" | "cell";

declare type CellAreaDragOrientation = "left" | "right" | "center" | "top" | "bottom";
