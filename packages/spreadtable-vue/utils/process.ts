// 判断是否为等差数列
export const getDiffValue = (list: number[]) => {
  if (list.length < 2) return 0;
  const diffValue = list[1] - list[0];
  for (let i = 2; i < list.length; i++) {
    if (isNaN(i) || list[i] !== list[i - 1] + diffValue) {
      return null;
    }
  }
  return diffValue;
};

// 扩展数据
export const getDestValues = (sourceValues: any[], length: number, appendFisrt = false) => {
  const diffValue = typeof sourceValues[0] === "number" ? getDiffValue(sourceValues as number[]) : null;
  const res = [];

  // 处理等差数列
  if (diffValue !== null) {
    if (appendFisrt) {
      let lastValue = Number(sourceValues[0]);
      for (let i = 0; i < length; i++) {
        lastValue -= diffValue;
        res[i] = lastValue;
      }
      return res.reverse();
    }
    let lastValue = Number(sourceValues[sourceValues.length - 1]);
    for (let i = 0; i < length; i++) {
      lastValue += diffValue;
      res[i] = lastValue;
    }
    return res;
  }

  for (let i = 0; i < length; i++) {
    const pos = i % sourceValues.length;
    res[i] = sourceValues[pos];
  }
  return res;
};

// 遍历数结构
type TraverseTreeParamsConfig = {
  onlyLeaf?: boolean;
};

export const traverseTree = (treeData: any[], cb = (item: any) => item, config: TraverseTreeParamsConfig = {}) => {
  if (!treeData || !treeData.length) return [];
  const { onlyLeaf } = config;
  treeData.forEach(item => {
    if (!onlyLeaf || !item.children) {
      cb(item);
    }
    if (item.children && item.children.length) {
      traverseTree(item.children, cb, config);
    }
  });
};

export const csv2Json = (clipboardData: ClipboardEvent["clipboardData"]) => {
  if (!clipboardData) return;
  const paste = clipboardData.getData("text");
  let arr = paste.split("\r");
  arr = paste.split("\n");
  const list = arr
    .map(item => {
      return item.split("\t").filter(con => con);
    })
    .filter(item => item.length);
  return list;
};

export const json2Csv = (arrData: any[][]) => {
  let csv = "";
  for (let i = 0; i < arrData.length; i++) {
    let rows = "";
    for (const index in arrData[i]) {
      const arrValue = arrData[i][index] == null ? "" : "" + arrData[i][index];
      rows += arrValue + "\t";
    }
    rows = rows.slice(0, rows.length - 1);

    csv += rows + (arrData.length - 1 !== i ? "\r\n" : "");
  }
  return csv;
};

export const copy2Clipboard = (str: string) => {
  const el = document.createElement("textarea");
  el.value = str;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  const selection = document.getSelection();
  if (!selection) return;
  const selected = selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  if (selected) {
    selection.removeAllRanges();
    selection.addRange(selected);
  }
};
