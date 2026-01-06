<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';

// Types
interface Genre {
  id: string;
  name: string;
  description: string;
  premises: any[];
  time_settings?: {
    default_start_date: string;
    default_start_time: string;
    allowed_year_range: [number, number];
  };
}

const genres = ref<Genre[]>([]);
const selectedGenre = ref('mundane');
const selectedTone = ref('None');
const selectedPremise = ref('');
const toneOptions = ['None', 'Gritty', 'Dark', 'Hopeful', 'Melancholic', 'Whimsical', 'Epic', 'Intimate', 'Lyrical', 'Surreal', 'Mythic', 'Tragic', 'Ironic', 'Tense', 'Reflective'];

// Character Customization
const playerName = ref('Agent Cipher'); // Default fallback
const playerDescription = ref('');
const selectedDate = ref('');
const selectedTime = ref('');

const isLoading = ref(true);
const error = ref('');

// Derived State
const currentGenre = computed(() => genres.value.find(x => x.id === selectedGenre.value));
const availablePremises = computed(() => currentGenre.value?.premises || []);
const timeSettings = computed(() => currentGenre.value?.time_settings || {
  default_start_date: '2024-05-15',
  default_start_time: '08:00',
  allowed_year_range: [1980, 2030]
});

// Watch Genre to reset/set defaults
watch(selectedGenre, () => {
  if (timeSettings.value) {
    selectedDate.value = timeSettings.value.default_start_date;
    selectedTime.value = timeSettings.value.default_start_time;
  }
});

const emit = defineEmits<{
  (e: 'start', payload: any): void;
}>();

async function fetchGenres() {
  try {
    const res = await fetch('/api/genres');
    if (!res.ok) throw new Error(`Failed to load genres: ${res.status}`);
    genres.value = await res.json();
    if (genres.value.length > 0) {
      selectedGenre.value = genres.value[0].id;
      // Trigger watch effect manually for initial load
      if (genres.value[0].time_settings) {
        selectedDate.value = genres.value[0].time_settings.default_start_date;
        selectedTime.value = genres.value[0].time_settings.default_start_time;
      }
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
}

function handleStart() {
  emit('start', {
    genre: selectedGenre.value,
    tone: selectedTone.value !== 'None' ? selectedTone.value : undefined,
    premise: selectedPremise.value || undefined,
    playerName: playerName.value || 'Protagonist',
    playerDescription: playerDescription.value || undefined,
    startTime: {
      date: selectedDate.value,
      time: selectedTime.value
    }
  });
}

onMounted(() => {
  fetchGenres();
});
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-gray-200">
    <div class="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
      <h2 class="text-3xl font-bold text-center text-blue-400 mb-2 tracking-widest uppercase">New Game</h2>
      <p class="text-center text-gray-500 mb-8 text-sm">Select simulation parameters</p>

      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
        <p class="mt-4 text-gray-400">Loading modules...</p>
      </div>

      <div v-else-if="error" class="text-red-400 text-center py-4 bg-red-900/20 rounded border border-red-900">
        {{ error }}
      </div>

      <div v-else class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Select Genre</label>
          <select v-model="selectedGenre"
            class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none">
            <option v-for="g in genres" :key="g.id" :value="g.id">
              {{ g.name }}
            </option>
          </select>
          <div class="mt-2 text-sm text-gray-500 italic h-10">
            {{genres.find(g => g.id === selectedGenre)?.description || ''}}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Narrative Tone
            Override</label>
          <select v-model="selectedTone"
            class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none">
            <option v-for="t in toneOptions" :key="t" :value="t">
              {{ t }}
            </option>
          </select>
        </div>

        <div v-if="availablePremises.length > 0">
          <label class="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Premise</label>
          <select v-model="selectedPremise"
            class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none">
            <option value="">Default</option>
            <option v-for="p in availablePremises" :key="p.name" :value="p.name">
              {{ p.name }}
            </option>
          </select>
          <div class="mt-2 text-sm text-gray-500 italic h-10">
            {{availablePremises.find(p => p.name === selectedPremise)?.description || ''}}
          </div>
        </div>

        <div class="border-t border-gray-700 pt-6">
          <h3 class="text-lg font-semibold text-blue-300 mb-4 uppercase tracking-wide">Identity</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Name</label>
              <input v-model="playerName" type="text" placeholder="Agent Cipher"
                class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Description /
                Background</label>
              <textarea v-model="playerDescription" rows="3"
                placeholder="A weary detective trying to forget their past..."
                class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"></textarea>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-700 pt-6">
          <h3 class="text-lg font-semibold text-blue-300 mb-4 uppercase tracking-wide">Timeline</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Date</label>
              <input v-model="selectedDate" type="date" :min="`${timeSettings.allowed_year_range[0]}-01-01`"
                :max="`${timeSettings.allowed_year_range[1]}-12-31`"
                class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Time</label>
              <input v-model="selectedTime" type="time"
                class="w-full bg-gray-900 border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <button @click="handleStart"
          class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded transition-all transform hover:scale-[1.02] shadow-lg uppercase tracking-wider">
          Initialize System
        </button>
      </div>
    </div>
  </div>
</template>
