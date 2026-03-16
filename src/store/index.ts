import { createStore } from 'vuex';
import { viaCEPService } from '../services/viaCEP';
import { ViaCEPAddress, SearchMode } from '../types';

export interface State {
  results: ViaCEPAddress[];
  isLoading: boolean;
  error: string | null;
  mode: SearchMode;
  isAuthenticated: boolean;
}

export default createStore<State>({
  state: {
    results: [],
    isLoading: false,
    error: null,
    mode: 'cep',
    isAuthenticated: false,
  },
  mutations: {
    SET_RESULTS(state, results: ViaCEPAddress[]) {
      state.results = results;
    },
    SET_LOADING(state, isLoading: boolean) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error: string | null) {
      state.error = error;
    },
    SET_MODE(state, mode: SearchMode) {
      state.mode = mode;
    },
    SET_AUTH(state, isAuthenticated: boolean) {
      state.isAuthenticated = isAuthenticated;
    },
    CLEAR_RESULTS(state) {
      state.results = [];
      state.error = null;
    }
  },
  actions: {
    async login({ commit }, code: string) {
      try {
        // Try to get keys from the JSON environment variable
        const keysJson = import.meta.env.VITE_ACCESS_KEYS;
        
        if (keysJson) {
          const keysMap = JSON.parse(keysJson);
          
          if (code in keysMap) {
            const expirationDate = new Date(keysMap[code]);
            const now = new Date();
            
            if (now < expirationDate) {
              commit('SET_AUTH', true);
              commit('SET_ERROR', null);
              return true;
            } else {
              commit('SET_ERROR', 'Esta chave de acesso expirou. Por favor, adquira uma nova.');
              return false;
            }
          }
        }

        // Fallback to the simple single code if not found in the map or map doesn't exist
        const validCode = import.meta.env.VITE_ACCESS_CODE || 'BUSCA_PRO_2024';
        if (code === validCode) {
          commit('SET_AUTH', true);
          commit('SET_ERROR', null);
          return true;
        }

        commit('SET_ERROR', 'Chave de acesso inválida.');
        return false;
      } catch (e) {
        console.error('Erro ao validar chaves:', e);
        commit('SET_ERROR', 'Erro interno na validação do acesso.');
        return false;
      }
    },
    logout({ commit }) {
      commit('SET_AUTH', false);
      commit('CLEAR_RESULTS');
    },
    async searchByCEP({ commit }, cep: string) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        const result = await viaCEPService.searchByCEP(cep);
        commit('SET_RESULTS', [result]);
      } catch (err: any) {
        commit('SET_ERROR', err.message);
        commit('SET_RESULTS', []);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async searchByAddress({ commit }, { uf, city, street }: { uf: string; city: string; street: string }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        const results = await viaCEPService.searchByAddress(uf, city, street);
        commit('SET_RESULTS', results);
      } catch (err: any) {
        commit('SET_ERROR', err.message);
        commit('SET_RESULTS', []);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    changeMode({ commit }, mode: SearchMode) {
      commit('SET_MODE', mode);
      commit('CLEAR_RESULTS');
    }
  }
});
