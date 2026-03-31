export interface Address {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export const searchByCEP = async (cep: string): Promise<Address> => {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) throw new Error('CEP inválido');
  
  const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
  const data = await response.json();
  
  if (data.erro) throw new Error('CEP não encontrado');
  return data;
};

export const searchByAddress = async (uf: string, city: string, street: string): Promise<Address[]> => {
  if (!uf || !city || street.length < 3) throw new Error('Dados insuficientes para busca');
  
  const response = await fetch(`https://viacep.com.br/ws/${uf}/${encodeURIComponent(city)}/${encodeURIComponent(street)}/json/`);
  const data = await response.json();
  
  if (!Array.isArray(data)) throw new Error('Erro na busca por endereço');
  return data;
};
