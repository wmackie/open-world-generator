<script setup lang="ts">
defineProps<{
  worldState?: any;
}>();
</script>

<template>
  <div class="w-72 bg-gray-800 border-l border-gray-700 p-4 text-sm flex flex-col shadow-xl">
    <h3 class="text-gray-400 font-bold uppercase tracking-wider border-b border-gray-600 pb-2 mb-4">Status</h3>
    
    <div v-if="worldState && worldState.player" class="space-y-3">
      <div class="flex justify-between items-center group">
        <label class="text-gray-500 group-hover:text-gray-400 transition-colors">Name</label>
        <span class="font-medium text-gray-200">{{ worldState.player.name }}</span>
      </div>
      <div class="flex justify-between items-center group">
        <label class="text-gray-500 group-hover:text-gray-400 transition-colors">Location</label>
        <span class="font-medium text-blue-300 truncate max-w-[150px] text-right">{{ worldState.player.state.current_location_id }}</span>
      </div>
      <div class="flex justify-between items-center group">
        <label class="text-gray-500 group-hover:text-gray-400 transition-colors">Health</label>
        <span class="font-medium" :class="{
          'text-green-400': worldState.player.state.health_status === 'healthy', 
          'text-yellow-400': worldState.player.state.health_status === 'tired',
          'text-red-400': worldState.player.state.health_status === 'injured'
        }">{{ worldState.player.state.health_status }}</span>
      </div>
      <div class="flex justify-between items-center group">
        <label class="text-gray-500 group-hover:text-gray-400 transition-colors">Time</label>
        <span class="font-mono text-gray-300">{{ worldState.time?.current_time || 0 }}m</span>
      </div>

      <div v-if="worldState.player.state.inventory" class="mt-8">
        <h4 class="text-xs uppercase text-gray-500 font-bold mb-2">Inventory</h4>
        <ul class="space-y-1">
          <li v-for="item in worldState.player.state.inventory" :key="item" class="bg-gray-700/50 px-2 py-1 rounded text-gray-300 text-xs border border-gray-700/50">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
    
    <div v-else class="text-gray-500 italic text-center mt-10 animate-pulse">
      Initializing...
    </div>
  </div>
</template>
