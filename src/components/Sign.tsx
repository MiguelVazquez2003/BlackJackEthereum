// src/components/Sign.tsx

import { useState } from 'react';
import { useMetaMask } from '../hooks/useMetaMask'; // Assuming you have a MetaMask hook

const Sign = ({ data }: { data: string }) => {
  const { signer } = useMetaMask();
  const [signature, setSignature] = useState<string>('');

  const handleSign = async () => {
    if (!signer) {
      alert('MetaMask no está conectado');
      return;
    }
    const signature = await signer.signMessage(data);
    setSignature(signature);
  };

  return (
    <div>
      <h3>Firmar Datos</h3>
      <button onClick={handleSign}>Firmar</button>
      {signature && <p>Firma: {signature}</p>}
    </div>
  );
};

export default Sign;
