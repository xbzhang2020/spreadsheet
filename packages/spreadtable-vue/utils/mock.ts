const getColumnKeys = (columnLength: number) => {
  const res = [];
  for (let i = 0; i < columnLength; i++) {
    res.push(String.fromCharCode(65 + i));
  }
  return res;
};

export const getTableDataSource = (rowLength: number, columnLength: number) => {
  const columnKeys = getColumnKeys(columnLength);
  const columns = columnKeys.map(col => ({
    title: col,
    key: col,
  }));

  const rows = [];
  for (let i = 0; i < rowLength; i++) {
    const row = {};
    columnKeys.forEach((col, j) => {
      row[col] = Number(`${i}${j}`);
    });
    rows.push(row);
  }
  return { columns, rows };
};
