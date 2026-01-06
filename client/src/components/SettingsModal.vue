<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const modules = ref<{name: string, enabled: boolean}[]>([])
const loading = ref(true)

const fetchSettings = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/settings')
        const data = await res.json()
        modules.value = data.modules
        loading.value = false
    } catch (e) {
        console.error("Failed to load settings", e)
    }
}

const toggleModule = async (name: string, enabled: boolean) => {
    // Optimistic Update
    const mod = modules.value.find(m => m.name === name)
    if (mod) mod.enabled = enabled
    
    try {
        await fetch('http://localhost:3000/api/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                updates: [{ module: name, enabled }]
            })
        })
    } catch (e) {
        console.error("Failed to save setting", e)
        // Revert?
    }
}

onMounted(() => {
    fetchSettings()
})
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content glass-panel">
      <h2>Engine Settings</h2>
      
      <div v-if="loading">Loading...</div>
      
      <div v-else class="settings-list">
        <div v-for="mod in modules" :key="mod.name" class="setting-item">
          <span>Enable {{ mod.name }}</span>
           <label class="switch">
              <input type="checkbox" :checked="mod.enabled" @change="(e: any) => toggleModule(mod.name, e.target.checked)">
              <span class="slider round"></span>
            </label>
        </div>
      </div>

      <button class="close-btn" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: #1a1a1a;
  padding: 2rem;
  border-radius: 12px;
  width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.glass-panel {
    background: rgba(30, 30, 30, 0.8);
    backdrop-filter: blur(10px);
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
}

h2 {
    margin-top: 0;
    color: #fff;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 1rem;
}

.close-btn {
    width: 100%;
    margin-top: 1rem;
    padding: 0.8rem;
    background: #444;
    border: none;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
}
.close-btn:hover {
    background: #555;
}

/* Toggle Switch CSS */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}
.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}
input:checked + .slider {
  background-color: #2196F3;
}
input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}
input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}
.slider.round {
  border-radius: 34px;
}
.slider.round:before {
  border-radius: 50%;
}
</style>
