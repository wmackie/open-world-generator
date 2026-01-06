<script setup lang="ts">
import { ref } from 'vue';
import Terminal from './components/Terminal.vue';
import StatusPanel from './components/StatusPanel.vue';
import StartScreen from './components/StartScreen.vue';
import HamburgerMenu from './components/HamburgerMenu.vue';
import SettingsModal from './components/SettingsModal.vue';

// State
const log = ref<string[]>([]);
const worldState = ref<any>(null);
const isProcessing = ref(false);
const gameStarted = ref(false);
const showSettings = ref(false);

const handleMenuAction = async (action: string) => {
    if (action === 'new-game') {
        if (confirm("Are you sure? Unsaved progress will be lost.")) {
            gameStarted.value = false;
            log.value = [];
            worldState.value = null;
        }
    } else if (action === 'load-game') {
        const turn = prompt("Enter Turn Number to Load:");
        if (turn) {
            try {
                const res = await fetch('/api/load', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ turnNumber: parseInt(turn) })
                });
                const data = await res.json();
                if (data.error) alert(data.error);
                else {
                    alert(data.message);
                    // In a real app, we'd fetch the full state here.
                    // For now, let's just create a log entry
                    log.value.push(`[SYSTEM] Loaded Turn ${turn}.`);
                }
            } catch (e) {
                alert("Load failed");
            }
        }
    } else if (action === 'open-settings') {
        showSettings.value = true;
    }
}

// API Helpers
async function startGame(payload: any) {
  try {
    const res = await fetch('/api/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to start game');

    const data = await res.json();
    // Reset local state if needed
    // The original code used log.value.push for narrative, so we'll adapt this.
    // If narrativeLines was intended to be a new state variable, it would need to be declared.
    // Sticking to existing `log` for narrative output.
    // Reset local state if needed
    // The original code used log.value.push for narrative, so we'll adapt this.
    // If narrativeLines was intended to be a new state variable, it would need to be declared.
    // Sticking to existing `log` for narrative output.

    gameStarted.value = true;
    handleResponse(data); // Ensure handleResponse is still called for worldState updates
  } catch (e) {
    console.error("Start Error", e);
    log.value.push(`Error: Failed to start game. Check console for details.`);
  }
}

async function sendCommand(cmd: string) {
  isProcessing.value = true;
  // Echo command immediately
  log.value.push(`> ${cmd}`);

  try {
    const res = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: cmd })
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
    handleResponse(data);
  } catch (e: any) {
    log.value.push(`Error: ${e.message}`);
  } finally {
    isProcessing.value = false;
  }
}

function handleResponse(data: any) {
  if (data.narrative) {
    log.value.push(data.narrative);
  }

  if (data.worldStateDelta) {
    if (!worldState.value) {
      worldState.value = {};
    }

    // Rudimentary merge for player state
    if (data.worldStateDelta.player) {
      worldState.value.player = {
        ...worldState.value.player,
        ...data.worldStateDelta.player,
        state: {
          ...worldState.value.player?.state,
          ...data.worldStateDelta.player?.state
        }
      };
    }

    // Time
    if (data.worldStateDelta.time) {
      if (!worldState.value.time) worldState.value.time = {};
      worldState.value.time = { ...worldState.value.time, ...data.worldStateDelta.time };
    }
  }
}
</script>

<template>
  <div class="h-screen w-screen bg-gray-900 text-gray-200 font-mono overflow-hidden">
    <!-- START SCREEN -->
    <StartScreen v-if="!gameStarted" @start="startGame" />

    <!-- OVERLAYS -->
    <HamburgerMenu @new-game="handleMenuAction('new-game')" @load-game="handleMenuAction('load-game')" @open-settings="handleMenuAction('open-settings')" />
    <SettingsModal :is-open="showSettings" @close="showSettings = false" />

    <!-- MAIN GAME UI -->
    <div v-if="gameStarted" class="flex h-full w-full">
      <div class="flex-1 flex flex-col p-4 gap-4">
        <header class="border-b border-gray-700 pb-2">
          <h1 class="text-xl tracking-widest text-gray-400 font-bold uppercase">Interactive Fiction Engine</h1>
        </header>
        <div class="flex-1 min-h-0 relative">
          <Terminal :log="log" :is-processing="isProcessing" @submit="sendCommand" />
        </div>
      </div>
      <StatusPanel :world-state="worldState" />
    </div>
  </div>
</template>
