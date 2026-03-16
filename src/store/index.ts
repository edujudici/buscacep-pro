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
        const keysJson = import.meta.env.VITE_ACCESS_KEYS;
        const accessCodeEnv = import.meta.env.VITE_ACCESS_CODE;
        
        let keysMap: Record<string, string> = {};
        
        // 1. Parse keys map
        if (keysJson) {
          try {
            if (typeof keysJson === 'string') {
              let cleanJson = keysJson.trim().replace(/^['"]|['"]$/g, '');
              keysMap = JSON.parse(cleanJson);
            } else if (typeof keysJson === 'object') {
              keysMap = keysJson as Record<string, string>;
            }
          } catch (e) {
            console.error('Erro ao processar VITE_ACCESS_KEYS:', e);
          }
        }

        // 2. Check if code is in the map (Expiration Logic)
        if (keysMap && typeof keysMap === 'object' && Object.prototype.hasOwnProperty.call(keysMap, code)) {
          const expirationStr = keysMap[code];
          if (/^\d{4}-\d{2}-\d{2}$/.test(expirationStr)) {
            const expirationDate = new Date(`${expirationStr}T23:59:59.999Z`);
            const now = new Date();
            
            if (now.getTime() <= expirationDate.getTime()) {
              commit('SET_AUTH', true);
              commit('SET_ERROR', null);
              return true;
            } else {
              commit('SET_ERROR', 'Esta chave de acesso expirou. Por favor, adquira uma nova.');
              return false;
            }
          }
        }

        // 3. Fallback to single VITE_ACCESS_CODE (Master Key)
        const masterKey = accessCodeEnv || 'BUSCA_PRO_2024';
        if (code === masterKey) {
          commit('SET_AUTH', true);
          commit('SET_ERROR', null);
          return true;
        }

        commit('SET_ERROR', 'Chave de acesso inválida.');
        return false;
      } catch (e) {
        console.error('Erro crítico no login:', e);
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
