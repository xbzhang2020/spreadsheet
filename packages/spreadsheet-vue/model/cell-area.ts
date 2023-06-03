import { getDestValues, traverseTree } from "../utils/process";

const getElementRect = (element: HTMLElement) => {
  const pos: CellAreaRect = {
    left: element.offsetLeft,
    top: element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
  return pos;
};

const getAreaRectStyle = (rect: CellAreaRect) => {
  const { left, width, top, height } = rect;
  const style = {
    left: left + "px",
    top: top + "px",
    width: width + "px",
    height: height + "px",
    display: width || height ? "block" : "none",
  };
  return style;
};

const getAreaTipRectStyle = (rect: CellAreaTipRect) => {
  const style: Partial<Record<keyof CellAreaTipRect, string>> = {};
  let key: keyof CellAreaTipRect;
  for (key in rect) {
    if (rect[key] || rect[key] === 0) {
      style[key] = `${rect[key]}px`;
    }
  }
  return style;
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
  };
};

const initArea = (option: DeepPartial<CellArea> = {}) => {
  const res: CellArea = {
    coord: initAreaCoord(),
    indices: [],
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

const getCellValueDefault = (row: BaseObject, column: ColumnOption) => row[column.key];
const setCellValueDafault = (row: BaseObject, column: ColumnOption, value: any) => {
  row[column.key] = value;
};

const getCellAreaDataByIndices = (table: TableOption, indices: number[][]) => {
  const data: CellAreaData = {
    rows: [],
    columns: [],
    values: [],
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

const setCellsData = (table: TableOption, startCell: CellOption, source: any[][]) => {
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
  };

  data.rows.forEach((row, i) => {
    data.columns.forEach((col, j) => {
      setCellValue(row, col, data.values[i][j]);
    });
  });

  const indices = [
    [rowStart, colStart],
    [rowEnd, colEnd],
  ];
  return indices;
};

const calcMainAreaCoord = (startCell: HTMLElement, endCell: HTMLElement) => {
  const rect = getElementRect(startCell);
  const orientation: CellAreaOrientation[] = [];

  const coord: CellAreaCoord = {
    rect,
    orientation,
  };

  if (!endCell) return coord;

  const endRect = getElementRect(endCell);

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

const calcExtensionAreaIndices = (
  mainIndices: number[][],
  endCell: HTMLElement,
  orientation: CellAreaOrientation[]
) => {
  const [index1, index2] = getCellIndices(endCell);

  let colStart = mainIndices[0][1],
    colEnd = mainIndices[1][1],
    rowStart = mainIndices[0][0],
    rowEnd = mainIndices[1][0];

  if (orientation.includes("left")) {
    colStart = index2;
  } else if (orientation.includes("right")) {
    colEnd = index2 + 1;
  }

  if (orientation.includes("top")) {
    rowStart = index1;
  } else {
    rowEnd = index1 + 1;
  }

  const indices: CellAreaIndices[] = [
    [rowStart, colStart],
    [rowEnd, colEnd],
  ];

  return indices;
};

const calcExtensionAreaCoord = (mainCoord: CellAreaCoord, endCell: HTMLElement) => {
  const mainRect = mainCoord.rect;
  const rect = { ...mainRect };
  const orientation: CellAreaOrientation[] = [];

  const coord = {
    rect,
    orientation,
  };

  const endRect = getElementRect(endCell);
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

const getCellIndices = (cell: HTMLElement): CellAreaIndices => {
  if (!cell) return;
  const td = cell.closest("td");
  const tr = td.closest("tr");
  const tbody = tr.closest("tbody");
  let rowIndex, colIndex;

  // 过滤不展示的行
  for (let i = 0, index = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    if (window.getComputedStyle(row).display !== "none") {
      if (row === tr) {
        rowIndex = index;
        break;
      } else {
        index++;
      }
    }
  }

  for (let j = 0; j < tr.cells.length; j++) {
    const cell = tr.cells[j];
    if (cell === td) {
      colIndex = j;
      break;
    }
  }

  return [rowIndex, colIndex];
};

const getEndCellByIndices = (startCell: HTMLElement, indices: number[]) => {
  if (!startCell) return;
  const td = startCell.closest("td");
  const tr = td.closest("tr");
  const tbody = tr.closest("tbody");

  const rows: HTMLTableRowElement[] = [];
  // 过滤不展示的行
  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    if (window.getComputedStyle(row).display !== "none") {
      rows.push(row);
    }
  }

  const rowEnd = indices[0] - 1;
  const colEnd = indices[1] - 1;

  return rows[rowEnd]?.cells[colEnd];
};

const getAreaIndices = (startCell: HTMLElement, endCell?: HTMLElement): CellAreaIndices[] | null => {
  if (!startCell) return;
  const start: CellAreaIndices = getCellIndices(startCell);
  let end = getCellIndices(endCell);
  if (end) {
    const temp = Array.from(start);
    if (end[0] < start[0]) {
      start[0] = end[0];
      end[0] = temp[0];
    }
    if (end[1] < start[1]) {
      start[1] = end[1];
      end[1] = temp[1];
    }

    end[0] += 1;
    end[1] += 1;
  } else {
    end = [start[0] + 1, start[1] + 1];
  }
  return [start, end];
};

const clearArea = (area: CellArea) => {
  area.coord = initAreaCoord();
  area.indices = [];
  area.data = initAreaData();
};

const getPureExtensionAreaTip = (extensionArea: CellArea, values: any[][], cell: HTMLElement) => {
  if (!values?.length || !extensionArea.drag.dragging) return null;
  const rect = extensionArea.coord.rect;
  const orientation = extensionArea.coord.orientation;

  let left = undefined;
  let top = undefined;
  let row = null;
  let value = null;

  if (orientation.includes("top")) {
    top = rect.top;
    row = values[0];
  } else {
    top = rect.top + rect.height;
    row = values[values.length - 1];
  }

  if (orientation.includes("left")) {
    left = rect.left;
    value = row[0];
  } else {
    left = rect.left + rect.width;
    value = row[row.length - 1];
  }

  const tbody = cell?.closest("tbody");
  const tbodyRect = getElementRect(tbody);

  const style: any = {
    left: undefined,
    right: undefined,
    top: undefined,
    bottom: undefined,
  };

  const offset = 5;

  if (top >= tbodyRect?.height) {
    style.bottom = offset;
  } else {
    style.top = top + offset;
  }

  if (left >= tbodyRect?.width) {
    style.right = offset;
  } else {
    style.left = left + offset;
  }

  return {
    style: getAreaTipRectStyle(style),
    value,
  };
};

class MainAreaDao implements CellAreaDao {
  area: CellArea;

  constructor(area: CellArea) {
    this.area = area;
  }

  setLayout(startCell: HTMLElement, endCell: HTMLElement | number[] = null) {
    const _endCell = Array.isArray(endCell) ? getEndCellByIndices(startCell, endCell) : endCell;
    this.area.coord = calcMainAreaCoord(startCell, _endCell);
  }

  getLayout() {
    return this.area.coord;
  }

  getIndices() {
    return this.area.indices;
  }

  setIndices(startCell: HTMLElement, endCell: HTMLElement | number[] = null) {
    const _endCell = Array.isArray(endCell) ? getEndCellByIndices(startCell, endCell) : endCell;
    this.area.indices = getAreaIndices(startCell, _endCell);
  }

  setData(table: TableOption, indices: number[][]) {
    this.area.data = getCellAreaDataByIndices(table, indices);
  }

  getData() {
    return this.area.data;
  }

  setDragging(value: boolean) {
    this.area.drag.dragging = value;
  }

  isDragging() {
    return this.area.drag.dragging;
  }

  clear() {
    clearArea(this.area);
  }

  setArea(table: TableOption, startCell: HTMLElement, endCell?: HTMLElement | number[]) {
    this.setLayout(startCell, endCell);
    this.setIndices(startCell, endCell);
    this.setData(table, this.getIndices());
  }

  setAreaFrom(area: CellArea) {
    const { coord, data, indices } = area;
    this.area.coord = { ...coord };
    this.area.indices = [...indices];
    this.area.data = { ...data };
  }
}

class ExtensionAreaDao implements CellAreaDao {
  area: CellArea;

  constructor(area: CellArea) {
    this.area = area;
  }

  setLayout(mainCoord: CellAreaCoord, endCell: HTMLElement) {
    this.area.coord = calcExtensionAreaCoord(mainCoord, endCell);
  }

  getLayout() {
    return this.area.coord;
  }

  setIndices(mainIndices: number[][], endCell: HTMLElement, orientation: CellAreaOrientation[]) {
    this.area.indices = calcExtensionAreaIndices(mainIndices, endCell, orientation);
  }

  getIndices() {
    return this.area.indices;
  }

  setData(table: TableOption, indices: number[][]) {
    this.area.data = getCellAreaDataByIndices(table, indices);
  }

  getData() {
    return this.area.data;
  }

  setDragging(value: boolean) {
    this.area.drag.dragging = value;
  }

  isDragging() {
    return this.area.drag.dragging;
  }

  clear() {
    clearArea(this.area);
  }

  setArea(table: TableOption, mainArea: CellArea, endCell: HTMLElement) {
    this.setLayout(mainArea.coord, endCell);
    this.setIndices(mainArea.indices, endCell, this.area.coord.orientation);
    this.setData(table, this.getIndices());
  }
}

class CopyAreaDao implements CellAreaDao {
  area: CellArea;

  constructor(area: CellArea) {
    this.area = area;
  }

  setLayout(mainCoord: CellAreaCoord) {
    const { rect } = mainCoord;
    this.area.coord.rect = { ...rect };
  }

  getLayout() {
    return this.area.coord;
  }

  setIndices(mainIndices: CellAreaIndices[]) {
    this.area.indices = mainIndices;
  }

  getIndices() {
    return this.area.indices;
  }

  setData(mianData: CellAreaData) {
    this.area.data = mianData;
  }

  getData() {
    return this.area.data;
  }

  setDragging(value: boolean) {
    this.area.drag.dragging = value;
  }

  isDragging() {
    return this.area.drag.dragging;
  }

  clear() {
    clearArea(this.area);
  }
}

class CellAreasDao {
  table = {} as TableOption;

  selectCell: CellOption = null;
  mainArea: MainAreaDao;
  extensionArea: ExtensionAreaDao;
  copyArea: CopyAreaDao;

  constructor() {
    const main = createMainArea();
    const extension = createExtensionArea();
    const copy = createCopyArea();
    this.mainArea = new MainAreaDao(main);
    this.extensionArea = new ExtensionAreaDao(extension);
    this.copyArea = new CopyAreaDao(copy);
  }

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

  getSelectCellRect() {
    if (!this.selectCell?.cell) return {} as CellAreaRect;
    const rect = getElementRect(this.selectCell.cell);
    return rect;
  }

  setMainArea(endCell?: HTMLElement | number[]) {
    this.mainArea.setArea(this.table, this.selectCell?.cell, endCell);
  }

  setExtensionArea(endCell: HTMLElement) {
    this.extensionArea.setArea(this.table, this.mainArea.area, endCell);
  }

  setCopyArea() {
    this.copyArea.setLayout(this.mainArea.getLayout());
  }

  getPureExtensionAreaData() {
    return calcPureExtensionAreaData(this.table, this.mainArea.area, this.extensionArea.area);
  }

  getPureExtensionAreaTip(source: any[][]) {
    return getPureExtensionAreaTip(this.extensionArea.area, source, this.selectCell?.cell);
  }

  setCellsData(startCell: CellOption, source: any[][]) {
    return setCellsData(this.table, startCell, source);
  }
}

export { CellAreasDao, getAreaRectStyle };
