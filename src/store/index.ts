import { createStore } from 'vuex';
import { viaCEPService } from '../services/viaCEP';
import { ViaCEPAddress, SearchMode } from '../types';

export interface State {
  results: ViaCEPAddress[];
  isLoading: boolean;
  error: string | null;
  mode: SearchMode;
}

export default createStore<State>({
  state: {
    results: [],
    isLoading: false,
    error: null,
    mode: 'cep',
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
    CLEAR_RESULTS(state) {
      state.results = [];
      state.error = null;
    }
  },
  actions: {
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
