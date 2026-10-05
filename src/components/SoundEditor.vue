<script setup>
import { computed } from "vue";
import { instruments } from "../data/instruments";
import RotaryKnob from "./RotaryKnob.vue";

const props = defineProps({
  selectedTrack: { type: String, required: true },
  params: { type: Object, required: true },
  meterLevel: { type: Number, default: 0 },
});

const emit = defineEmits(["update-param", "select-track", "preview"]);

const currentIndex = computed(() =>
  instruments.findIndex((item) => item.id === props.selectedTrack),
);
const current = computed(
  () => instruments[currentIndex.value] ?? instruments[0],
);

function move(direction) {
  const next =
    (currentIndex.value + direction + instruments.length) % instruments.length;
  emit("select-track", instruments[next].id);
}

function update(key, value) {
  emit("update-param", key, value);
}

const waveformBars = computed(() =>
  Array.from({ length: 54 }, (_, i) => {
    const decay = Math.exp(-i / 11);
    const wave = Math.abs(Math.sin(i * 1.37));
    return Math.max(2, Math.round((wave * 32 + 5) * decay));
  }),
);

const meterBars = computed(() =>
  Array.from({ length: 9 }, (_, i) => {
    const shape = [0.42, 0.68, 0.34, 0.78, 0.47, 0.61, 0.38, 0.72, 0.5][i];
    return Math.max(
      8,
      Math.round((0.12 + props.meterLevel * 0.88) * shape * 100),
    );
  }),
);
</script>

<template>
  <section class="panel sound-editor" aria-label="Редактор звука">
    <div class="editor-left">
      <div class="editor-title-row">
        <button class="preview-name" type="button" @click="emit('preview')">
          <span
            class="track-dot"
            :style="{ backgroundColor: current.color }"
          ></span>
          <strong>{{ current.name }}</strong>
        </button>
        <div class="instrument-nav">
          <button type="button" aria-label="Предыдущий звук" @click="move(-1)">
            ‹
          </button>
          <button type="button" aria-label="Следующий звук" @click="move(1)">
            ›
          </button>
        </div>
      </div>

      <button
        class="waveform"
        type="button"
        aria-label="Прослушать звук"
        @click="emit('preview')"
      >
        <span class="wave-start"></span>
        <span class="wave-dots" aria-hidden="true"><i></i><i></i></span>
        <span class="wave-bars" aria-hidden="true">
          <i
            v-for="(height, index) in waveformBars"
            :key="index"
            :style="{ height: `${height}px`, backgroundColor: current.color }"
          ></i>
        </span>
      </button>
    </div>

    <div class="knob-bank">
      <RotaryKnob
        :model-value="params.gain"
        :min="0"
        :max="1"
        :step="0.01"
        label="Усиление"
        :accent="current.color"
        @update:model-value="update('gain', $event)"
      />
      <RotaryKnob
        :model-value="params.pitch"
        :min="-24"
        :max="24"
        :step="1"
        label="Высота"
        accent="#7b9fc5"
        @update:model-value="update('pitch', $event)"
      />
      <RotaryKnob
        :model-value="params.decay"
        :min="0.04"
        :max="1.6"
        :step="0.01"
        label="Затухание"
        accent="#91a58b"
        @update:model-value="update('decay', $event)"
      />
      <RotaryKnob
        :model-value="params.filter"
        :min="300"
        :max="18000"
        :step="100"
        label="Фильтр"
        accent="#d2b171"
        @update:model-value="update('filter', $event)"
      />
    </div>

    <div class="output-meter">
      <span>Выход</span>
      <div class="meter-bars" aria-label="Уровень выхода">
        <i
          v-for="(height, index) in meterBars"
          :key="index"
          :style="{ height: `${height}%` }"
        ></i>
      </div>
    </div>
  </section>
</template>
