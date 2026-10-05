<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import TransportBar from "./components/TransportBar.vue";
import SequencerGrid from "./components/SequencerGrid.vue";
import SoundEditor from "./components/SoundEditor.vue";
import AuthorMark from "./components/AuthorMark.vue";
import { defaultParams, makeDefaultPatterns } from "./data/instruments";
import { DrumEngine } from "./audio/engine";

const STORAGE_KEY = "drmachine-state-v1";
const engine = new DrumEngine();

const state = reactive({
  bpm: 120,
  swing: 0.18,
  volume: 0.72,
  activePattern: "А",
  selectedTrack: "kick",
  patterns: makeDefaultPatterns(),
  params: structuredClone(defaultParams),
});

const playing = ref(false);
const currentStep = ref(-1);
const meterLevel = ref(0);
const audioError = ref("");
let meterFrame = 0;

const activePatternData = computed(() => state.patterns[state.activePattern]);
const selectedParams = computed(() => state.params[state.selectedTrack]);

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bpm: state.bpm,
        swing: state.swing,
        volume: state.volume,
        activePattern: state.activePattern,
        selectedTrack: state.selectedTrack,
        patterns: state.patterns,
        params: state.params,
      }),
    );
  } catch {
    // localStorage может быть недоступен в приватном режиме; приложение продолжает работать.
  }
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (typeof saved.bpm === "number") state.bpm = saved.bpm;
    if (typeof saved.swing === "number") state.swing = saved.swing;
    if (typeof saved.volume === "number") state.volume = saved.volume;
    if (saved.activePattern && state.patterns[saved.activePattern])
      state.activePattern = saved.activePattern;
    if (saved.selectedTrack && state.params[saved.selectedTrack])
      state.selectedTrack = saved.selectedTrack;
    if (saved.patterns) state.patterns = saved.patterns;
    if (saved.params)
      state.params = { ...structuredClone(defaultParams), ...saved.params };
  } catch {
    // Повреждённое состояние просто игнорируется.
  }
}

function toggleStep(trackId, index) {
  const row = state.patterns[state.activePattern]?.[trackId];
  if (!row) return;
  row[index] = !row[index];
  if (row[index]) previewTrack(trackId);
}

function selectTrack(trackId) {
  if (state.params[trackId]) state.selectedTrack = trackId;
}

function selectPattern(pattern) {
  if (state.patterns[pattern]) state.activePattern = pattern;
}

function updateParam(key, value) {
  if (!selectedParams.value || !(key in selectedParams.value)) return;
  selectedParams.value[key] = value;
}

async function previewTrack(trackId = state.selectedTrack) {
  try {
    audioError.value = "";
    await engine.preview(trackId, state.params[trackId]);
  } catch (error) {
    audioError.value = error?.message || "Не удалось запустить звук";
  }
}

async function start() {
  try {
    audioError.value = "";
    engine.setBpm(state.bpm);
    engine.setSwing(state.swing);
    engine.setMasterVolume(state.volume);
    await engine.start();
    playing.value = true;
  } catch (error) {
    audioError.value = error?.message || "Не удалось запустить звук";
  }
}

function stop() {
  engine.stop();
  playing.value = false;
  currentStep.value = -1;
}

function meterLoop() {
  const target = engine.getLevel();
  meterLevel.value += (target - meterLevel.value) * 0.22;
  meterFrame = requestAnimationFrame(meterLoop);
}

watch(
  () => state.bpm,
  (value) => engine.setBpm(value),
);
watch(
  () => state.swing,
  (value) => engine.setSwing(value),
);
watch(
  () => state.volume,
  (value) => engine.setMasterVolume(value),
);
watch(state, persist, { deep: true });

onMounted(() => {
  restore();
  engine.configure({
    getPattern: () => state.patterns[state.activePattern],
    getParams: (trackId) => state.params[trackId],
    onStep: (step) => {
      currentStep.value = step;
    },
  });
  engine.setBpm(state.bpm);
  engine.setSwing(state.swing);
  engine.setMasterVolume(state.volume);
  meterLoop();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(meterFrame);
  engine.destroy();
});
</script>

<template>
  <main class="app-shell">
    <div class="machine-frame">
      <Transition name="error-fade">
        <button
          v-if="audioError"
          class="audio-error"
          type="button"
          @click="audioError = ''"
        >
          {{ audioError }}
        </button>
      </Transition>

      <TransportBar
        :playing="playing"
        :bpm="state.bpm"
        :swing="state.swing"
        :volume="state.volume"
        @play="start"
        @stop="stop"
        @update:bpm="state.bpm = $event"
        @update:swing="state.swing = $event"
        @update:volume="state.volume = $event"
      />

      <SequencerGrid
        :pattern="activePatternData"
        :active-pattern="state.activePattern"
        :selected-track="state.selectedTrack"
        :current-step="currentStep"
        @toggle-step="toggleStep"
        @select-track="selectTrack"
        @select-pattern="selectPattern"
      />

      <SoundEditor
        :selected-track="state.selectedTrack"
        :params="selectedParams"
        :meter-level="meterLevel"
        @update-param="updateParam"
        @select-track="selectTrack"
        @preview="previewTrack()"
      />
    </div>
  </main>

  <AuthorMark />
</template>
