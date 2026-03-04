import { ViaCEPAddress } from '../types';

export const viaCEPService = {
  async searchByCEP(cep: string): Promise<ViaCEPAddress> {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos.');
    }
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();
    if (data.erro) {
      throw new Error('CEP não encontrado.');
    }
    return data;
  },

  async searchByAddress(uf: string, city: string, street: string): Promise<ViaCEPAddress[]> {
    if (!uf || !city || street.length < 3) {
      throw new Error('Preencha os campos corretamente. O logradouro deve ter pelo menos 3 caracteres.');
    }
    const response = await fetch(`https://viacep.com.br/ws/${uf}/${encodeURIComponent(city)}/${encodeURIComponent(street)}/json/`);
    const data = await response.json();
    if (data.erro) {
      throw new Error('Endereço não encontrado.');
    }
    return data;
  }
};
