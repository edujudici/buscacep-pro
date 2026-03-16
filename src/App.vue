<template>
  <div class="min-h-screen flex flex-col font-sans selection:bg-black selection:text-white">
    <!-- Login Screen -->
    <div v-if="!isAuthenticated" class="flex-1 flex items-center justify-center p-6 bg-zinc-50">
      <div 
        class="w-full max-w-md bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <div class="flex flex-col items-center text-center mb-10">
          <div class="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6">
            <Lock class="text-white w-8 h-8" />
          </div>
          <h2 class="font-display text-3xl font-bold tracking-tight">Acesso Restrito</h2>
          <p class="text-zinc-500 mt-2">Insira sua chave de acesso para continuar.</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Chave de Acesso</label>
            <input
              v-model="accessCode"
              type="password"
              placeholder="••••••••"
              class="w-full h-14 px-6 bg-zinc-50 border-2 border-zinc-100 rounded-2xl text-lg focus:border-black focus:bg-white transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoadingAuth"
            class="w-full h-14 bg-black text-white rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Loader2 v-if="isLoadingAuth" class="w-5 h-5 animate-spin" />
            <span v-else>Entrar no Sistema</span>
            <ArrowRight v-if="!isLoadingAuth" class="w-5 h-5" />
          </button>

          <div v-if="error" class="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3">
            <Info class="w-4 h-4" />
            {{ error }}
          </div>
        </form>

        <p class="mt-8 text-center text-zinc-400 text-xs">
          Esqueceu sua chave? Entre em contato com o administrador.
        </p>
      </div>
    </div>

    <!-- Main App Content -->
    <template v-else>
      <!-- Header -->
      <header class="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-zinc-200">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <MapPin class="text-white w-5 h-5" />
          </div>
          <span class="font-display font-bold text-xl tracking-tight">BuscaCEP Pro</span>
        </div>
        <nav class="hidden md:flex gap-8 text-sm font-medium">
          <a href="#" class="hover:text-zinc-500 transition-colors">Como funciona</a>
          <a href="#" class="hover:text-zinc-500 transition-colors">API</a>
          <a href="#" class="hover:text-zinc-500 transition-colors">Suporte</a>
        </nav>
        <div class="flex items-center gap-4">
          <span class="hidden sm:block text-xs font-bold text-zinc-400 uppercase tracking-widest">Autenticado</span>
          <button @click="logout" class="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-black">
            <LogOut class="w-5 h-5" />
          </button>
        </div>
      </header>

      <main class="flex-1 pt-32 pb-20 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
      <!-- Left Column: Hero & Search -->
      <div class="lg:col-span-5 flex flex-col justify-center">
        <div class="transition-all duration-500">
          <h1 class="font-display text-5xl md:text-7xl font-bold leading-[0.9] tracking-tighter mb-6">
            ENCONTRE <br />
            QUALQUER <br />
            <span class="text-zinc-400">ENDEREÇO.</span>
          </h1>
          <p class="text-zinc-500 text-lg mb-10 max-w-md">
            A maneira mais rápida e objetiva de localizar CEPs e endereços em todo o território nacional.
          </p>
        </div>

        <div class="space-y-6">
          <!-- Mode Switcher -->
          <div class="flex p-1 bg-zinc-100 rounded-2xl w-fit">
            <button
              @click="setMode('cep')"
              :class="[
                'px-6 py-2 rounded-xl text-sm font-medium transition-all',
                mode === 'cep' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-800'
              ]"
            >
              Buscar por CEP
            </button>
            <button
              @click="setMode('address')"
              :class="[
                'px-6 py-2 rounded-xl text-sm font-medium transition-all',
                mode === 'address' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-800'
              ]"
            >
              Buscar por Nome
            </button>
          </div>

          <!-- Search Form -->
          <div class="relative">
            <template v-if="mode === 'cep'">
              <form @submit.prevent="handleCEPSearch" class="space-y-4">
                <div class="relative group">
                  <input
                    v-model="cepInput"
                    placeholder="00000-000"
                    class="w-full h-16 px-6 bg-white border-2 border-zinc-200 rounded-2xl text-xl font-display focus:border-black focus:ring-0 transition-all outline-none"
                  />
                  <button
                    type="submit"
                    :disabled="isLoading"
                    class="absolute right-3 top-3 bottom-3 px-6 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
                  >
                    <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
                    <Search v-else class="w-5 h-5" />
                    <span class="font-medium">Buscar</span>
                  </button>
                </div>
              </form>
            </template>
            <template v-else>
              <form @submit.prevent="handleAddressSearch" class="space-y-4">
                <div class="grid grid-cols-4 gap-4">
                  <div class="col-span-1">
                    <input
                      v-model="addressInput.uf"
                      placeholder="UF"
                      maxlength="2"
                      class="w-full h-14 px-4 bg-white border-2 border-zinc-200 rounded-xl text-lg font-display focus:border-black focus:ring-0 transition-all outline-none uppercase"
                    />
                  </div>
                  <div class="col-span-3">
                    <input
                      v-model="addressInput.city"
                      placeholder="Cidade"
                      class="w-full h-14 px-4 bg-white border-2 border-zinc-200 rounded-xl text-lg font-display focus:border-black focus:ring-0 transition-all outline-none"
                    />
                  </div>
                  <div class="col-span-4 relative">
                    <input
                      v-model="addressInput.street"
                      placeholder="Nome da Rua / Logradouro"
                      class="w-full h-14 px-4 bg-white border-2 border-zinc-200 rounded-xl text-lg font-display focus:border-black focus:ring-0 transition-all outline-none"
                    />
                    <button
                      type="submit"
                      :disabled="isLoading"
                      class="absolute right-2 top-2 bottom-2 px-4 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                      <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
                      <Search v-else class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </template>
          </div>

          <div v-if="error" class="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3">
            <Info class="w-4 h-4" />
            {{ error }}
          </div>
        </div>
      </div>

      <!-- Right Column: Results -->
      <div class="lg:col-span-7">
        <div class="h-full min-h-[400px] bg-zinc-100 rounded-[2.5rem] p-8 relative overflow-hidden">
          <!-- Background pattern -->
          <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(circle, black 1px, transparent 1px); background-size: 24px 24px"></div>

          <div v-if="results.length > 0" class="relative z-10 space-y-4">
            <div class="flex justify-between items-end mb-6">
              <div>
                <h3 class="font-display text-2xl font-bold">Resultados</h3>
                <p class="text-zinc-500 text-sm">{{ results.length }} endereço(s) encontrado(s)</p>
              </div>
              <button
                @click="clearResults"
                class="p-2 hover:bg-zinc-200 rounded-full transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <div
                v-for="(addr, idx) in results"
                :key="addr.cep + idx"
                class="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300"
                :style="{ animationDelay: `${idx * 50}ms` }"
              >
                <div class="flex justify-between items-start">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">CEP</span>
                      <span class="font-display font-bold text-xl">{{ addr.cep }}</span>
                    </div>
                    <h4 class="text-lg font-semibold text-zinc-800">{{ addr.logradouro || 'Sem logradouro' }}</h4>
                    <p class="text-zinc-500">
                      {{ addr.bairro ? addr.bairro + ', ' : '' }}{{ addr.localidade }} - {{ addr.uf }}
                    </p>
                  </div>
                  <div class="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                    <ArrowRight class="w-5 h-5" />
                  </div>
                </div>

                <div class="mt-6 pt-6 border-t border-zinc-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span class="block text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Estado</span>
                    <span class="text-sm font-medium">{{ addr.uf }}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">DDD</span>
                    <span class="text-sm font-medium">{{ addr.ddd }}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">IBGE</span>
                    <span class="text-sm font-medium">{{ addr.ibge }}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Região</span>
                    <span class="text-sm font-medium">{{ addr.regiao || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center text-center space-y-6 relative z-10">
            <div class="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-sm border border-zinc-200">
              <Navigation class="w-10 h-10 text-zinc-300" />
            </div>
            <div>
              <h3 class="font-display text-xl font-bold">Nenhum endereço selecionado</h3>
              <p class="text-zinc-500 text-sm max-w-[240px] mx-auto">
                Utilize o formulário ao lado para buscar informações detalhadas de qualquer lugar do Brasil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="px-6 py-12 border-t border-zinc-200 bg-white">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-black rounded flex items-center justify-center">
            <MapPin class="text-white w-4 h-4" />
          </div>
          <span class="font-display font-bold text-lg tracking-tight">BuscaCEP Pro</span>
        </div>
        <p class="text-zinc-400 text-sm">
          © 2024 BuscaCEP Pro. Dados providos por ViaCEP.
        </p>
        <div class="flex gap-6">
          <a href="#" class="text-zinc-400 hover:text-black transition-colors"><ChevronRight class="w-5 h-5" /></a>
          <a href="#" class="text-zinc-400 hover:text-black transition-colors"><ChevronRight class="w-5 h-5" /></a>
        </div>
      </div>
    </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { MapPin, Navigation, Search, Loader2, Info, X, ArrowRight, ChevronRight, Lock, LogOut } from 'lucide-vue-next';

const store = useStore();

const mode = computed(() => store.state.mode);
const results = computed(() => store.state.results);
const isLoading = computed(() => store.state.isLoading);
const error = computed(() => store.state.error);
const isAuthenticated = computed(() => store.state.isAuthenticated);

const accessCode = ref('');
const isLoadingAuth = ref(false);
const cepInput = ref('');
const addressInput = ref({
  uf: '',
  city: '',
  street: ''
});

const handleLogin = async () => {
  if (!accessCode.value.trim()) {
    store.commit('SET_ERROR', 'Por favor, insira a chave de acesso.');
    return;
  }
  isLoadingAuth.value = true;
  await store.dispatch('login', accessCode.value.trim());
  isLoadingAuth.value = false;
  accessCode.value = '';
};

const logout = () => {
  store.dispatch('logout');
};

const setMode = (newMode: 'cep' | 'address') => {
  store.dispatch('changeMode', newMode);
};

const handleCEPSearch = () => {
  if (cepInput.value.length < 8) return;
  store.dispatch('searchByCEP', cepInput.value);
};

const handleAddressSearch = () => {
  const { uf, city, street } = addressInput.value;
  if (!uf || !city || street.length < 3) return;
  store.dispatch('searchByAddress', { uf, city, street });
};

const clearResults = () => {
  store.commit('CLEAR_RESULTS');
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e4e4e7;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d4d4d8;
}
</style>
