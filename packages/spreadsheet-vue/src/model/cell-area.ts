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

const setMainArea = (area: CellArea, startCell: CellInfo, endCell: CellInfo) => {
  area.rect = getElementRect(startCell.cell);
  //   area.data = {
  //     rows: [startCell.row, startCell.row],
  //     columns: [startCell.column, startCell.column],
  //   };
  if (!endCell) return;

  const { rect, drag } = area;
  const endRect = getElementRect(endCell.cell);
  drag.orientation = [];

  if (endRect.left >= rect.left) {
    rect.width = endRect.left - rect.left + endRect.width;
    // data.columns[1] = endCell.column;
    drag.orientation.push("right");
  } else {
    rect.width = rect.left - endRect.left + rect.width;
    rect.left = endRect.left;
    // data.columns[0] = endCell.column;
    // data.columns[1] = startCell.column;
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
  area.drag.orientation = [];
  // const data = {
  //   rows: [...mainData.rows],
  //   columns: [...mainData.columns],
  // }
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

  if (endRect.top < mainRect.top) {
    rect.height = mainRect.top - endRect.top + endRect.height;
    rect.top = endRect.top;
    area.drag.orientation.push("top");
  } else if (endRect.top + endRect.height > mainRect.top + mainRect.height) {
    rect.height = endRect.top - mainRect.top + endRect.height;
    area.drag.orientation.push("bottom");
  }

  area.rect = rect;
  // area.data = data
};

export class CellAreasStore {
  main = createMainArea();
  extension = createExtensionArea();
  copy = createCopyArea();

  setMainArea(startCell: CellInfo, endCell?: CellInfo) {
    setMainArea(this.main, startCell, endCell);
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
