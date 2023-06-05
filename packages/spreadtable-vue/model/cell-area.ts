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
const setCellValueDafault = (row: BaseObject, column: ColumnOption, value: unknown) => {
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
  }, [] as any[]);
  return data;
};

const setCellsData = (table: TableOption, startIndices: CellAreaIndices, source: unknown[][]) => {
  if (!source.length || !source[0]?.length) return;
  const setCellValue = table.setCellValue || setCellValueDafault;

  const rowStart = startIndices[0];
  const rowEnd = Math.min(rowStart + source.length, table.data.length);

  const colStart = startIndices[1];
  const colEnd = Math.min(colStart + source[0].length, table.columns.length);

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

const calcMainAreaCoord = (startCell: HTMLElement, endCell?: HTMLElement) => {
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
  const data = getCellIndices(endCell);
  if (!data) return null;

  const [index1, index2] = data;
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

const getPureExtensionAreaTip = (extensionArea: CellArea, values: unknown[][], cell: HTMLElement) => {
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
  const tbodyRect = tbody ? getElementRect(tbody) : null;

  const style: any = {
    left: undefined,
    right: undefined,
    top: undefined,
    bottom: undefined,
  };

  const offset = 5;

  if (tbodyRect && top >= tbodyRect.height) {
    style.bottom = offset;
  } else {
    style.top = top + offset;
  }

  if (tbodyRect && left >= tbodyRect.width) {
    style.right = offset;
  } else {
    style.left = left + offset;
  }

  return {
    style: getAreaTipRectStyle(style),
    value,
  };
};

const calcPureExtensionAreaValues = (table: TableOption, mainArea: CellArea, extensionArea: CellArea) => {
  const {
    data: mainAreaData,
    indices: [mainStart, mainEnd],
  } = mainArea;
  const {
    indices: [extensionStart, extensionEnd],
  } = extensionArea;
  if (!mainStart || !mainEnd || !extensionStart || !extensionEnd) return null;

  const isLeft = extensionStart[1] < mainStart[1];
  const isRight = extensionEnd[1] > mainEnd[1];
  const isTop = extensionStart[0] < mainStart[0];
  const isBottom = extensionEnd[0] > mainEnd[0];
  const start = Array.from(mainStart);
  const end = Array.from(mainEnd);
  const indices = [start, end] as CellAreaIndices[];
  const values: unknown[][] = [];
  const getCellValue = table.getCellValue || getCellValueDefault;

  // 获取 indices
  if (isLeft) {
    start[1] = extensionStart[1];
    end[1] = mainStart[1];
  } else if (isRight) {
    start[1] = mainEnd[1];
    end[1] = extensionEnd[1];
  } else if (isTop) {
    start[0] = extensionStart[0];
    end[0] = mainStart[0];
  } else if (isBottom) {
    start[0] = mainEnd[0];
    end[0] = extensionEnd[0];
  }

  // 获取 values
  if (isLeft || isRight) {
    const colLength = end[1] - start[1];
    mainAreaData.rows.forEach(row => {
      const sourceValues = mainAreaData.columns.map(column => getCellValue(row, column));
      const destValues = getDestValues(sourceValues, colLength, isLeft);
      values.push(destValues);
    });
  } else if (isTop || isBottom) {
    const rowLength = end[0] - start[0];
    for (let i = 0; i < rowLength; i++) {
      values.push([]);
    }

    mainAreaData.columns.forEach((column, colIndex) => {
      const sourceValues = mainAreaData.rows.map(row => getCellValue(row, column));
      const destValues = getDestValues(sourceValues, rowLength, isTop);
      destValues.forEach((value, rowIndex) => {
        values[rowIndex][colIndex] = value;
      });
    });
  }

  return {
    indices,
    values,
  };
};

const getCellAreaDataSource = (table: Partial<TableOption>) => {
  const { dataSource = [], expandRowKeys, rowKey = "" } = table;

  if (!expandRowKeys || expandRowKeys?.length < 1) return dataSource;
  const tableData: unknown[] = [];
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

const getCellIndices = (cell?: HTMLElement): CellAreaIndices | null => {
  if (!cell) return null;
  const td = cell.closest("td");
  const tr = td?.closest("tr");
  const tbody = tr?.closest("tbody");
  if (!tbody || !tr) return null;

  let rowIndex = null,
    colIndex = null;

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

  if (rowIndex === null || colIndex === null) return null;
  return [rowIndex, colIndex];
};

const getEndCellByIndices = (startCell: HTMLElement, indices: number[]) => {
  if (!startCell) return null;
  const td = startCell.closest("td");
  const tr = td?.closest("tr");
  const tbody = tr?.closest("tbody");
  if (!tbody || !tr) return null;

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
  const start = getCellIndices(startCell);
  if (!start) return null;

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

class MainAreaDao implements CellAreaDao {
  area: CellArea;

  constructor(area: CellArea) {
    this.area = area;
  }

  setLayout(startCell: HTMLElement, endCell?: HTMLElement | number[]) {
    const _endCell = Array.isArray(endCell) ? getEndCellByIndices(startCell, endCell) || undefined : endCell;
    this.area.coord = calcMainAreaCoord(startCell, _endCell);
  }

  getLayout() {
    return this.area.coord;
  }

  getIndices() {
    return this.area.indices;
  }

  setIndices(startCell: HTMLElement, endCell?: HTMLElement | number[]) {
    const _endCell = Array.isArray(endCell) ? getEndCellByIndices(startCell, endCell) || undefined : endCell;
    this.area.indices = getAreaIndices(startCell, _endCell) || [];
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
    this.area.indices = calcExtensionAreaIndices(mainIndices, endCell, orientation) || [];
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

  selectCell: CellOption | null = null;
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
    if (!this.selectCell) return;
    this.mainArea.setArea(this.table, this.selectCell.cell, endCell);
  }

  setExtensionArea(endCell: HTMLElement) {
    this.extensionArea.setArea(this.table, this.mainArea.area, endCell);
  }

  setCopyArea() {
    this.copyArea.setLayout(this.mainArea.getLayout());
  }

  getPureExtensionAreaValues() {
    return calcPureExtensionAreaValues(this.table, this.mainArea.area, this.extensionArea.area);
  }

  getPureExtensionAreaTip(source: unknown[][]) {
    if (!this.selectCell) return null;
    return getPureExtensionAreaTip(this.extensionArea.area, source, this.selectCell?.cell);
  }

  setCellsData(startCell: HTMLElement | CellAreaIndices, source: unknown[][]) {
    const indices = Array.isArray(startCell) ? startCell : getCellIndices(startCell);
    if (!indices) return;
    return setCellsData(this.table, indices, source);
  }
}

export { CellAreasDao, getAreaRectStyle };
