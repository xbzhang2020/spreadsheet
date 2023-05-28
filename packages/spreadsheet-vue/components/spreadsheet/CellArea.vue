<template>
  <div ref="areaRef" class="spread-cell-area">
    <div class="spread-cell-area-main" :style="getAreaRectStyle(cellAreas.main.coord.rect)">
      <div class="spread-cell-area-main-btn" @mousedown.stop="handleDragBtnMousedown"></div>
    </div>
    <div class="spread-cell-area-extension" :style="getAreaRectStyle(cellAreas.extension.coord.rect)"></div>
    <div v-if="extensionAreaTip" class="spread-cell-area-extension-tip" :style="extensionAreaTip.style">
      {{ extensionAreaTip.value }}
    </div>
    <div v-if="extendedAreaStyle" class="spread-cell-area-main-extended" :style="extendedAreaStyle"></div>
    <div class="spread-cell-area-copy"></div>
    <div class="spread-cell-area-selected" :style="selectedCellStyle"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watchEffect, Ref, computed, ref, onMounted, onBeforeUnmount, reactive } from "vue";
import { createCellAreas, getCellExtensionAreaTip, getElementRect, getAreaRectStyle } from "../../model/cell-area";

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
    tableInfo: {
      required: true,
      type: Object as PropType<TableInfo>,
    },
  },
  setup(props) {
    const areaRef = ref(null);

    const isParentMounted = computed(() => props.tableInfo.isMounted);
    const getCellAreaContainer = () => {
      return areaRef.value;
    };

    useMount({
      isParentMounted: isParentMounted,
      getTableBodyConatiner: props.tableInfo.getTableBodyContainer,
      getCellAreaContainer: getCellAreaContainer,
    });

    const cellAreas = reactive(createCellAreas());

    watchEffect(() => {
      cellAreas.setTableInfo(props.tableInfo);
    });

    const currentCell: Ref<CellInfo> = ref(null);
    const selectedCell: Ref<CellInfo> = ref(null);
    const pureExtensionAreaData: Ref<CellAreaData> = ref(null);
    const showExtendedArea = ref(false);
    const extendedAreaStyle = ref(null);
    const selectedCellStyle = ref(null);

    const extensionAreaTip = computed(() =>
      getCellExtensionAreaTip(cellAreas.extension, pureExtensionAreaData.value?.values)
    );

    watchEffect(() => {
      currentCell.value = props.tableInfo.mouseEnteredCell;
    });

    const handleMousedown = (event: MouseEvent) => {
      showExtendedArea.value = false;
      const target = event.target as HTMLElement;
      if (cellAreas.main.drag.dragging || !currentCell.value || !currentCell.value.cell.contains(target)) {
        return;
      }
      cellAreas.main.drag.dragging = true;
      selectedCell.value = currentCell.value;
      cellAreas.setMainArea(selectedCell.value);
      extendedAreaStyle.value = null;
      selectedCellStyle.value = getAreaRectStyle(getElementRect(selectedCell.value.cell));
    };

    const handleDragBtnMousedown = () => {
      cellAreas.extension.drag.dragging = true;
      cellAreas.setExtensionArea(currentCell.value);
    };

    const handleMousemove = () => {
      if (cellAreas.main.drag.dragging) {
        cellAreas.setMainArea(selectedCell.value, currentCell.value);
        return;
      }
      if (cellAreas.extension.drag.dragging) {
        cellAreas.setExtensionArea(currentCell.value);
        pureExtensionAreaData.value = cellAreas.getPureExtensionAreaData();
        return;
      }
    };

    const handleMouseup = () => {
      if (!cellAreas.extension.drag.dragging) return;

      const startCell: CellInfo = {
        row: pureExtensionAreaData.value.rows[0],
        column: pureExtensionAreaData.value.columns[0],
        cell: null,
      };

      cellAreas.setAreaCells(startCell, pureExtensionAreaData.value.values);
      cellAreas.extendMainArea();
      showExtendedArea.value = true;
      extendedAreaStyle.value = getAreaRectStyle(cellAreas.main.coord.rect);

      cellAreas.clearArea(cellAreas.extension);
    };

    const handleClick = () => {
      if (cellAreas.main.drag.dragging) {
        cellAreas.main.drag.dragging = false;
        return;
      }

      if (cellAreas.extension.drag.dragging) {
        cellAreas.extension.drag.dragging = false;
        return;
      }
      cellAreas.clearArea(cellAreas.main);
      extendedAreaStyle.value = null;
      showExtendedArea.value = false;
      selectedCellStyle.value = false;
    };

    const handleDbClick = () => {
      cellAreas.clearArea(cellAreas.main);
      cellAreas.clearArea(cellAreas.extension);
    };

    onMounted(() => {
      window.addEventListener("mousedown", handleMousedown);
      window.addEventListener("mousemove", handleMousemove);
      window.addEventListener("mouseup", handleMouseup);
      window.addEventListener("click", handleClick);
      window.addEventListener("dblclick", handleDbClick);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("mousedown", handleMousedown);
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("mouseup", handleMouseup);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("dblclick", handleDbClick);
    });

    return {
      areaRef,
      cellAreas,
      handleDragBtnMousedown,
      extensionAreaTip,
      pureExtensionAreaData,
      showExtendedArea,
      extendedAreaStyle,
      selectedCellStyle,
      getAreaRectStyle,
    };
  },
});
</script>

<style lang="scss">
.spread-cell-area {
  &-main {
    position: absolute;
    border: 1px solid #0a70f5;
    user-select: none;
    pointer-events: none;
    z-index: 2;
    box-sizing: border-box;
  }
  &-main-btn {
    width: 6px;
    height: 6px;
    position: absolute;
    bottom: -1px;
    right: -1px;
    background-color: #0a70f5;
    border-top-left-radius: 2px;
    pointer-events: auto;
    cursor: crosshair;
  }
  &-main-extended {
    position: absolute;
    background-color: #0a70f52e;
    z-index: 1;
    pointer-events: none;
  }
  &-selected {
    position: absolute;
    border: 2px solid #0a70f5;
    z-index: 1;
    box-sizing: border-box;
  }
  &-extension {
    position: absolute;
    border: 1px dashed #0a70f5;
    pointer-events: none;
    z-index: 1;
    box-sizing: border-box;
  }
  &-extension-tip {
    position: absolute;
    background-color: #000;
    height: 22px;
    min-width: 30px;
    color: #fff;
    text-align: center;
    font-size: 12px;
    line-height: 22px;
    border-radius: 3px;
    z-index: 1;
  }
}
</style>
