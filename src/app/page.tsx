'use client';

import { useState } from 'react';

type BankType = 'auto' | 'bb_layout1' | 'itau_layout1' | 'santander_layout1' | 'safra_layout1' | 'sicoob_layout1' | 'sicoob_layout2' | 'sicredi_layout1' | 'sicredi_layout2' | 'pagseguro_layout1' | 'revolution_layout1';

const BANKS: Record<BankType, { name: string; icon: string; layout?: string }> = {
  'auto': { name: 'Detecção Automática', icon: '' },
  'bb_layout1': { name: 'Banco do Brasil', icon: '', layout: '/layouts/banco_do_brasil_layout_1.png' },
  'itau_layout1': { name: 'Itaú Unibanco', icon: '', layout: '/layouts/layout_itau_1.png' },
  'santander_layout1': { name: 'Santander', icon: '', layout: '/layouts/santander_layout_1.png' },
  'safra_layout1': { name: 'Banco Safra', icon: '', layout: '/layouts/safra_layout_1.png' },
  'sicoob_layout1': { name: 'Sicoob Layout 1', icon: '', layout: '/layouts/sicoob_layout_1.png' },
  'sicoob_layout2': { name: 'Sicoob Layout 2', icon: '', layout: '/layouts/sicoob_layout_2.png' },
  'sicredi_layout1': { name: 'Sicredi Layout 1', icon: '', layout: '/layouts/sicredi_layout_1.png' },
  'sicredi_layout2': { name: 'Sicredi Layout 2', icon: '', layout: '/layouts/sicredi_layout_2.png' },
  'pagseguro_layout1': { name: 'PagSeguro', icon: '', layout: '/layouts/pagseguro_layout.png' },
  'revolution_layout1': { name: 'Revolution/Cora', icon: '', layout: '/layouts/revolution_layout.png' }
};

interface Transaction {
  date: string;
  description: string;
  amount: number;
}

interface ConversionResult {
  success: boolean;
  bankType: string;
  layoutUsed: string;
  transactionCount: number;
  transactions?: Transaction[];
  ofxContent: string;
  detectedText: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankType>('auto');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleBankChange = (bankType: BankType) => {
    setSelectedBank(bankType);
    setShowDropdown(false);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      alert('Por favor, selecione um arquivo PDF primeiro.');
      return;
    }

    setIsConverting(true);
    setShowAnimation(true);
    
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 3000));

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
        // Simular transações para demonstração
        const mockTransactions = [
          { date: '2025-12-01', description: 'PIX Recebido - João Silva', amount: 150.50 },
          { date: '2025-12-02', description: 'Transferência TED', amount: -500.00 },
          { date: '2025-12-03', description: 'Compra Débito - Supermercado', amount: -85.30 },
          { date: '2025-12-03', description: 'PIX Recebido - Maria Santos', amount: 200.00 }
        ];
        
        setResult({
          ...data,
          transactions: mockTransactions
        });
      } else {
        alert('Erro na conversão: ' + data.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro na conversão. Tente novamente.');
    } finally {
      setIsConverting(false);
      setShowAnimation(false);
    }
  };

  const downloadOFX = () => {
    if (result) {
      const blob = new Blob([result.ofxContent], { type: 'application/ofx' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extrato_${result.bankType}_${new Date().toISOString().slice(0, 10)}.ofx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl mx-auto">
        
        {/* TÍTULO CENTRALIZADO */}
        <div className="text-center mb-12">
          <h1 className="text-8xl font-bold mb-4 text-white animate-pulse drop-shadow-2xl">
             HBM OFX 
          </h1>
          <p className="text-2xl text-green-200 mb-8">
            Sistema de Conversão PDF para OFX
          </p>
        </div>

        {!showAnimation && !result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* COLUNA ESQUERDA - UPLOAD */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white bg-opacity-95 backdrop-blur-sm text-black p-8 rounded-2xl shadow-2xl w-full max-w-md border-4 border-green-300">
                <h3 className="text-2xl font-bold mb-6 text-green-800 text-center"> Upload do PDF</h3>
                <div className="border-3 border-dashed border-green-400 p-8 rounded-xl text-center bg-green-50 hover:bg-green-100 transition-all">
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
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 flex items-center justify-center text-white text-3xl shadow-lg">
                      
                    </div>
                    <span className="text-lg font-semibold text-green-700 text-center">
                      {selectedFile ? ` ${selectedFile.name}` : 'Clique para selecionar PDF'}
                    </span>
                    {!selectedFile && (
                      <span className="text-sm text-green-600 mt-2">
                        Arraste e solte ou clique aqui
                      </span>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA - SELEÇÃO DE BANCO */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-md">
                <h3 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                   Escolha seu Banco
                </h3>
                
                {/* DROPDOWN CUSTOMIZADO */}
                <div className="relative mb-6">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full p-4 bg-green-800 border-2 border-green-600 rounded-xl text-left flex items-center justify-between hover:bg-green-700 transition-all duration-300 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{BANKS[selectedBank].icon}</span>
                      <span className="text-lg font-semibold text-white">{BANKS[selectedBank].name}</span>
                    </div>
                    <span className={`text-2xl transform transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`}>
                      
                    </span>
                  </button>
                  
                  {/* LISTA DROPDOWN */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-green-800 border-2 border-green-600 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                      {Object.entries(BANKS).map(([key, bank]) => (
                        <button
                          key={key}
                          onClick={() => handleBankChange(key as BankType)}
                          className={`w-full p-4 text-left hover:bg-green-700 transition-all duration-200 flex items-center gap-3 border-b border-green-600 last:border-b-0 text-white ${
                            selectedBank === key ? 'bg-green-600' : ''
                          }`}
                        >
                          <span className="text-xl">{bank.icon}</span>
                          <span className="font-medium">{bank.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* PREVIEW DO LAYOUT */}
                {selectedBank !== 'auto' && BANKS[selectedBank]?.layout && (
                  <div className="bg-green-800 bg-opacity-50 rounded-2xl p-4 border-2 border-green-600 mb-6">
                    <h4 className="text-lg font-bold mb-3 text-green-300 text-center">
                       Preview do Layout
                    </h4>
                    <div className="bg-white rounded-lg p-3 border-2 border-green-400">
                      <img 
                        src={BANKS[selectedBank].layout!} 
                        alt={`Layout ${BANKS[selectedBank].name}`}
                        className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BOTÃO CONVERTER CENTRALIZADO */}
        {!showAnimation && !result && (
          <div className="text-center mt-12">
            <button 
              onClick={handleConvert}
              disabled={!selectedFile || isConverting}
              className="bg-gradient-to-r from-green-500 via-emerald-600 to-green-700 hover:from-green-600 hover:via-emerald-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-600 text-white font-bold py-6 px-16 rounded-2xl text-3xl shadow-2xl transform hover:scale-105 transition-all duration-300 animate-bounce border-4 border-green-300"
            >
              {isConverting ? ' CONVERTENDO...' : ' CONVERTER PARA OFX'}
            </button>
          </div>
        )}

        {/* ANIMAÇÃO DE PROCESSAMENTO */}
        {showAnimation && (
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-8 text-green-300 animate-pulse">
               PROCESSANDO...
            </h2>
            <div className="text-3xl font-semibold text-green-400 mb-6">
              Analisando PDF do {BANKS[selectedBank].name}
            </div>
            <div className="w-96 bg-green-900 rounded-full h-6 mb-8 mx-auto border-2 border-green-500">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
            
            {/* Códigos voando na tela */}
            <div className="relative h-40 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-green-300 font-mono text-lg opacity-70 animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 3}s`
                  }}
                >
                  {['OFX', '<STMTTRN>', '150.50', 'PIX', 'TED', '<MEMO>', '2025-12-03', 'BRL'][Math.floor(Math.random() * 8)]}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULTADO DA CONVERSÃO */}
        {result && !showAnimation && (
          <div className="text-center">
            <div className="mb-8 bg-green-800 bg-opacity-70 p-6 rounded-2xl border-2 border-green-400 max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold mb-4 text-green-300"> Conversão Realizada!</h2>
              <div className="grid grid-cols-2 gap-4 text-lg">
                <div>
                  <strong>Banco:</strong><br/>{BANKS[result.bankType as BankType]?.name || result.bankType}
                </div>
                <div>
                  <strong>Transações:</strong><br/>{result.transactionCount} encontradas
                </div>
              </div>
            </div>

            {/* TABELA DE TRANSAÇÕES */}
            {result.transactions && (
              <div className="bg-green-800 bg-opacity-50 rounded-2xl p-6 border-2 border-green-600 mb-8 max-w-4xl mx-auto">
                <h3 className="text-3xl font-bold mb-6 text-green-300 text-center"> Transações Encontradas</h3>
                <div className="overflow-x-auto border border-green-600 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-green-700">
                      <tr className="border-b border-green-600">
                        <th className="text-center p-4 text-green-200 text-lg">Data</th>
                        <th className="text-center p-4 text-green-200 text-lg">Descrição</th>
                        <th className="text-center p-4 text-green-200 text-lg">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.transactions.map((transaction, index) => (
                        <tr key={index} className="border-b border-green-700 hover:bg-green-700 transition-colors">
                          <td className="p-4 text-center">{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4 text-center">{transaction.description}</td>
                          <td className={`p-4 text-center font-bold text-lg ${transaction.amount >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            R$ {transaction.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BOTÃO GERAR OFX */}
            <button
              onClick={downloadOFX}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-6 px-12 rounded-2xl text-2xl shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-green-400"
            >
               GERAR ARQUIVO OFX
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
