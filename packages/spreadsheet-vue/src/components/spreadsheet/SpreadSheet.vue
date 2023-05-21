<template>
  <div ref="container">
    <el-table :data="tableData" style="width: 100%" @cell-mouse-enter="hadnleCellMouseEnter" class="table">
      <el-table-column v-for="col in columns" :key="col.prop" :prop="col.prop" :label="col.label" v-bind="col" />
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

const container = ref(null);

const getTableBodyContainer = () => {
  return getElTableBodyContainer(container.value);
};

const isMounted = useMounted();

const tableData = ref([
  {
    date: "2016-05-03",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles",
  },
  {
    date: "2016-05-02",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles",
  },
  {
    date: "2016-05-04",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles",
  },
  {
    date: "2016-05-01",
    name: "Tom",
    address: "No. 189, Grove St, Los Angeles",
  },
]);

const columns = [
  {
    prop: "date",
    label: "Date",
    width: 180,
  },
  {
    prop: "name",
    label: "Name",
    width: 180,
  },
  {
    prop: "address",
    label: "Address",
  },
];

const tableInfo = computed<TableInfo>(() => {
  return {
    rows: tableData.value,
    columns: columns.map(item => ({
      ...item,
      key: item.prop,
      title: item.label,
    })),
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
