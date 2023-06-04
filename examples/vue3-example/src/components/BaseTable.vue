<template>
  <div ref="container">
    <el-table
      :data="dataSource.rows"
      style="width: 100%"
      @cell-mouse-enter="mouseEnteredCellListener"
      class="table"
    >
      <el-table-column
        v-for="col in dataSource.columns"
        :prop="col.key"
        :label="col.title"
        v-bind="col"
      />
    </el-table>
    <CellArea
      :is-table-mounted="isMounted"
      :get-table-body-container="getTableBodyContainer"
      :mouse-entered-cell="mouseEnteredCell"
      :data-source="dataSource.rows"
      :columns="dataSource.columns"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { CellArea, getElTableBodyContainer } from "spreadtable-vue";

const getColumnKeys = (columnLength: number) => {
  const res = [];
  for (let i = 0; i < columnLength; i++) {
    res.push(String.fromCharCode(65 + i));
  }
  return res;
};

const getTableDataSource = (rowLength: number, columnLength: number) => {
  const columnKeys = getColumnKeys(columnLength);
  const columns = columnKeys.map((col) => ({
    title: col,
    key: col,
  }));

  const rows = [];
  for (let i = 0; i < rowLength; i++) {
    const row: any = {};
    columnKeys.forEach((col, j) => {
      row[col] = Number(`${i}${j}`);
    });
    rows.push(row);
  }
  return { columns, rows };
};

const useGetMouseEnteredCell = () => {
  const mouseEnteredCell: any = ref(null);

  const mouseEnteredCellListener = (row: any, column: any, cell: any) => {
    mouseEnteredCell.value = {
      row,
      column: {
        key: column.property,
        title: column.label,
      },
      cell,
    };
  };

  return [mouseEnteredCell, mouseEnteredCellListener];
};

const dataSource = computed(() => {
  const { rows, columns } = getTableDataSource(6, 8);
  return {
    rows,
    columns,
  };
});

const container: any = ref(null);
const [mouseEnteredCell, mouseEnteredCellListener] = useGetMouseEnteredCell();
const getTableBodyContainer = () => getElTableBodyContainer(container.value);
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script>

<style lang="scss">
.table {
  user-select: none;
}
</style>
