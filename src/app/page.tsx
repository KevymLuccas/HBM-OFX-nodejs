'use client';

import { useState } from 'react';

const BANKS = {
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
  const [file, setFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState('auto');
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLayout, setShowLayout] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Por favor, selecione um arquivo PDF válido.');
    }
  };

  const handleBankChange = (bankCode: string) => {
    setSelectedBank(bankCode);
    setShowLayout(false);
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Selecione um arquivo PDF primeiro.');
      return;
    }

    setIsConverting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
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
        const blob = new Blob([data.ofxContent], { type: 'application/x-ofx' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `extrato_${data.bankType}_${new Date().getTime()}.ofx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError(data.error || 'Erro na conversão');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Por favor, solte apenas arquivos PDF.');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-6xl w-full">
        <h1 className="text-6xl font-bold mb-8 animate-pulse">
           HBM OFX 
        </h1>
        
        <h2 className="text-3xl font-semibold mb-6">
          Sistema de Conversão PDF para OFX
        </h2>
        
        <p className="text-xl mb-8 text-gray-300">
          Selecione o banco e converta seus extratos para OFX automaticamente
        </p>

        {/* Seleção do Banco */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-2xl font-bold mb-4 text-white">Selecione o Banco</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(BANKS).map(([code, bank]) => (
              <button
                key={code}
                onClick={() => handleBankChange(code)}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${
                  selectedBank === code
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="text-lg">{bank.icon}</span>
                <div className="mt-1">{bank.name}</div>
              </button>
            ))}
          </div>
          
          {selectedBank !== 'auto' && BANKS[selectedBank]?.layout && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowLayout(!showLayout)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                {showLayout ? ' Ocultar Layout' : ' Ver Layout do PDF'}
              </button>
            </div>
          )}
        </div>

        {/* Visualização do Layout */}
        {showLayout && selectedBank !== 'auto' && BANKS[selectedBank]?.layout && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h3 className="text-xl font-bold mb-4 text-black">
              Layout do {BANKS[selectedBank].name}
            </h3>
            <img 
              src={BANKS[selectedBank].layout} 
              alt={`Layout ${BANKS[selectedBank].name}`}
              className="max-w-full h-auto rounded border shadow-lg mx-auto"
              style={{ maxHeight: '400px' }}
            />
            <p className="text-sm text-gray-600 mt-2">
              Este é o formato esperado do seu PDF
            </p>
          </div>
        )}
        
        {/* Upload de Arquivo */}
        <div className="bg-white text-black p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-2xl font-bold mb-4">Upload de PDF</h3>
          <div 
            className={`border-2 border-dashed p-8 rounded-lg transition-colors ${
              file ? 'border-green-500 bg-green-50' : 'border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
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
              <svg 
                className="w-16 h-16 text-gray-600 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-lg font-medium">
                {file ? file.name : 'Clique para selecionar um arquivo PDF'}
              </span>
              <span className="text-sm text-gray-500 mt-2">
                ou arraste e solte aqui
              </span>
            </label>
          </div>
          
          {file && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Arquivo:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
              <p className="text-sm text-blue-700">
                <strong>Banco:</strong> {BANKS[selectedBank].name}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
             {error}
          </div>
        )}

        {result && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <h4 className="font-bold mb-2"> Conversão realizada com sucesso!</h4>
            <p><strong>Banco:</strong> {result.bankType.toUpperCase()}</p>
            <p><strong>Layout:</strong> {result.layoutUsed || 'Padrão'}</p>
            <p><strong>Transações:</strong> {result.transactionCount}</p>
            <p className="text-sm mt-2"> Arquivo OFX baixado automaticamente</p>
          </div>
        )}
        
        <button 
          onClick={handleConvert}
          disabled={!file || isConverting}
          className={`font-bold py-4 px-8 rounded-lg text-xl shadow-lg transform transition-all duration-200 ${
            !file || isConverting
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105'
          } text-white`}
        >
          {isConverting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Convertendo...
            </span>
          ) : (
            ' Converter para OFX'
          )}
        </button>
        
        <div className="mt-8 text-sm text-gray-400">
          <p> {Object.keys(BANKS).length - 1} bancos com layouts específicos</p>
          <p> Detecção automática disponível</p>
          <p> Visualização de layouts antes da conversão</p>
          <p> Download automático do arquivo OFX</p>
        </div>
      </div>
    </div>
  );
}
