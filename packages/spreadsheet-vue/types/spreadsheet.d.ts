declare type DeepPartial<T> = {
  [U in keyof T]?: T[U] extends object ? DeepPartial<T[U]> : T[U];
};

declare interface CellAreas {
  select: CellArea;
  main: CellArea;
  extension: CellArea;
  copy?: CellArea;
}

declare interface CellArea {
  coord: CellAreaCoord;
  data: CellAreaData;
  drag: CellAreaDrag;
  setArea?: Function;
}

declare interface CellAreaCoord {
  rect: CellAreaRect;
  orientation: CellAreaOrientation[];
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
  values: any[][];
  indices: number[][];
}

declare interface CellAreaDrag {
  mode: "clip" | "copy" | "default";
  dragging: boolean;
}

declare type CellAreaDragMode = "row" | "column" | "cell";

declare type CellAreaOrientation = "left" | "right" | "center" | "top" | "bottom";
