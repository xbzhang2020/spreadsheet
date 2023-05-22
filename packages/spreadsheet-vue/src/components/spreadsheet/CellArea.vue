<template>
  <div ref="areaRef" class="spread-cell-area">
    <div class="spread-cell-area-main" :style="getCellAreaStyle(cellAreas.main)">
      <div class="spread-cell-area-main-btn" @mousedown.stop="handleDragBtnMousedown"></div>
    </div>
    <div class="spread-cell-area-extension" :style="getCellAreaStyle(cellAreas.extension)"></div>
    <div v-if="extensionAreaTip" class="spread-cell-area-extension-tip" :style="extensionAreaTip.style">
      {{ extensionAreaTip.value }}
    </div>
    <div v-if="showExtendedArea" class="spread-cell-area-main-extended" :style="getCellAreaStyle(extendedArea)"></div>
    <div class="spread-cell-area-copy"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watchEffect, Ref, computed, ref, onMounted, onBeforeUnmount, reactive } from "vue";
import { createCellAreas, getCellAreaStyle, getCellExtensionAreaTip } from "../../model/cell-area";

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
    const extendedArea: Ref<CellArea> = ref(null);
    const showExtendedArea = ref(false);

    const extensionAreaTip = computed(() =>
      getCellExtensionAreaTip(cellAreas.extension, extendedArea.value?.data.values)
    );

    watchEffect(() => {
      currentCell.value = props.tableInfo.mouseEnteredCell;
    });

    const handleMousedown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (cellAreas.main.drag.dragging || !currentCell.value || !currentCell.value.cell.contains(target)) {
        return;
      }
      cellAreas.main.drag.dragging = true;
      selectedCell.value = currentCell.value;
      cellAreas.setMainArea(selectedCell.value);
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
        extendedArea.value = cellAreas.getExtendedArea();
        return;
      }
    };

    const handleMouseup = () => {
      if (!cellAreas.extension.drag.dragging) return;

      const startCell: CellInfo = {
        row: extendedArea.value.data.rows[0],
        column: extendedArea.value.data.columns[0],
        cell: null,
      };
      cellAreas.setAreaCells(startCell, extendedArea.value.data.values);
      cellAreas.extendMainArea();
      cellAreas.clearArea(cellAreas.extension);
    };

    const handleClick = () => {
      showExtendedArea.value = false;

      if (cellAreas.main.drag.dragging) {
        cellAreas.main.drag.dragging = false;
        return;
      }

      if (cellAreas.extension.drag.dragging) {
        showExtendedArea.value = true;
        cellAreas.extension.drag.dragging = false;
        return;
      }
      cellAreas.clearArea(cellAreas.main);
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
      getCellAreaStyle,
      handleDragBtnMousedown,
      extensionAreaTip,
      extendedArea,
      showExtendedArea,
    };
  },
});
</script>

<style lang="scss" scoped>
.spread-cell-area {
  &-main {
    position: absolute;
    border: 1px solid #0a70f5;
    user-select: none;
    pointer-events: none;
    z-index: 1;
  }
  &-main-btn {
    width: 4px;
    height: 4px;
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: #0a70f5;
    border-top-left-radius: 2px;
    pointer-events: auto;
    cursor: crosshair;
  }
  &-main-extended {
    position: absolute;
    background-color: #0a70f52e;
    z-index: 1;
  }
  &-extension {
    position: absolute;
    border: 1px dashed #0a70f5;
    pointer-events: none;
    z-index: 1;
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
