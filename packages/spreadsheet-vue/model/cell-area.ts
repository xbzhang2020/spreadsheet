import { getDestValues, traverseTree } from "../utils/process";

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

const initAreaRect = (): CellAreaRect => {
  return {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  };
};

const initAreaCoord = (): CellAreaCoord => {
  return {
    rect: initAreaRect(),
    orientation: [],
  };
};

const initAreaData = (): CellAreaData => {
  return {
    rows: [],
    columns: [],
    values: [],
    indices: [],
  };
};

const initArea = (option: DeepPartial<CellArea> = {}) => {
  const res: CellArea = {
    coord: initAreaCoord(),
    data: initAreaData(),
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

const getCellValueDefault = (row: BaseObject, column: ColumnOption) => row[column.key];
const setCellValueDafault = (row: BaseObject, column: ColumnOption, value: any) => {
  row[column.key] = value;
};

const getCellAreaDataByIndices = (table: TableOption, indices: CellAreaData["indices"]) => {
  const data: CellAreaData = {
    rows: [],
    columns: [],
    values: [],
    indices,
  };
  data.rows = table.data.slice(indices[0][0], indices[1][0]);
  data.columns = table.columns.slice(indices[0][1], indices[1][1]);

  const getCellValue = table.getCellValue || getCellValueDefault;
  data.values = data.rows.reduce((prev, row) => {
    const items = data.columns.map(column => getCellValue(row, column));
    prev.push(items);
    return prev;
  }, []);
  return data;
};

export const setAreaCells = (table: TableOption, startCell: CellOption, source: any[][]) => {
  if (!source.length || !source[0]?.length) return;
  const setCellValue = table.setCellValue || setCellValueDafault;

  const colStart = table.columns.findIndex(col => col.key === startCell.column.key);
  const colEnd = Math.min(colStart + source[0].length, table.columns.length);
  const rowStart = table.data.findIndex(row => row === startCell.row);
  const rowEnd = Math.min(rowStart + source.length, table.data.length);

  const data: CellAreaData = {
    rows: table.data.slice(rowStart, rowEnd),
    columns: table.columns.slice(colStart, colEnd),
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

const calcMainAreaCoord = (startCell: CellOption, endCell: CellOption) => {
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

const calcMainAreaData = (table: TableOption, startCell: CellOption, endCell?: CellOption) => {
  if (!endCell) {
    endCell = startCell;
  }

  let index1: number = null,
    index2: number = null,
    index3: number = null,
    index4: number = null;

  table.columns.forEach((col, index) => {
    if (col.key === startCell.column.key) {
      index1 = index;
    }
    if (col.key === endCell.column.key) {
      index2 = index;
    }
  });
  const [colStart, colEnd] = getCellAreaIndcies(index1, index2);

  table.data.forEach((row: any, index: number) => {
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
  table: TableOption,
  mainArea: CellArea,
  endCell: CellOption,
  orientation: CellAreaOrientation[]
) => {
  const index1 = table.columns.findIndex(col => col.key === endCell.column.key);
  const index2 = table.data.findIndex(row => row === endCell.row);
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

const calcExtensionAreaCoord = (mainArea: CellArea, endCell: CellOption) => {
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

const calcPureExtensionAreaData = (table: TableOption, mainArea: CellArea, extensionArea: CellArea) => {
  const { data: mainAreaData } = mainArea;
  const { data: extensionAreaData } = extensionArea;

  const orientation = extensionArea.coord.orientation;
  const getCellValue = table.getCellValue || getCellValueDefault;

  const data: CellAreaData = {
    rows: [],
    columns: [],
    values: [],
    indices: [],
  };

  if (orientation.includes("left") || orientation.includes("right")) {
    const destColumns = extensionAreaData.columns.filter(item => !mainAreaData.columns.includes(item));
    mainAreaData.rows.forEach(row => {
      const sourceValues = mainAreaData.columns.map(column => getCellValue(row, column));
      const destValues = getDestValues(sourceValues, destColumns.length, orientation.includes("left"));
      data.values.push(destValues);
    });
    data.rows = mainAreaData.rows;
    data.columns = destColumns;

    return data;
  }

  if (orientation.includes("top") || orientation.includes("bottom")) {
    const destRows = extensionAreaData.rows.filter(item => !mainAreaData.rows.includes(item));
    destRows.forEach(() => {
      data.values.push([]);
    });

    mainAreaData.columns.forEach((column, colIndex) => {
      const sourceValues = mainAreaData.rows.map(row => getCellValue(row, column));
      const destValues = getDestValues(sourceValues, destRows.length, orientation.includes("top"));
      destValues.forEach((value, rowIndex) => {
        data.values[rowIndex][colIndex] = value;
      });
    });
    data.rows = destRows;
    data.columns = mainAreaData.columns;
  }

  return data;
};

const getCellAreaDataSource = (table: Partial<TableOption>) => {
  const { dataSource, expandRowKeys, rowKey } = table;

  if (!expandRowKeys || expandRowKeys?.length < 1) return dataSource;
  const tableData: any[] = [];
  traverseTree(dataSource, item => {
    const isRoot = dataSource.find(row => row[rowKey] === item[rowKey]);
    if (isRoot) {
      tableData.push(item);
    }

    if (expandRowKeys.includes(item[rowKey]) && item.children?.length) {
      tableData.push(...item.children);
    }
  });
  return tableData;
};

export class CellAreasStore {
  table = {} as TableOption;
  selectCell: CellOption = null;
  main = createMainArea();
  extension = createExtensionArea();
  copy = createCopyArea();
  extended: boolean = false;

  setTableInfo(table: Partial<TableOption>) {
    const data = getCellAreaDataSource(table);
    this.table = Object.assign(this.table, {
      ...table,
      data,
    });
  }

  setSelectCell(startCell: CellOption) {
    this.selectCell = startCell;
  }

  getSelectCellStyle() {
    if (!this.selectCell?.cell) return {};
    const rect = getElementRect(this.selectCell.cell);
    return getAreaRectStyle(rect);
  }

  setMainArea(endCell?: CellOption) {
    if (!endCell || this.selectCell === endCell) {
      this.extended = false;
    } else {
      this.extended = true;
    }
    this.main.coord = calcMainAreaCoord(this.selectCell, endCell);
    this.main.data = calcMainAreaData(this.table, this.selectCell, endCell);
  }

  setMainAreaDragging(value: boolean) {
    this.main.drag.dragging = value;
  }

  getMainAreaDragging() {
    return this.main.drag.dragging;
  }

  getMainAreaStyle() {
    return getAreaRectStyle(this.main.coord.rect);
  }

  clearMainArea() {
    this.main.coord = initAreaCoord();
    this.main.data = initAreaData();
  }

  isExtended() {
    return this.extended;
  }

  setExtensionArea(endCell: CellOption) {
    const coord = calcExtensionAreaCoord(this.main, endCell);
    this.extension.coord = coord;
    this.extension.data = calcExtensionAreaData(this.table, this.main, endCell, coord.orientation);
  }

  getExtensionAreaStyle() {
    return getAreaRectStyle(this.extension.coord.rect);
  }

  setExtensionAreaDragging(value: boolean) {
    this.extension.drag.dragging = value;
  }

  getExtensionAreaDragging() {
    return this.extension.drag.dragging;
  }

  setCopyArea() {
    this.copy.coord = { ...this.main.coord };
  }

  getCopyAreaDragging() {
    return this.copy.drag.dragging;
  }

  setCopyAreaDragging(value: boolean) {
    this.copy.drag.dragging = value;
  }

  getCopyAreaStyle() {
    return getAreaRectStyle(this.copy.coord.rect);
  }

  extendMainArea() {
    this.extended = true;
    this.main.coord = { ...this.extension.coord };
    this.main.data = { ...this.extension.data };
  }

  clearExtensionArea() {
    this.extension.coord = initAreaCoord();
    this.extension.data = initAreaData();
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

  setAreaCells(startCell: CellOption, source: any[][]) {
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
