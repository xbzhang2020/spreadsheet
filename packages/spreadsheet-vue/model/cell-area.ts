import { getDestValues } from "../utils/process";

export const getElementRect = (element: HTMLElement) => {
  const pos: CellAreaRect = {
    left: element.offsetLeft,
    top: element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
  return pos;
};

export const getAreaRectStyle = (rect: CellAreaRect) => {
  const { left, width, top, height } = rect;
  return {
    left: left + "px",
    top: top + "px",
    width: width + "px",
    height: height + "px",
    display: width || height ? "block" : "none",
  };
};

const initArea = (option: DeepPartial<CellArea> = {}) => {
  const res: CellArea = {
    coord: {
      rect: {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
      orientation: [],
    },
    data: {
      rows: [],
      columns: [],
      values: [],
      indices: [],
    },
    drag: {
      mode: option.drag?.mode || null,
      dragging: false,
    },
  };
  return res;
};

const createMainArea = () => {
  const main = initArea();
  return main;
};

const createExtensionArea = () => {
  const area = initArea({
    drag: {
      mode: "clip",
    },
  });
  return area;
};

const createCopyArea = () => {
  const area = initArea({
    drag: {
      mode: "copy",
    },
  });
  return area;
};

const getCellAreaIndcies = (index1: number, index2: number) => {
  if (index1 > index2) {
    return [index2, index1];
  }
  return [index1, index2];
};

const getCellValueDefault = (row: BaseObject, column: ColumnInfo) => row[column.key];
const setCellValueDafault = (row: BaseObject, column: ColumnInfo, value: any) => {
  row[column.key] = value;
};

const getCellAreaDataByIndices = (table: TableInfo, indices: CellAreaData["indices"]) => {
  const data: CellAreaData = {
    rows: [],
    columns: [],
    values: [],
    indices,
  };
  data.rows = table.dataSource.rows.slice(indices[0][0], indices[1][0]);
  data.columns = table.dataSource.columns.slice(indices[0][1], indices[1][1]);

  const getCellValue = table.getCellValue || getCellValueDefault;
  data.values = data.rows.reduce((prev, row) => {
    const items = data.columns.map(column => getCellValue(row, column));
    prev.push(items);
    return prev;
  }, []);
  return data;
};

export const setAreaCells = (table: TableInfo, startCell: CellInfo, source: any[][]) => {
  if (!source.length || !source[0]?.length) return;
  const setCellValue = table.setCellValue || setCellValueDafault;
  const { dataSource } = table;

  const colStart = dataSource.columns.findIndex(col => col.key === startCell.column.key);
  const colEnd = Math.min(colStart + source[0].length, dataSource.columns.length);
  const rowStart = dataSource.rows.findIndex(row => row === startCell.row);
  const rowEnd = Math.min(rowStart + source.length, dataSource.rows.length);

  const data: CellAreaData = {
    rows: dataSource.rows.slice(rowStart, rowEnd),
    columns: dataSource.columns.slice(colStart, colEnd),
    values: source,
    indices: [
      [rowStart, colStart],
      [rowEnd, colEnd],
    ],
  };

  data.rows.forEach((row, i) => {
    data.columns.forEach((col, j) => {
      setCellValue(row, col, data.values[i][j]);
    });
  });

  return data;
};

const calcMainAreaCoord = (startCell: CellInfo, endCell: CellInfo) => {
  const rect = getElementRect(startCell.cell);
  const orientation: CellAreaOrientation[] = [];

  const coord: CellAreaCoord = {
    rect,
    orientation,
  };

  if (!endCell) return coord;

  const endRect = getElementRect(endCell.cell);

  if (endRect.left >= rect.left) {
    rect.width = endRect.left - rect.left + endRect.width;
    orientation.push("right");
  } else {
    rect.width = rect.left - endRect.left + rect.width;
    rect.left = endRect.left;
    orientation.push("left");
  }

  if (endRect.top >= rect.top) {
    rect.height = endRect.top - rect.top + endRect.height;
    orientation.push("bottom");
  } else {
    rect.height = rect.top - endRect.top + rect.height;
    rect.top = endRect.top;
    orientation.push("top");
  }

  return coord;
};

const calcMainAreaData = (table: TableInfo, startCell: CellInfo, endCell?: CellInfo) => {
  if (!endCell) {
    endCell = startCell;
  }

  const { dataSource } = table;
  let index1: number = null,
    index2: number = null,
    index3: number = null,
    index4: number = null;

  dataSource.columns.forEach((col, index) => {
    if (col.key === startCell.column.key) {
      index1 = index;
    }
    if (col.key === endCell.column.key) {
      index2 = index;
    }
  });
  const [colStart, colEnd] = getCellAreaIndcies(index1, index2);

  dataSource.rows.forEach((row, index) => {
    if (row === startCell.row) {
      index3 = index;
    }
    if (row === endCell.row) {
      index4 = index;
    }
  });
  const [rowStart, rowEnd] = getCellAreaIndcies(index3, index4);

  const indices = [
    [rowStart, colStart],
    [rowEnd + 1, colEnd + 1],
  ];

  return getCellAreaDataByIndices(table, indices);
};

const calcExtensionAreaData = (
  table: TableInfo,
  mainArea: CellArea,
  endCell: CellInfo,
  orientation: CellAreaOrientation[]
) => {
  const { dataSource } = table;
  const index1 = dataSource.columns.findIndex(col => col.key === endCell.column.key);
  const index2 = dataSource.rows.findIndex(row => row === endCell.row);
  const mainData = mainArea.data;

  let colStart = mainData.indices[0][1],
    colEnd = mainData.indices[1][1],
    rowStart = mainData.indices[0][0],
    rowEnd = mainData.indices[1][0];

  if (orientation.includes("left")) {
    colStart = index1;
  } else if (orientation.includes("right")) {
    colEnd = index1 + 1;
  }

  if (orientation.includes("top")) {
    rowStart = index2;
  } else {
    rowEnd = index2 + 1;
  }

  const indices = [
    [rowStart, colStart],
    [rowEnd, colEnd],
  ];

  return getCellAreaDataByIndices(table, indices);
};

const calcExtensionAreaCoord = (mainArea: CellArea, endCell: CellInfo) => {
  const mainRect = mainArea.coord.rect;
  const rect = { ...mainRect };
  const orientation: CellAreaOrientation[] = [];

  const coord = {
    rect,
    orientation,
  };

  const endRect = getElementRect(endCell.cell);
  let lastOrientation = orientation || [];
  if (lastOrientation.length === 0 || lastOrientation.includes("left") || lastOrientation.includes("right")) {
    if (endRect.left < mainRect.left) {
      rect.width = mainRect.left - endRect.left + mainRect.width;
      rect.left = endRect.left;
      orientation.push("left");
    } else if (endRect.left + endRect.width > mainRect.left + mainRect.width) {
      rect.width = endRect.left - mainRect.left + endRect.width;
      orientation.push("right");
    }
    lastOrientation = orientation;
  }

  if (lastOrientation.length === 0 || lastOrientation.includes("top") || lastOrientation.includes("bottom")) {
    if (endRect.top < mainRect.top) {
      rect.height = mainRect.top - endRect.top + mainRect.height;
      rect.top = endRect.top;
      orientation.push("top");
    } else if (endRect.top + endRect.height > mainRect.top + mainRect.height) {
      rect.height = endRect.top - mainRect.top + endRect.height;
      orientation.push("bottom");
    }
  }

  return coord;
};

const calcPureExtensionAreaData = (table: TableInfo, mainArea: CellArea, extensionArea: CellArea) => {
  const area = initArea();

  const { data: mainAreaData } = mainArea;
  const { data: extensionAreaData } = extensionArea;

  const orientation = extensionArea.coord.orientation;
  const getCellValue = table.getCellValue || getCellValueDefault;
  const values: any[] = [];

  const { data } = area;
  const mainAreaRect = mainArea.coord.rect;
  const extensionAreaRect = extensionArea.coord.rect;
  const rect = area.coord.rect;

  if (orientation.includes("left") || orientation.includes("right")) {
    const destColumns = extensionAreaData.columns.filter(item => !mainAreaData.columns.includes(item));
    mainAreaData.rows.forEach(row => {
      const sourceValues = mainAreaData.columns.map(column => getCellValue(row, column));
      const destValues = getDestValues(sourceValues, destColumns.length, orientation.includes("left"));
      values.push(destValues);
    });
    data.rows = mainAreaData.rows;
    data.columns = destColumns;
    data.values = values;

    rect.left = orientation.includes("right") ? mainAreaRect.left + mainAreaRect.width : extensionAreaRect.left;
    rect.width = extensionAreaRect.width - mainAreaRect.width;
    rect.top = mainAreaRect.top;
    rect.height = mainAreaRect.height;
    return area.data;
  }

  if (orientation.includes("top") || orientation.includes("bottom")) {
    const destRows = extensionAreaData.rows.filter(item => !mainAreaData.rows.includes(item));
    destRows.forEach(() => {
      values.push([]);
    });

    mainAreaData.columns.forEach((column, colIndex) => {
      const sourceValues = mainAreaData.rows.map(row => getCellValue(row, column));
      const destValues = getDestValues(sourceValues, destRows.length, orientation.includes("top"));
      destValues.forEach((value, rowIndex) => {
        values[rowIndex][colIndex] = value;
      });
    });
    data.rows = destRows;
    data.columns = mainAreaData.columns;
    data.values = values;

    rect.left = mainAreaRect.left;
    rect.width = mainAreaRect.width;
    rect.top = orientation.includes("bottom") ? mainAreaRect.top + mainAreaRect.height : extensionAreaRect.top;
    rect.height = extensionAreaRect.height - mainAreaRect.height;
  }

  area.coord.rect = rect;
  return area.data;
};

export class CellAreasStore {
  table: TableInfo = null;
  selectCell: CellInfo = null;
  main = createMainArea();
  extension = createExtensionArea();
  copy = createCopyArea();
  extended: boolean = false;

  setTableInfo(table: TableInfo) {
    this.table = table;
  }

  setSelectCell(startCell: CellInfo) {
    this.selectCell = startCell;
    this.extended = false;
  }

  getSelectCellStyle() {
    if (!this.selectCell?.cell) return {};
    const rect = getElementRect(this.selectCell.cell);
    return getAreaRectStyle(rect);
  }

  setMainArea(endCell?: CellInfo) {
    this.main.coord = calcMainAreaCoord(this.selectCell, endCell);
    this.main.data = calcMainAreaData(this.table, this.selectCell, endCell);
  }

  getMainAreaStyle() {
    return getAreaRectStyle(this.main.coord.rect);
  }

  isExtended() {
    return this.extended;
  }

  setExtensionArea(endCell: CellInfo) {
    const coord = calcExtensionAreaCoord(this.main, endCell);
    this.extension.coord = coord;
    this.extension.data = calcExtensionAreaData(this.table, this.main, endCell, coord.orientation);
  }

  getExtensionAreaStyle() {
    return getAreaRectStyle(this.extension.coord.rect);
  }

  setCopyArea() {
    this.copy.coord = { ...this.main.coord };
  }

  extendMainArea() {
    this.main.coord = { ...this.extension.coord };
    this.main.data = { ...this.extension.data };
    this.extended = true;
  }

  clearArea(area: CellArea) {
    const rect: CellAreaRect = {
      left: 0,
      width: 0,
      top: 0,
      height: 0,
    };

    area.coord.rect = rect;
    area.coord.orientation = [];
    area.data = {
      rows: [],
      columns: [],
      values: [],
      indices: [],
    };
  }

  getPureExtensionAreaData() {
    return calcPureExtensionAreaData(this.table, this.main, this.extension);
  }

  setAreaCells(startCell: CellInfo, source: any[][]) {
    return setAreaCells(this.table, startCell, source);
  }
}

export const getCellAreaStyle = (area: CellArea) => {
  if (!area) return {};
  const { left, top, width, height } = area.coord.rect;
  return {
    left: left + "px",
    top: top + "px",
    width: width + "px",
    height: height + "px",
    display: width || height ? "block" : "none",
  };
};

export const getCellExtensionAreaTip = (extensionArea: CellArea, values: any[][]) => {
  if (!values?.length || !extensionArea.drag.dragging) return null;

  const last = values[values.length - 1];
  const rect = extensionArea.coord.rect;
  const orientation = extensionArea.coord.orientation;
  let left = 0;
  const top = rect.top + rect.height + 5;
  let value = null;
  if (orientation.includes("left")) {
    left = rect.left;
    value = last[0];
  } else {
    left = rect.left + rect.width + 5;
    value = last[last.length - 1];
  }

  return {
    style: {
      left: left + "px",
      top: top + "px",
    },
    value,
  };
};

export const createCellAreas = () => {
  return new CellAreasStore();
};
