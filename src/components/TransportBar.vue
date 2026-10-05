<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  playing: Boolean,
  bpm: { type: Number, default: 120 },
  swing: { type: Number, default: 0.18 },
  volume: { type: Number, default: 0.72 },
});

const emit = defineEmits([
  "play",
  "stop",
  "update:bpm",
  "update:swing",
  "update:volume",
]);

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const bpmDraft = ref(String(props.bpm));

watch(
  () => props.bpm,
  (value) => {
    bpmDraft.value = String(value);
  },
);

function commitBpm(value = bpmDraft.value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    bpmDraft.value = String(props.bpm);
    return;
  }

  const next = clamp(parsed, 60, 200);
  bpmDraft.value = String(next);
  emit("update:bpm", next);
}

function nudgeBpm(delta) {
  const draftValue = Number.parseInt(bpmDraft.value, 10);
  const current = Number.isFinite(draftValue) ? draftValue : props.bpm;
  const next = clamp(current + delta, 60, 200);
  bpmDraft.value = String(next);
  emit("update:bpm", next);
}

function handleBpmWheel(event) {
  nudgeBpm(event.deltaY < 0 ? 1 : -1);
}

function handleBpmKeydown(event) {
  if (event.key === "Enter") {
    commitBpm();
    event.currentTarget.blur();
  }
}
</script>

<template>
  <section class="panel transport" aria-label="Управление воспроизведением">
    <div class="transport-actions">
      <button
        class="round-control play"
        type="button"
        :aria-label="playing ? 'Пауза' : 'Воспроизвести'"
        @click="playing ? emit('stop') : emit('play')"
      >
        <svg v-if="!playing" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5.8v12.4L18 12 8 5.8Z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 6h4v12H7zM13 6h4v12h-4z" />
        </svg>
      </button>
      <button
        class="round-control stop"
        type="button"
        aria-label="Остановить"
        @click="emit('stop')"
      >
        <span></span>
      </button>
    </div>

    <div class="transport-divider" aria-hidden="true"></div>

    <div class="tempo-group control-group">
      <span class="control-label">Темп</span>
      <div class="tempo-stepper" @wheel.prevent="handleBpmWheel">
        <input
          v-model="bpmDraft"
          class="tempo-input"
          type="number"
          inputmode="numeric"
          min="60"
          max="200"
          step="1"
          aria-label="Темп в ударах в минуту"
          @blur="commitBpm()"
          @keydown="handleBpmKeydown"
        />
        <div class="stepper-buttons" aria-hidden="false">
          <button
            type="button"
            aria-label="Увеличить темп"
            @click="nudgeBpm(1)"
          >
            ⌃
          </button>
          <button
            type="button"
            aria-label="Уменьшить темп"
            @click="nudgeBpm(-1)"
          >
            ⌄
          </button>
        </div>
      </div>
      <span class="unit">уд/мин</span>
    </div>

    <div class="transport-divider" aria-hidden="true"></div>

    <label class="control-group slider-group">
      <span class="control-label">Свинг</span>
      <input
        class="soft-slider"
        type="range"
        min="0"
        max="0.45"
        step="0.01"
        :value="swing"
        :style="{ '--fill': `${(swing / 0.45) * 100}%` }"
        @input="emit('update:swing', Number($event.target.value))"
      />
      <output class="value-readout">{{ Math.round(swing * 100) }}%</output>
    </label>

    <div class="transport-divider" aria-hidden="true"></div>

    <label class="control-group slider-group volume-group">
      <span class="control-label">Громкость</span>
      <input
        class="soft-slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="volume"
        :style="{ '--fill': `${volume * 100}%` }"
        @input="emit('update:volume', Number($event.target.value))"
      />
    </label>
  </section>
</template>
