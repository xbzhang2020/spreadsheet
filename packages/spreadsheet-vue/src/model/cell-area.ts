const getElementRect = (element: HTMLElement) => {
  const pos: CellAreaRect = {
    left: element.offsetLeft,
    top: element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
  return pos;
};

const initArea = (option: DeepPartial<CellArea> = {}) => {
  const res: CellArea = {
    rect: {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    },
    data: {
      rows: [],
      columns: [],
      values: [],
    },
    drag: {
      mode: option.drag?.mode || null,
      dragging: false,
      orientation: [],
    },
  };
  return res;
};

const createMainArea = () => {
  return initArea();
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

const getMainAreaData = (table: TableInfo, startCell: CellInfo, endCell?: CellInfo) => {
  const data: CellAreaData = {
    rows: [],
    columns: [],
    values: [],
  };

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
  data.columns = dataSource.columns.slice(colStart, colEnd + 1);

  dataSource.rows.forEach((row, index) => {
    if (row === startCell.row) {
      index3 = index;
    }
    if (row === endCell.row) {
      index4 = index;
    }
  });
  const [rowStart, rowEnd] = getCellAreaIndcies(index3, index4);
  data.rows = dataSource.rows.slice(rowStart, rowEnd + 1);

  const getCellValue = table.getCellValue || ((row, column) => row[column.key]);
  data.values = data.rows.reduce((prev, row) => {
    const items = data.columns.map(column => getCellValue(row, column));
    prev.push(items);
    return prev;
  }, []);

  return data;
};

const setMainAreaRect = (area: CellArea, startCell: CellInfo, endCell: CellInfo) => {
  area.rect = getElementRect(startCell.cell);

  if (!endCell) return;

  const { rect, drag } = area;
  const endRect = getElementRect(endCell.cell);
  drag.orientation = [];

  if (endRect.left >= rect.left) {
    rect.width = endRect.left - rect.left + endRect.width;
    drag.orientation.push("right");
  } else {
    rect.width = rect.left - endRect.left + rect.width;
    rect.left = endRect.left;
    drag.orientation.push("left");
  }

  if (endRect.top >= rect.top) {
    rect.height = endRect.top - rect.top + endRect.height;
    drag.orientation.push("bottom");
  } else {
    rect.height = rect.top - endRect.top + rect.height;
    rect.top = endRect.top;
    drag.orientation.push("top");
  }
};

const setExtensionArea = (area: CellArea, mainArea: CellArea, endCell: CellInfo) => {
  const { rect: mainRect } = mainArea;
  const endRect = getElementRect(endCell.cell);
  const rect = { ...mainRect };
  let lastOrientation = area.drag.orientation || [];
  area.drag.orientation = [];
  // const data = {
  //   rows: [...mainData.rows],
  //   columns: [...mainData.columns],
  // }

  if (lastOrientation.length === 0 || lastOrientation.includes("left") || lastOrientation.includes("right")) {
    if (endRect.left < mainRect.left) {
      rect.width = mainRect.left - endRect.left + mainRect.width;
      rect.left = endRect.left;
      //   data.columns[0] = endCell.column
      area.drag.orientation.push("left");
    } else if (endRect.left + endRect.width > mainRect.left + mainRect.width) {
      rect.width = endRect.left - mainRect.left + endRect.width;
      //   data.columns[1] = endCell.column
      area.drag.orientation.push("right");
    }
    lastOrientation = area.drag.orientation;
  }

  if (lastOrientation.length === 0 || lastOrientation.includes("top") || lastOrientation.includes("bottom")) {
    if (endRect.top < mainRect.top) {
      rect.height = mainRect.top - endRect.top + mainRect.height;
      rect.top = endRect.top;
      area.drag.orientation.push("top");
    } else if (endRect.top + endRect.height > mainRect.top + mainRect.height) {
      rect.height = endRect.top - mainRect.top + endRect.height;
      area.drag.orientation.push("bottom");
    }
  }

  area.rect = rect;
  // area.data = data
};

export class CellAreasStore {
  table: TableInfo = null;
  main = createMainArea();
  extension = createExtensionArea();
  copy = createCopyArea();

  setTableInfo(table: TableInfo) {
    this.table = table;
  }

  setMainArea(startCell: CellInfo, endCell?: CellInfo) {
    setMainAreaRect(this.main, startCell, endCell);
    this.main.data = getMainAreaData(this.table, startCell, endCell);
    console.log(this.main.data.values);
  }

  setExtensionArea(endCell: CellInfo) {
    setExtensionArea(this.extension, this.main, endCell);
  }

  setCopyArea() {
    this.copy.rect = { ...this.main.rect };
  }

  extendMainArea() {
    this.main.rect = { ...this.extension.rect };
    // this.main.data = { ...this.extension.data }
  }

  clearArea(area: CellArea) {
    area.rect.left = 0;
    area.rect.top = 0;
    area.rect.width = 0;
    area.rect.height = 0;

    // area.data.rows = []
    // area.data.columns = []
  }
}

export const getCellAreaStyle = (area: CellArea) => {
  const { left, top, width, height } = area.rect;
  return {
    left: left + "px",
    top: top + "px",
    width: width + "px",
    height: height + "px",
    display: width || height ? "block" : "none",
  };
};

export const createCellAreas = () => {
  return new CellAreasStore();
};
