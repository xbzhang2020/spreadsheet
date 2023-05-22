declare type DeepPartial<T> = {
  [U in keyof T]?: T[U] extends object ? DeepPartial<T[U]> : T[U];
};

declare interface CellAreas {
  main: CellArea;
  extension: CellArea;
  copy?: CellArea;
}

declare interface CellArea {
  rect: CellAreaRect;
  data: CellAreaData;
  drag: CellAreaDrag;
  setArea?: Function;
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
  orientation: CellAreaDragOrientation[];
}

declare type CellAreaDragMode = "row" | "column" | "cell";

declare type CellAreaDragOrientation = "left" | "right" | "center" | "top" | "bottom";
