<template>
  <div ref="areaRef" class="spread-cell-area">
    <div class="spread-cell-area-select" :style="selectCellStyle"></div>
    <div class="spread-cell-area-main" :class="[extended && 'spread-cell-area-main-extended']" :style="mainAreaStyle">
      <div class="spread-cell-area-main-btn" @mousedown.stop="handleDragBtnMousedown"></div>
    </div>
    <div class="spread-cell-area-extension" :style="extensionAreaStyle"></div>
    <div v-if="extensionAreaTip" class="spread-cell-area-extension-tip" :style="extensionAreaTip.style">
      {{ extensionAreaTip.value }}
    </div>
    <div class="spread-cell-area-copy"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watchEffect, Ref, computed, ref, onMounted, onBeforeUnmount, reactive } from "vue";
import { createCellAreas, getCellExtensionAreaTip } from "../../model/cell-area";

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
    const getCellAreaContainer = () => areaRef.value;

    useMount({
      isParentMounted: isParentMounted,
      getTableBodyConatiner: props.tableInfo.getTableBodyContainer,
      getCellAreaContainer,
    });

    const currentCell = computed(() => props.tableInfo.mouseEnteredCell);
    const cellAreas = reactive(createCellAreas());
    watchEffect(() => {
      cellAreas.setTableInfo(props.tableInfo);
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
      if (cellAreas.main.drag.dragging || !currentCell.value || !currentCell.value.cell.contains(target)) {
        return;
      }
      cellAreas.main.drag.dragging = true;
      cellAreas.setSelectCell(currentCell.value);
      cellAreas.setMainArea(null);
    };

    const handleDragBtnMousedown = () => {
      cellAreas.extension.drag.dragging = true;
    };

    const handleMousemove = () => {
      if (cellAreas.main.drag.dragging) {
        cellAreas.setMainArea(currentCell.value);
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
      cellAreas.clearExtensionArea();
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
    pointer-events: auto;
    cursor: crosshair;
  }
  &-main-extended {
    background-color: #0a70f52e;
  }
  &-select {
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
