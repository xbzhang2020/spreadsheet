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
import { defineComponent, PropType, watchEffect, Ref, computed, ref, onMounted, onBeforeUnmount, reactive } from "vue";
import { createCellAreas, getCellExtensionAreaTip } from "../model/cell-area";
import { copy2Clipboard, json2Csv, csv2Json } from "../utils/process";

const useMount = (params: {
  isParentMounted: Ref<boolean>;
  getTableBodyConatiner: Function;
  getCellAreaContainer: Function;
}) => {
  const { isParentMounted, getTableBodyConatiner, getCellAreaContainer } = params;

  const mount = () => {
    const tableContainer: HTMLElement = getTableBodyConatiner();
    const areaContainer: HTMLElement = getCellAreaContainer();

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
      type: Function,
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
    const cellAreas = reactive(createCellAreas());

    watchEffect(() => {
      const { dataSource, rowKey, columnKey, columns, expandRowKeys } = props;
      cellAreas.setTableInfo({ dataSource, columns, rowKey, columnKey, expandRowKeys });
    });

    const selectCellStyle = computed(() => cellAreas.getSelectCellStyle());
    const mainAreaStyle = computed(() => cellAreas.getMainAreaStyle());
    const extensionAreaStyle = computed(() => cellAreas.getExtensionAreaStyle());
    const copyAreaStyle = computed(() => cellAreas.getCopyAreaStyle());
    const extended = computed(() => cellAreas.isExtended());

    const pureExtensionAreaData: Ref<CellAreaData> = ref(null);
    const extensionAreaTip = computed(() =>
      getCellExtensionAreaTip(cellAreas.extension, pureExtensionAreaData.value?.values)
    );

    const handleMousedown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (cellAreas.getMainAreaDragging() === true || !currentCell.value || !currentCell.value.cell.contains(target)) {
        return;
      }
      cellAreas.setMainAreaDragging(true);
      cellAreas.setSelectCell(currentCell.value);
      cellAreas.setMainArea(null);
    };

    const handleDragBtnMousedown = () => {
      cellAreas.setExtensionAreaDragging(true);
    };

    const handleMousemove = () => {
      if (cellAreas.getMainAreaDragging()) {
        cellAreas.setMainArea(currentCell.value);
        return;
      }
      if (cellAreas.getExtensionAreaDragging()) {
        cellAreas.setExtensionArea(currentCell.value);
        pureExtensionAreaData.value = cellAreas.getPureExtensionAreaData();
        return;
      }
    };

    const handleMouseup = () => {
      if (cellAreas.getMainAreaDragging()) {
        cellAreas.setMainAreaDragging(false);
        return;
      }

      if (cellAreas.getExtensionAreaDragging()) {
        cellAreas.setExtensionAreaDragging(false);

        if (!pureExtensionAreaData.value) return;
        const startCell: CellOption = {
          row: pureExtensionAreaData.value.rows[0],
          column: pureExtensionAreaData.value.columns[0],
          cell: null,
        };

        cellAreas.setAreaCells(startCell, pureExtensionAreaData.value.values);
        cellAreas.extendMainArea();
        cellAreas.clearExtensionArea();
        return;
      }

      cellAreas.setSelectCell(null);
      cellAreas.clearMainArea();
    };

    const handleCopy = () => {
      const data = cellAreas.main.data.values;
      if (!data?.length) return;

      copy2Clipboard(json2Csv(data));

      cellAreas.setCopyAreaDragging(true);
      cellAreas.setCopyArea();
      cellAreas.clearMainArea();
      cellAreas.setSelectCell(null);
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (!cellAreas.selectCell) return;

      const clipboardData = csv2Json(event.clipboardData);
      cellAreas.setAreaCells(cellAreas.selectCell as any, clipboardData);
      // const { columns } = setCellsData(selectedCell.value, clipboardData)
      // currentCell.value = getNextCell(props.getTableCells(), selectedCell.value, columns.length - 1)
      // cellAreas.setMainArea(currentCell.value);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (!cellAreas.selectCell) return;
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 67) {
        handleCopy();
      }
    };

    const handleDbClick = () => {
      cellAreas.setSelectCell(null);
      cellAreas.clearMainArea();
      cellAreas.clearExtensionArea();
      cellAreas.clearCopyArea();
    };

    onMounted(() => {
      window.addEventListener("mousedown", handleMousedown);
      window.addEventListener("mousemove", handleMousemove);
      window.addEventListener("mouseup", handleMouseup);
      window.addEventListener("keydown", handleKeydown);
      document.body.addEventListener("paste", handlePaste);
      window.addEventListener("dblclick", handleDbClick);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("mousedown", handleMousedown);
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("mouseup", handleMouseup);
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("dblclick", handleDbClick);
      document.body.removeEventListener("paste", handlePaste);
    });

    return {
      areaRef,
      cellAreas,
      handleDragBtnMousedown,
      extensionAreaTip,
      pureExtensionAreaData,
      selectCellStyle,
      mainAreaStyle,
      extensionAreaStyle,
      copyAreaStyle,
      extended,
    };
  },
});
</script>

<style lang="scss">
@import "../theme-chalk/cell-area.scss";
</style>
