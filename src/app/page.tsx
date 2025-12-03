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
  const [showLayout, setShowLayout] = useState(false);
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
    setShowLayout(bankType !== 'auto');
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
    <div className="min-h-screen bg-black flex">
      {/* LADO ESQUERDO - FUNDO COM UPLOAD E CONVERSÃO */}
      <div 
        className="w-1/2 bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-8 relative"
        style={{ backgroundImage: "url('/fundo.png')" }}
      >
        {/* Overlay escuro para melhor legibilidade */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        <div className="relative z-10 text-center">
          <h1 className="text-7xl font-bold mb-8 text-white animate-pulse drop-shadow-2xl">
            HBM OFX
          </h1>
          
          {/* UPLOAD PDF CENTRALIZADO */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm text-black p-8 rounded-2xl shadow-2xl mb-8 max-w-lg">
            <h3 className="text-2xl font-bold mb-6 text-gray-800"> Upload do PDF</h3>
            <div className="border-3 border-dashed border-blue-400 p-8 rounded-xl text-center bg-blue-50 hover:bg-blue-100 transition-all">
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
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 flex items-center justify-center text-white text-3xl shadow-lg">
                  
                </div>
                <span className="text-xl font-semibold text-gray-700">
                  {selectedFile ? ` ${selectedFile.name}` : 'Clique para selecionar PDF'}
                </span>
                {!selectedFile && (
                  <span className="text-sm text-gray-500 mt-2">
                    Arraste e solte ou clique aqui
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* BOTÃO CONVERTER CENTRALIZADO */}
          <button 
            onClick={handleConvert}
            disabled={!selectedFile || isConverting}
            className="bg-gradient-to-r from-green-500 via-blue-600 to-purple-700 hover:from-green-600 hover:via-blue-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-600 text-white font-bold py-6 px-12 rounded-2xl text-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 animate-bounce"
          >
            {isConverting ? ' CONVERTENDO...' : ' CONVERTER PARA OFX'}
          </button>
        </div>
      </div>

      {/* LADO DIREITO - SELEÇÃO DE LAYOUT E RESULTADOS */}
      <div className="w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8 overflow-y-auto">
        {!showAnimation && !result && (
          <div className="h-full flex flex-col">
            {/* SELEÇÃO DE BANCO MODERNA */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                 Escolha seu Banco
              </h2>
              
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(BANKS).map(([key, bank]) => (
                  <button
                    key={key}
                    onClick={() => handleBankChange(key as BankType)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${
                      selectedBank === key
                        ? 'border-blue-500 bg-blue-900 bg-opacity-50 shadow-lg shadow-blue-500/25 transform scale-105'
                        : 'border-gray-600 hover:border-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-3xl">{bank.icon}</span>
                    <div className="font-semibold text-lg">{bank.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* VISUALIZAÇÃO DO LAYOUT */}
            {selectedBank !== 'auto' && BANKS[selectedBank]?.layout && (
              <div className="flex-1 bg-gray-800 bg-opacity-50 rounded-2xl p-6 border border-gray-600">
                <h3 className="text-2xl font-bold mb-4 text-blue-400">
                   Preview do Layout - {BANKS[selectedBank].name}
                </h3>
                <div className="bg-white rounded-lg p-4">
                  <img 
                    src={BANKS[selectedBank].layout!} 
                    alt={`Layout ${BANKS[selectedBank].name}`}
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANIMAÇÃO DE PROCESSAMENTO */}
        {showAnimation && (
          <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-center z-10 relative">
              <h2 className="text-4xl font-bold mb-8 text-green-400 animate-pulse">
                 PROCESSANDO...
              </h2>
              <div className="text-2xl font-semibold text-blue-400 mb-4">
                Analisando PDF do {BANKS[selectedBank].name}
              </div>
              <div className="w-64 bg-gray-700 rounded-full h-4 mb-8">
                <div className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            {/* Códigos voando na tela */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-green-400 font-mono text-lg opacity-70 animate-bounce"
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
          <div className="h-full flex flex-col">
            <div className="mb-6 bg-green-900 bg-opacity-50 p-6 rounded-2xl border border-green-500">
              <h2 className="text-3xl font-bold mb-4 text-green-400"> Conversão Realizada!</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Banco:</strong> {BANKS[result.bankType as BankType]?.name || result.bankType}
                </div>
                <div>
                  <strong>Transações:</strong> {result.transactionCount} encontradas
                </div>
              </div>
            </div>

            {/* TABELA DE TRANSAÇÕES */}
            {result.transactions && (
              <div className="flex-1 bg-gray-800 bg-opacity-50 rounded-2xl p-6 border border-gray-600 mb-6">
                <h3 className="text-2xl font-bold mb-4 text-blue-400"> Transações Encontradas</h3>
                <div className="overflow-y-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Descrição</th>
                        <th className="text-right p-2">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.transactions.map((transaction, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="p-2">{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                          <td className="p-2">{transaction.description}</td>
                          <td className={`p-2 text-right font-bold ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-lg transform hover:scale-105 transition-all duration-300"
            >
               GERAR ARQUIVO OFX
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
