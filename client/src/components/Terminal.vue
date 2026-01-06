<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
  log: string[];
  isProcessing: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', command: string): void;
}>();

const inputCommand = ref('');
const terminalBody = ref<HTMLDivElement | null>(null);

// Auto-scroll to bottom when log changes
watch(() => props.log, async () => {
  await nextTick();
  if (terminalBody.value) {
    terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
  }
}, { deep: true });

function handleSubmit() {
  const cmd = inputCommand.value.trim();
  if (cmd) {
    emit('submit', cmd);
    inputCommand.value = '';
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shadow-inner">
    <div ref="terminalBody" class="flex-1 overflow-y-auto p-4 font-mono text-sm md:text-base leading-relaxed text-gray-300 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      <div v-for="(line, index) in log" :key="index" class="mb-2 animate-fade-in">
        {{ line }}
      </div>
      <div v-if="isProcessing" class="text-blue-400 italic animate-pulse">...</div>
    </div>
    <form @submit.prevent="handleSubmit" class="flex items-center p-3 bg-gray-900 border-t border-gray-800">
      <span class="text-green-500 font-bold mr-3 select-none">></span>
      <input 
        v-model="inputCommand" 
        type="text" 
        autofocus 
        :disabled="isProcessing"
        placeholder="Enter command..."
        class="flex-1 bg-transparent border-none text-gray-100 font-mono focus:outline-none focus:ring-0 placeholder-gray-600"
      />
    </form>
  </div>
</template>
