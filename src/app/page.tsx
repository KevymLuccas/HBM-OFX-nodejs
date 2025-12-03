'use client';

import { useState } from 'react';

type BankType = 'auto' | 'bb_layout1' | 'itau_layout1' | 'santander_layout1' | 'safra_layout1' | 'sicoob_layout1' | 'sicoob_layout2' | 'sicredi_layout1' | 'sicredi_layout2' | 'pagseguro_layout1' | 'revolution_layout1';

const BANKS: Record<BankType, { name: string; icon: string; layout?: string }> = {
  'auto': { name: 'Detecção Automática', icon: '' },
  'bb_layout1': { name: 'Banco do Brasil - Layout 1', icon: '', layout: '/layouts/banco_do_brasil_layout_1.png' },
  'itau_layout1': { name: 'Itaú - Layout 1', icon: '', layout: '/layouts/layout_itau_1.png' },
  'santander_layout1': { name: 'Santander - Layout 1', icon: '', layout: '/layouts/santander_layout_1.png' },
  'safra_layout1': { name: 'Safra - Layout 1', icon: '', layout: '/layouts/safra_layout_1.png' },
  'sicoob_layout1': { name: 'Sicoob - Layout 1', icon: '', layout: '/layouts/sicoob_layout_1.png' },
  'sicoob_layout2': { name: 'Sicoob - Layout 2', icon: '', layout: '/layouts/sicoob_layout_2.png' },
  'sicredi_layout1': { name: 'Sicredi - Layout 1', icon: '', layout: '/layouts/sicredi_layout_1.png' },
  'sicredi_layout2': { name: 'Sicredi - Layout 2', icon: '', layout: '/layouts/sicredi_layout_2.png' },
  'pagseguro_layout1': { name: 'PagSeguro - Layout Padrão', icon: '', layout: '/layouts/pagseguro_layout.png' },
  'revolution_layout1': { name: 'Revolution/Cora - Layout Padrão', icon: '', layout: '/layouts/revolution_layout.png' }
};

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankType>('auto');
  const [showLayout, setShowLayout] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleBankChange = (bankType: BankType) => {
    setSelectedBank(bankType);
    setShowLayout(false);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      alert('Por favor, selecione um arquivo PDF primeiro.');
      return;
    }

    setIsConverting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('bankType', selectedBank);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        // Download do arquivo OFX
        const blob = new Blob([data.ofxContent], { type: 'application/ofx' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `extrato_${data.bankType}_${new Date().toISOString().slice(0, 10)}.ofx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Erro na conversão: ' + data.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro na conversão. Tente novamente.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 animate-pulse">
             HBM OFX 
          </h1>
          
          <h2 className="text-3xl font-semibold mb-6">
            Sistema de Conversão PDF para OFX
          </h2>
          
          <p className="text-xl mb-8 text-gray-300">
            Converta seus extratos bancários em PDF para o formato OFX
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Seleção de Banco */}
          <div className="bg-white text-black p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-4">1. Escolha seu Banco</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(BANKS).map(([key, bank]) => (
                <button
                  key={key}
                  onClick={() => handleBankChange(key as BankType)}
                  className={`p-3 rounded border-2 text-left transition-all ${
                    selectedBank === key
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">{bank.name}</div>
                </button>
              ))}
            </div>

            {selectedBank !== 'auto' && BANKS[selectedBank]?.layout && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowLayout(!showLayout)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  {showLayout ? 'Ocultar Layout' : 'Ver Layout do Banco'}
                </button>
              </div>
            )}

            {showLayout && selectedBank !== 'auto' && BANKS[selectedBank]?.layout && (
              <div className="mt-4 border rounded p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Preview do layout {BANKS[selectedBank].name}:</p>
                <img 
                  src={BANKS[selectedBank].layout!} 
                  alt={`Layout ${BANKS[selectedBank].name}`}
                  className="w-full max-w-md mx-auto border rounded"
                />
              </div>
            )}
          </div>

          {/* Upload de PDF */}
          <div className="bg-white text-black p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-4">2. Upload do PDF</h3>
            <div className="border-2 border-dashed border-gray-400 p-8 rounded-lg text-center">
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                id="pdf-upload"
                onChange={handleFileChange}
              />
              <label 
                htmlFor="pdf-upload" 
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-gray-400 rounded mb-4 flex items-center justify-center">
                  
                </div>
                <span className="text-lg font-medium">
                  {selectedFile ? selectedFile.name : 'Clique para selecionar PDF'}
                </span>
                {!selectedFile && (
                  <span className="text-sm text-gray-500 mt-2">
                    ou arraste e solte aqui
                  </span>
                )}
              </label>
            </div>

            <button 
              onClick={handleConvert}
              disabled={!selectedFile || isConverting}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all"
            >
              {isConverting ? 'Convertendo...' : 'Converter para OFX'}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-12 bg-green-900 text-green-100 p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-4"> Conversão Realizada!</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <strong>Banco Detectado:</strong><br/>
                {BANKS[result.bankType as BankType]?.name || result.bankType}
              </div>
              <div>
                <strong>Layout Usado:</strong><br/>
                {result.layoutUsed}
              </div>
              <div>
                <strong>Transações:</strong><br/>
                {result.transactionCount} encontradas
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-400">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <p> Processamento seguro</p>
            <p> Bancos brasileiros</p>
            <p> Formato OFX padrão</p>
          </div>
        </div>
      </div>
    </div>
  );
}
