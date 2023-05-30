<template>
  <div ref="areaRef" class="spread-cell-area">
    <div class="spread-cell-area__select" :style="selectCellStyle"></div>
    <div class="spread-cell-area__main" :class="[extended && 'spread-cell-area__main--extended']" :style="mainAreaStyle">
      <div class="spread-cell-area__main-btn" @mousedown.stop="handleDragBtnMousedown"></div>
    </div>
    <div class="spread-cell-area__extension" :style="extensionAreaStyle"></div>
    <div v-if="extensionAreaTip" class="spread-cell-area__extension-tip" :style="extensionAreaTip.style">
      {{ extensionAreaTip.value }}
    </div>
    <div class="spread-cell-area__copy"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watchEffect, Ref, computed, ref, onMounted, onBeforeUnmount, reactive } from "vue";
import { createCellAreas, getCellExtensionAreaTip } from "../model/cell-area";

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

    const handleDbClick = () => {
      cellAreas.clearMainArea();
      cellAreas.clearExtensionArea();
    };

    onMounted(() => {
      window.addEventListener("mousedown", handleMousedown);
      window.addEventListener("mousemove", handleMousemove);
      window.addEventListener("mouseup", handleMouseup);
      window.addEventListener("dblclick", handleDbClick);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("mousedown", handleMousedown);
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("mouseup", handleMouseup);
      window.removeEventListener("dblclick", handleDbClick);
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
      extended,
    };
  },
});
</script>

<style lang="scss">
.spread-cell-area {
  pointer-events: none;
  &__select {
    position: absolute;
    border: 2px solid #0a70f5;
    z-index: 3;
    box-sizing: border-box;
  }
  &__main {
    position: absolute;
    border: 1px solid #0a70f5;
    user-select: none;
    z-index: 3;
    box-sizing: border-box;
    &--extended {
      background-color: #0a70f52e;
    }
  }
  &__main-btn {
    width: 6px;
    height: 6px;
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: #0a70f5;
    pointer-events: auto;
    cursor: crosshair;
  }
  &__extension {
    position: absolute;
    border: 1px dashed #0a70f5;
    z-index: 1;
    box-sizing: border-box;
  }
  &__extension-tip {
    position: absolute;
    background-color: #000;
    height: 22px;
    min-width: 30px;
    color: #fff;
    text-align: center;
    font-size: 12px;
    line-height: 22px;
    border-radius: 3px;
    z-index: 3;
  }
}
</style>
