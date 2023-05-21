<template>
  <div ref="container">
    <el-table :data="tableInfo.rows" style="width: 100%" @cell-mouse-enter="hadnleCellMouseEnter" class="table">
      <el-table-column
        v-for="col in tableInfo.columns"
        :key="col.prop"
        :prop="col.key"
        :label="col.title"
        v-bind="col"
      />
    </el-table>
    <CellArea
      :is-parent-mounted="isMounted"
      :get-table-body-container="getTableBodyContainer"
      :data-source="tableInfo"
      :mouse-entered-cell="mouseEnteredCell"
    />
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

const tableInfo = computed<TableInfo>(() => {
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
</script>

<style lang="scss">
.table {
  user-select: none;
}
</style>
