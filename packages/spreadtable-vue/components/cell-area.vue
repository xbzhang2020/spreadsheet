<template>
  <div ref="areaRef" class="spread-cell-area">
    <div class="spread-cell-area__select" :style="selectCellStyle"></div>
    <div
      class="spread-cell-area__main"
      :class="[extended && 'spread-cell-area__main--extended']"
      :style="mainAreaStyle"
    >
      <div class="spread-cell-area__main-btn" @mousedown.stop="handleDragBtnMousedown"></div>
    </div>
    <div class="spread-cell-area__extension" :style="extensionAreaStyle"></div>
    <div v-if="extensionAreaTip" class="spread-cell-area__extension-tip" :style="extensionAreaTip.style">
      {{ extensionAreaTip.value }}
    </div>
    <div class="spread-cell-area__copy spread-rolling-border" :style="copyAreaStyle"></div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  watchEffect,
  Ref,
  computed,
  ref,
  onMounted,
  onBeforeUnmount,
  reactive,
} from "vue-demi";
import { CellAreasDao, getAreaRectStyle } from "../model/cell-area";
import { copy2Clipboard, json2Csv, csv2Json } from "../utils/process";
import "../theme-chalk/cell-area.scss";

export type UseMountParams = {
  isParentMounted: Ref<boolean>;
  getTableBodyConatiner: () => HTMLElement | null;
  getCellAreaContainer: () => HTMLElement | null;
};

const useMount = (params: UseMountParams) => {
  const { isParentMounted, getTableBodyConatiner, getCellAreaContainer } = params;

  const mount = () => {
    const tableContainer: HTMLElement | null = getTableBodyConatiner();
    const areaContainer: HTMLElement | null = getCellAreaContainer();

    if (!tableContainer || !areaContainer || tableContainer.contains(areaContainer)) return;
    tableContainer.style.position = "relative";
    tableContainer.appendChild(areaContainer);
  };

  watchEffect(() => {
    if (isParentMounted.value) {
      mount();
    }
  });
};

export default defineComponent({
  name: "CellArea",
  props: {
    isTableMounted: {
      default: false,
      type: Boolean,
    },
    getTableBodyContainer: {
      default: null,
      type: Function as PropType<() => HTMLElement | null>,
    },
    mouseEnteredCell: {
      default: null,
      type: Object as PropType<CellOption>,
    },
    dataSource: {
      default: () => [] as unknown[],
      type: Array,
    },
    columns: {
      default: () => [] as ColumnOption[],
      type: Array as PropType<ColumnOption[]>,
    },
    rowKey: String,
    columnKey: String,
    expandRowKeys: Array as PropType<string[]>,
    getCellValue: Function,
    setCellValue: Function,
  },
  setup(props) {
    const areaRef = ref(null);

    const isParentMounted = computed(() => props.isTableMounted);
    const getCellAreaContainer = () => areaRef.value;

    useMount({
      isParentMounted: isParentMounted,
      getTableBodyConatiner: props.getTableBodyContainer,
      getCellAreaContainer,
    });

    const currentCell = computed(() => props.mouseEnteredCell);
    const cellAreas = reactive(new CellAreasDao()) as CellAreasDao;

    watchEffect(() => {
      const { dataSource, rowKey, columnKey, columns, expandRowKeys } = props;
      cellAreas.setTableInfo({ dataSource, columns, rowKey, columnKey, expandRowKeys });
    });

    const selectCellStyle = computed(() => getAreaRectStyle(cellAreas.getSelectCellRect()));
    const mainAreaStyle = computed(() => getAreaRectStyle(cellAreas.mainArea.getLayout().rect));
    const extensionAreaStyle = computed(() => getAreaRectStyle(cellAreas.extensionArea.getLayout().rect));
    const copyAreaStyle = computed(() => getAreaRectStyle(cellAreas.copyArea.getLayout().rect));

    const extended = computed(() => {
      const [start, end] = cellAreas.mainArea.getIndices();
      if (!start || !end) return false;
      const rowSpan = end[0] - start[0];
      const colSpan = end[1] - start[1];
      return rowSpan > 1 || colSpan > 1;
    });

    const pureExtensionAreaValues = computed(() => cellAreas.getPureExtensionAreaValues());

    const extensionAreaTip = computed(() => {
      if (!pureExtensionAreaValues.value) return null;
      return cellAreas.getPureExtensionAreaTip(pureExtensionAreaValues.value.values);
    });

    const handleMousedown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (cellAreas.mainArea.isDragging() === true || !currentCell.value || !currentCell.value.cell.contains(target)) {
        return;
      }
      cellAreas.mainArea.setDragging(true);
      cellAreas.setSelectCell(currentCell.value);
      cellAreas.setMainArea();
    };

    const handleDragBtnMousedown = () => {
      cellAreas.extensionArea.setDragging(true);
    };

    const handleMousemove = () => {
      if (cellAreas.mainArea.isDragging()) {
        cellAreas.setMainArea(currentCell.value?.cell);
        return;
      }
      if (cellAreas.extensionArea.isDragging()) {
        cellAreas.setExtensionArea(currentCell.value?.cell);
        return;
      }
    };

    const handleMouseup = () => {
      if (cellAreas.mainArea.isDragging()) {
        cellAreas.mainArea.setDragging(false);
        return;
      }

      if (cellAreas.extensionArea.isDragging()) {
        cellAreas.extensionArea.setDragging(false);
        if (!pureExtensionAreaValues.value) return;
        const { indices, values } = pureExtensionAreaValues.value;

        cellAreas.setCellsData(indices[0], values);
        cellAreas.mainArea.setAreaFrom(cellAreas.extensionArea.area);
        cellAreas.extensionArea.clear();
        return;
      }

      cellAreas.setSelectCell(null);
      cellAreas.mainArea.clear();
    };

    const handleCopy = () => {
      const data = cellAreas.mainArea.getData().values;
      if (!data?.length) return;

      copy2Clipboard(json2Csv(data));

      cellAreas.copyArea.setDragging(true);
      cellAreas.setCopyArea();
      cellAreas.mainArea.clear();

      cellAreas.setSelectCell(null);
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (!cellAreas.selectCell) return;

      const clipboardData = csv2Json(event.clipboardData);
      if (!clipboardData) return;
      const indices = cellAreas.setCellsData(cellAreas.selectCell?.cell as unknown as HTMLElement, clipboardData);
      if (!indices) return;
      cellAreas.setMainArea(indices[1]);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (!cellAreas.selectCell) return;
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 67) {
        handleCopy();
      }
    };

    const handleDbClick = () => {
      cellAreas.setSelectCell(null);
      cellAreas.mainArea.clear();
      cellAreas.extensionArea.clear();
      cellAreas.copyArea.clear();
    };

    onMounted(() => {
      window.addEventListener("mousedown", handleMousedown);
      window.addEventListener("mousemove", handleMousemove);
      window.addEventListener("mouseup", handleMouseup);
      window.addEventListener("keydown", handleKeydown);
      document.addEventListener("paste", handlePaste);
      window.addEventListener("dblclick", handleDbClick);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("mousedown", handleMousedown);
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("mouseup", handleMouseup);
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("dblclick", handleDbClick);
      document.removeEventListener("paste", handlePaste);
    });

    return {
      areaRef,
      cellAreas,
      handleDragBtnMousedown,
      extensionAreaTip,
      selectCellStyle,
      mainAreaStyle,
      extensionAreaStyle,
      copyAreaStyle,
      extended,
      pureExtensionAreaValues,
    };
  },
});
</script>
