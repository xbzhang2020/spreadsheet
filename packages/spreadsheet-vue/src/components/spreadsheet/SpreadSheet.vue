<template>
  <div ref="container">
    <el-table :data="dataSource.rows" style="width: 100%" @cell-mouse-enter="hadnleCellMouseEnter" class="table">
      <el-table-column
        v-for="col in dataSource.columns"
        :key="col.prop"
        :prop="col.key"
        :label="col.title"
        v-bind="col"
      />
    </el-table>
    <CellArea :table-info="tableInfo" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import CellArea from "./CellArea.vue";
import { getElTableBodyContainer } from "../../utils/adapter";
import { useMounted } from "@vueuse/core";
import { getTableDataSource } from "@/utils/mock";

const container = ref(null);

const getTableBodyContainer = () => {
  return getElTableBodyContainer(container.value);
};

const isMounted = useMounted();

const dataSource = computed<TableDataSource>(() => {
  const { rows, columns } = getTableDataSource(6, 8);
  return {
    rows,
    columns,
  };
});

const mouseEnteredCell = ref(null);

const hadnleCellMouseEnter = (row: BaseObject, column: any, cell: any) => {
  mouseEnteredCell.value = {
    row,
    column: {
      key: column.property,
      title: column.label,
    },
    cell,
  };
};

const tableInfo = computed<TableInfo>(() => ({
  dataSource: dataSource.value,
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
