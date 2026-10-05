<template>
  <footer class="author-mark" aria-label="Автор проекта">
    <a
      href="https://github.com/wakukiku"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub wakukiku"
    >
      <span class="author-line" aria-hidden="true"></span>
      <span class="author-name">wakukiku</span>
      <span class="author-line" aria-hidden="true"></span>
    </a>
  </footer>
</template>

<style scoped>
.author-mark {
  position: fixed;
  left: 50%;
  bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 1000;
  transform: translateX(-50%);
  pointer-events: none;
}

.author-mark a {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 10px;
  color: #767b77;
  text-decoration: none;
  mix-blend-mode: normal;
  opacity: 0.5;
  pointer-events: auto;
  transition:
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 300ms ease;
}

.author-line {
  width: 34px;
  height: 1px;
  background: currentColor;
  opacity: 0.38;
  transition:
    width 420ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 300ms ease;
}

.author-name {
  font-size: 11px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: 0.34em;
  text-transform: lowercase;
  white-space: nowrap;
}

@media (hover: hover) and (pointer: fine) {
  .author-mark a:hover {
    transform: scale(1.1);
    opacity: 0.85;
  }

  .author-mark a:hover .author-line {
    width: 42px;
    opacity: 0.62;
  }
}

.author-mark a:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 5px;
  border-radius: 4px;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .author-mark a,
  .author-line {
    transition: none;
  }
}
</style>
