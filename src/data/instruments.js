export const instruments = [
  { id: "kick", name: "Бочка", color: "#e49a8f", className: "coral" },
  { id: "snare", name: "Малый", color: "#8faecc", className: "blue" },
  { id: "clap", name: "Хлопок", color: "#d9b56f", className: "sand" },
  { id: "hat", name: "Хэт", color: "#91a58b", className: "sage" },
  { id: "perc", name: "Перкуссия", color: "#b19acb", className: "lavender" },
  { id: "bass", name: "Бас", color: "#7599c4", className: "deepblue" },
];

export const defaultParams = {
  kick: { gain: 0.86, pitch: 0, decay: 0.48, filter: 10500 },
  snare: { gain: 0.64, pitch: 0, decay: 0.26, filter: 9000 },
  clap: { gain: 0.55, pitch: 0, decay: 0.18, filter: 7600 },
  hat: { gain: 0.34, pitch: 0, decay: 0.08, filter: 12500 },
  perc: { gain: 0.46, pitch: 2, decay: 0.22, filter: 9800 },
  bass: { gain: 0.58, pitch: -5, decay: 0.42, filter: 2200 },
};

const empty = () => Array(16).fill(false);

const patternA = {
  kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
  snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
  clap: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0].map(Boolean),
  hat: Array(16).fill(true),
  perc: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
  bass: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0].map(Boolean),
};

export function makeDefaultPatterns() {
  return {
    А: structuredClone(patternA),
    Б: Object.fromEntries(instruments.map((i) => [i.id, empty()])),
    В: Object.fromEntries(instruments.map((i) => [i.id, empty()])),
    Г: Object.fromEntries(instruments.map((i) => [i.id, empty()])),
  };
}
