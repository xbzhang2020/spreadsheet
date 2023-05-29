<template>
  <div ref="container">
    <el-table :data="dataSource.rows" style="width: 100%" @cell-mouse-enter="mouseEnteredCellListener" class="table">
      <el-table-column
        v-for="col in dataSource.columns"
        :key="col.prop"
        :prop="col.key"
        :label="col.title"
        v-bind="col"
      />
    </el-table>
    <CellArea :table-option="tableOption" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import CellArea from "../../components/cell-area.vue";
import { useMounted } from "@vueuse/core";
import { getElTableBodyContainer } from "../../utils/adapter";
import { getTableDataSource } from "../../utils/mock";
import { useGetMouseEnteredCell } from "../hooks/cell";

const dataSource = computed<TableDataSource>(() => {
  const { rows, columns } = getTableDataSource(6, 8);
  return {
    rows,
    columns,
  };
});

const container = ref(null);
const [mouseEnteredCell, mouseEnteredCellListener] = useGetMouseEnteredCell();
const getTableBodyContainer = () => getElTableBodyContainer(container.value);
const isMounted = useMounted();
const tableOption = computed<TableOption>(() => ({
  columns: dataSource.value.columns,
  data: dataSource.value.rows,
  getTableBodyContainer,
  mouseEnteredCell: mouseEnteredCell.value,
  isMounted: isMounted.value,
}));
</script>

<style lang="scss">
.table {
  user-select: none;
}
</style>
