declare type DeepPartial<T> = {
  [U in keyof T]?: T[U] extends object ? DeepPartial<T[U]> : T[U];
};

declare interface CellAreas {
  select: CellArea;
  main: CellArea;
  extension: CellArea;
  copy?: CellArea;
}

// 数据层
declare interface CellArea {
  coord: CellAreaCoord;
  indices: CellAreaIndices[];
  data: CellAreaData;
  drag: CellAreaDrag;
  setArea?: Function;
}

// 数据访问层
declare interface CellAreaDao {
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

declare interface CellAreaTipRect {
  left?: number;
  right?: number;
  width?: number;
  height?: number;
  top?: number;
  right?: number;
}

declare interface CellAreaData {
  rows: BaseObject[];
  columns: ColumnOption[];
  values: any[][];
}

declare interface CellAreaDrag {
  mode: "clip" | "copy" | "default";
  dragging: boolean;
}

declare type CellAreaDragMode = "row" | "column" | "cell";

declare type CellAreaOrientation = "left" | "right" | "center" | "top" | "bottom";

declare type CellAreaIndices = [number, number];
