<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

const emit = defineEmits(['new-game', 'load-game', 'open-settings'])

const toggle = () => isOpen.value = !isOpen.value
const close = () => isOpen.value = false

const handleAction = (action: 'new-game' | 'load-game' | 'open-settings') => {
    emit(action)
    close()
}
</script>

<template>
  <div class="menu-container" @mouseleave="close">
    <button class="hamburger-btn" @click="toggle" aria-label="Menu">
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
    </button>

    <transition name="fade">
      <div v-if="isOpen" class="dropdown-menu glass-panel">
        <div class="menu-item" @click="handleAction('new-game')">
            <span class="icon">Example</span> New Game
        </div>
        <div class="menu-item" @click="handleAction('load-game')">
            <span class="icon">📂</span> Load Game
        </div>
        <div class="divider"></div>
        <div class="menu-item" @click="handleAction('open-settings')">
            <span class="icon">⚙️</span> Settings
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.menu-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999;
}

.hamburger-btn {
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    padding: 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: all 0.3s ease;
    backdrop-filter: blur(4px);
}

.hamburger-btn:hover {
    background: rgba(255,255,255,0.1);
    transform: scale(1.05);
}

.bar {
    width: 20px;
    height: 2px;
    background-color: #fff;
    border-radius: 2px;
}

.dropdown-menu {
    position: absolute;
    top: 50px;
    right: 0;
    width: 200px;
    background: #1a1a1a;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    padding: 8px 0;
}

.glass-panel {
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(12px);
}

.menu-item {
    padding: 12px 20px;
    color: #eee;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background 0.2s;
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
}

.menu-item:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
}

.divider {
    height: 1px;
    background: rgba(255,255,255,0.1);
    margin: 4px 0;
}

.icon {
    font-size: 1.1rem;
    opacity: 0.8;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
