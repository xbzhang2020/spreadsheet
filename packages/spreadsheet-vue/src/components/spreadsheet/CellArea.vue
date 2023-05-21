<template>
  <div ref="areaRef" class="spread-cell-area">
    <div class="spread-cell-area-main" :style="getCellAreaStyle(cellAreas.main)">
      <div class="spread-cell-area-main-btn" @mousedown.stop="handleDragBtnMousedown"></div>
    </div>
    <div class="spread-cell-area-extension" :style="getCellAreaStyle(cellAreas.extension)"></div>
    <div class="spread-cell-area-copy"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watchEffect, Ref, computed, ref, onMounted, onBeforeUnmount, reactive } from "vue";
import { createCellAreas, getCellAreaStyle } from "../../model/cell-area";

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
    isParentMounted: {
      required: true,
      type: Boolean,
    },
    getTableBodyContainer: {
      required: true,
      type: Function as PropType<() => Element>,
    },
    dataSource: {
      default: null,
      type: Object as PropType<TableInfo>,
    },
    mouseEnteredCell: {
      default: null,
      type: Object as PropType<CellInfo>,
    },
  },
  setup(props) {
    const areaRef = ref(null);

    const isParentMounted = computed(() => props.isParentMounted);
    const getCellAreaContainer = () => {
      return areaRef.value;
    };

    useMount({
      isParentMounted: isParentMounted,
      getTableBodyConatiner: props.getTableBodyContainer,
      getCellAreaContainer: getCellAreaContainer,
    });

    const cellAreas = reactive(createCellAreas());
    const currentCell: Ref<CellInfo> = ref(null);
    const selectedCell: Ref<CellInfo> = ref(null);

    watchEffect(() => {
      currentCell.value = props.mouseEnteredCell;
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
        // console.log(cellAreas.extension.rect)
        return;
      }
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
    };

    const handleDbClick = () => {
      cellAreas.clearArea(cellAreas.main);
      cellAreas.clearArea(cellAreas.extension);
    };

    onMounted(() => {
      window.addEventListener("mousedown", handleMousedown);
      window.addEventListener("mousemove", handleMousemove);
      window.addEventListener("click", handleClick);
      window.addEventListener("dblclick", handleDbClick);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("mousedown", handleMousedown);
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("dblclick", handleDbClick);
    });

    return { areaRef, cellAreas, getCellAreaStyle, handleDragBtnMousedown };
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
  &-extension {
    position: absolute;
    border: 1px dashed #0a70f5;
    pointer-events: none;
    z-index: 1;
  }
}
</style>
