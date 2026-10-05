<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 1 },
  step: { type: Number, default: 0.01 },
  label: { type: String, required: true },
  accent: { type: String, default: "#91a58b" },
});

const emit = defineEmits(["update:modelValue"]);
const dragging = ref(false);
let startY = 0;
let startValue = 0;

const ratio = computed(
  () => (props.modelValue - props.min) / (props.max - props.min),
);
const angle = computed(() => -135 + ratio.value * 270);
const arc = computed(() => `${ratio.value * 75}%`);

const rounded = (value) => {
  const precision = `${props.step}`.includes(".")
    ? `${props.step}`.split(".")[1].length
    : 0;
  return Number(value.toFixed(precision));
};

function setValue(value) {
  emit(
    "update:modelValue",
    rounded(Math.min(props.max, Math.max(props.min, value))),
  );
}

function onPointerDown(event) {
  dragging.value = true;
  startY = event.clientY;
  startValue = props.modelValue;
  event.currentTarget.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!dragging.value) return;
  const delta = (startY - event.clientY) / 150;
  setValue(startValue + delta * (props.max - props.min));
}

function onPointerUp(event) {
  dragging.value = false;
  if (event.currentTarget.hasPointerCapture?.(event.pointerId))
    event.currentTarget.releasePointerCapture(event.pointerId);
}

function onKey(event) {
  if (event.key === "ArrowUp" || event.key === "ArrowRight") {
    event.preventDefault();
    setValue(props.modelValue + props.step);
  }
  if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
    event.preventDefault();
    setValue(props.modelValue - props.step);
  }
  if (event.key === "Home") {
    event.preventDefault();
    setValue(props.min);
  }
  if (event.key === "End") {
    event.preventDefault();
    setValue(props.max);
  }
}
</script>

<template>
  <div class="knob-control">
    <div
      class="knob"
      :class="{ dragging }"
      role="slider"
      tabindex="0"
      :aria-label="label"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="modelValue"
      :style="{ '--accent': accent, '--arc': arc }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKey"
    >
      <div class="knob-face">
        <span
          class="knob-tick"
          :style="{ transform: `rotate(${angle}deg)` }"
        ></span>
      </div>
    </div>
    <span class="knob-label">{{ label }}</span>
  </div>
</template>
