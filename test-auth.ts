
function validateKey(code: string, keysJson: string | undefined, fallbackCode: string | undefined): { success: boolean, message?: string } {
  console.log('--- Debug Auth ---');
  console.log('Code entered:', code);
  console.log('Keys JSON:', keysJson);
  console.log('Fallback Code:', fallbackCode);

  if (keysJson) {
    let keysMap: Record<string, string> = {};
    try {
      let cleanJson = String(keysJson).trim();
      // Remove surrounding quotes
      if ((cleanJson.startsWith("'") && cleanJson.endsWith("'")) || 
          (cleanJson.startsWith('"') && cleanJson.endsWith('"'))) {
        cleanJson = cleanJson.substring(1, cleanJson.length - 1);
      }
      keysMap = JSON.parse(cleanJson);
      console.log('Parsed Keys Map:', keysMap);
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }

    if (keysMap && typeof keysMap === 'object' && Object.prototype.hasOwnProperty.call(keysMap, code)) {
      const expirationStr = keysMap[code];
      // Format: YYYY-MM-DD -> YYYY-MM-DDT23:59:59.999Z
      const expirationDate = new Date(`${expirationStr}T23:59:59.999Z`);
      const now = new Date();
      
      console.log('Expiration Str:', expirationStr);
      console.log('Expiration Date (UTC):', expirationDate.toUTCString());
      console.log('Now (UTC):', now.toUTCString());
      console.log('Now <= Expiration:', now.getTime() <= expirationDate.getTime());

      if (now.getTime() <= expirationDate.getTime()) {
        return { success: true };
      } else {
        return { success: false, message: 'Esta chave de acesso expirou. Por favor, adquira uma nova.' };
      }
    }
  }

  if (fallbackCode && code === fallbackCode) {
    console.log('Matched fallback code');
    return { success: true };
  }

  return { success: false, message: 'Chave de acesso inválida.' };
}

// Mocking the scenario
const mockKeys = '{"CHAVE_VIP": "2026-03-15", "TESTE_GRATIS": "2026-03-15"}';
const mockFallback = 'abc123';

console.log('TEST 1: Expired Key');
const res1 = validateKey('CHAVE_VIP', mockKeys, mockFallback);
console.log('Result:', res1);

console.log('\nTEST 2: Valid Fallback');
const res2 = validateKey('abc123', mockKeys, mockFallback);
console.log('Result:', res2);

console.log('\nTEST 3: Invalid Key');
const res3 = validateKey('WRONG', mockKeys, mockFallback);
console.log('Result:', res3);
