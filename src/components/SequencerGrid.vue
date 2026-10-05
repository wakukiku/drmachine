<script setup>
import { instruments } from "../data/instruments";

defineProps({
  pattern: { type: Object, required: true },
  activePattern: { type: String, required: true },
  selectedTrack: { type: String, required: true },
  currentStep: { type: Number, default: -1 },
});

const emit = defineEmits(["toggle-step", "select-track", "select-pattern"]);
const banks = ["А", "Б", "В", "Г"];
</script>

<template>
  <section class="panel sequencer" aria-label="Шаговый секвенсор">
    <div class="sequencer-scroll">
      <div class="sequencer-inner">
        <div class="sequencer-head">
          <div class="steps-title">Шаги 1–16</div>
          <div class="step-numbers" aria-hidden="true">
            <span v-for="n in 16" :key="n">{{ n }}</span>
          </div>
          <div class="pattern-switcher" aria-label="Паттерн">
            <button
              v-for="bank in banks"
              :key="bank"
              type="button"
              :class="{ active: activePattern === bank }"
              :aria-pressed="activePattern === bank"
              @click="emit('select-pattern', bank)"
            >
              {{ bank }}
            </button>
          </div>
        </div>

        <div class="track-list">
          <div
            v-for="track in instruments"
            :key="track.id"
            class="track-row"
            :class="{ selected: selectedTrack === track.id }"
          >
            <button
              class="track-label"
              type="button"
              :aria-pressed="selectedTrack === track.id"
              @click="emit('select-track', track.id)"
            >
              <span
                class="track-dot"
                :style="{ backgroundColor: track.color }"
              ></span>
              <span>{{ track.name }}</span>
            </button>

            <div class="step-grid">
              <button
                v-for="(enabled, index) in pattern[track.id]"
                :key="index"
                type="button"
                class="step-pad"
                :class="[
                  `step-${track.className}`,
                  { enabled, playing: currentStep === index },
                ]"
                :aria-label="`${track.name}, шаг ${index + 1}, ${enabled ? 'включён' : 'выключен'}`"
                :aria-pressed="enabled"
                @click="emit('toggle-step', track.id, index)"
              >
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
