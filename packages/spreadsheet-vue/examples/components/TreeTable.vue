<template>
  <div ref="container">
    <el-table
      :data="tableData"
      style="width: 100%; margin-bottom: 20px"
      row-key="id"
      border
      :expand-row-keys="expandRowKeys"
      @cell-mouse-enter="mouseEnteredCellListener"
      @expand-change.stop="handleExpandChange"
    >
      <el-table-column prop="date" label="Date" sortable />
      <el-table-column prop="name" label="Name" sortable />
      <el-table-column prop="address" label="Address" sortable />
    </el-table>
    <CellArea :table-option="tableOption" />
  </div>
</template>
<script lang="ts" setup>
import { ref, computed } from "vue";
import { useGetMouseEnteredCell } from "../hooks/cell";
import { getElTableBodyContainer } from "../../utils/adapter";
import { useMounted } from "@vueuse/core";
import CellArea from "../../components/cell-area.vue";

interface User {
  id: number;
  date: string;
  name: string;
  address: string;
  hasChildren?: boolean;
  children?: User[];
}

// const load = (_: User, __: unknown, resolve: (date: User[]) => void) => {
//   setTimeout(() => {
//     resolve([
//       {
//         id: 31,
//         date: "2016-05-01",
//         name: "wangxiaohu",
//         address: "No. 189, Grove St, Los Angeles",
//       },
//       {
//         id: 32,
//         date: "2016-05-01",
//         name: "wangxiaohu",
//         address: "No. 189, Grove St, Los Angeles",
//       },
//     ]);
//   }, 1000);
// };

const tableData: User[] = [
  {
    id: 1,
    date: "2016-05-02",
    name: "wangxiaohu",
    address: "No. 189, Grove St, Los Angeles",
  },
  {
    id: 2,
    date: "2016-05-04",
    name: "wangxiaohu",
    address: "No. 189, Grove St, Los Angeles",
  },
  {
    id: 3,
    date: "2016-05-01",
    name: "wangxiaohu",
    address: "No. 189, Grove St, Los Angeles",
    children: [
      {
        id: 31,
        date: "2016-05-01",
        name: "wangxiaohu",
        address: "No. 189, Grove St, Los Angeles",
      },
      {
        id: 32,
        date: "2016-05-01",
        name: "wangxiaohu",
        address: "No. 189, Grove St, Los Angeles",
      },
    ],
  },
  {
    id: 4,
    date: "2016-05-03",
    name: "wangxiaohu",
    address: "No. 189, Grove St, Los Angeles",
  },
];

//   {
//     id: 1,
//     date: "2016-05-02",
//     name: "wangxiaohu",
//     address: "No. 189, Grove St, Los Angeles",
//   },
//   {
//     id: 2,
//     date: "2016-05-04",
//     name: "wangxiaohu",
//     address: "No. 189, Grove St, Los Angeles",
//   },
//   {
//     id: 3,
//     date: "2016-05-01",
//     name: "wangxiaohu",
//     hasChildren: true,
//     address: "No. 189, Grove St, Los Angeles",
//   },
//   {
//     id: 4,
//     date: "2016-05-03",
//     name: "wangxiaohu",
//     address: "No. 189, Grove St, Los Angeles",
//   },
// ];

const columns = [
  {
    key: "date",
    title: "Date",
  },
  {
    key: "name",
    title: "Name",
  },
  {
    key: "address",
    title: "Address",
  },
];
const expandRowKeys = ref([]);

const handleExpandChange = (row: any, expanded: boolean) => {
  if (expanded) {
    expandRowKeys.value.push(row.id);
  } else {
    const index = expandRowKeys.value.findIndex(item => item === row.id);
    console.log(index, 1);
    if (index !== -1) {
      expandRowKeys.value.splice(index, 1);
    }
  }
};

const container = ref(null);
const [mouseEnteredCell, mouseEnteredCellListener] = useGetMouseEnteredCell();
const getTableBodyContainer = () => getElTableBodyContainer(container.value);
const isMounted = useMounted();

const tableOption = computed<TableOption>(() => ({
  dataSource: {
    rows: tableData as unknown as BaseObject[],
    columns: columns,
  },
  getTableBodyContainer,
  mouseEnteredCell: mouseEnteredCell.value,
  isMounted: isMounted.value,
  expandRowKeys: expandRowKeys.value,
  rowKey: "id",
}));
</script>
