'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Banknote, 
  FileText, 
  ChevronDown, 
  Check, 
  Loader2, 
  Download, 
  X,
  Sparkles,
  Shield,
  Zap,
  Calendar,
  DollarSign,
  FileCode,
  Scan,
  Settings,
  Plus
} from 'lucide-react';
import LayoutEditor from '../components/LayoutEditor';

type BankType = 'auto' | 'bb_layout1' | 'itau_layout1' | 'santander_layout1' | 'safra_layout1' | 'sicoob_layout1' | 'sicoob_layout2' | 'sicredi_layout1' | 'sicredi_layout2' | 'pagseguro_layout1' | 'revolution_layout1';

const BANKS: Record<BankType, { 
  name: string; 
  icon: string; 
  color: string;
  layout?: string;
  supported: boolean;
}> = {
  'auto': { 
    name: 'Detec��o Autom�tica', 
    icon: '??', 
    color: 'from-blue-500 to-cyan-400',
    supported: true
  },
  'bb_layout1': { 
    name: 'Banco do Brasil', 
    icon: '??', 
    color: 'from-yellow-500 to-yellow-300',
    layout: '/layouts/banco_do_brasil_layout_1.png',
    supported: true
  },
  'itau_layout1': { 
    name: 'Ita� Unibanco', 
    icon: '??', 
    color: 'from-orange-600 to-orange-400',
    layout: '/layouts/layout_itau_1.png',
    supported: true
  },
  'santander_layout1': { 
    name: 'Santander', 
    icon: '??', 
    color: 'from-red-600 to-red-400',
    layout: '/layouts/santander_layout_1.png',
    supported: true
  },
  'safra_layout1': { 
    name: 'Banco Safra', 
    icon: '??', 
    color: 'from-green-600 to-emerald-400',
    layout: '/layouts/safra_layout_1.png',
    supported: true
  },
  'sicoob_layout1': { 
    name: 'Sicoob Layout 1', 
    icon: '??', 
    color: 'from-blue-600 to-blue-400',
    layout: '/layouts/sicoob_layout_1.png',
    supported: true
  },
  'sicoob_layout2': { 
    name: 'Sicoob Layout 2', 
    icon: '??', 
    color: 'from-blue-700 to-cyan-500',
    layout: '/layouts/sicoob_layout_2.png',
    supported: true
  },
  'sicredi_layout1': { 
    name: 'Sicredi Layout 1', 
    icon: '??', 
    color: 'from-purple-600 to-purple-400',
    layout: '/layouts/sicredi_layout_1.png',
    supported: true
  },
  'sicredi_layout2': { 
    name: 'Sicredi Layout 2', 
    icon: '??', 
    color: 'from-purple-700 to-fuchsia-500',
    layout: '/layouts/sicredi_layout_2.png',
    supported: true
  },
  'pagseguro_layout1': { 
    name: 'PagSeguro', 
    icon: '??', 
    color: 'from-amber-600 to-amber-400',
    layout: '/layouts/pagseguro_layout.png',
    supported: true
  },
  'revolution_layout1': { 
    name: 'Revolution/Cora', 
    icon: '?', 
    color: 'from-violet-600 to-violet-400',
    layout: '/layouts/revolution_layout.png',
    supported: true
  }
};

interface Transaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
  id: string;
}

interface ConversionResult {
  success: boolean;
  bankType: string;
  layoutUsed: string;
  transactionCount: number;
  totalAmount: number;
  period: { start: string; end: string };
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
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [useCustomLayout, setUseCustomLayout] = useState(false);
  const [customLayouts, setCustomLayouts] = useState<any[]>([]);
  const [selectedCustomLayout, setSelectedCustomLayout] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carregar layouts personalizados do localStorage
  useEffect(() => {
    try {
      const savedLayouts = localStorage.getItem('customLayouts');
      if (savedLayouts) {
        setCustomLayouts(JSON.parse(savedLayouts));
      }
    } catch (error) {
      console.error('Erro ao carregar layouts personalizados:', error);
    }
  }, []);

  // Anima��o de progresso
  useEffect(() => {
    if (showAnimation) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setScanProgress(0);
    }
  }, [showAnimation]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== 'application/pdf') {
        setFileError('Por favor, selecione um arquivo PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setFileError('Arquivo muito grande. M�ximo 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setFileError(null);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setFileError('Por favor, solte um arquivo PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError('Arquivo muito grande. M�ximo 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleBankChange = (bankType: BankType) => {
    setSelectedBank(bankType);
    setShowDropdown(false);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setFileError('Por favor, selecione um arquivo PDF primeiro.');
      return;
    }

    setIsConverting(true);
    setShowAnimation(true);
    setScanProgress(0);

    // Simular processamento
    const processingTime = 2500;
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const increment = Math.random() * 20;
        const newProgress = prev + increment;
        return newProgress > 95 ? 95 : newProgress;
      });
    }, processingTime / 20);

    await new Promise(resolve => setTimeout(resolve, processingTime));
    clearInterval(interval);
    setScanProgress(100);

    // Mock data para demonstra��o
    const mockTransactions: Transaction[] = Array.from({ length: 12 }, (_, i) => ({
      id: `trx-${i}`,
      date: new Date(2025, 11, i + 1).toISOString().split('T')[0],
      description: [
        'PIX Recebido - Jo�o Silva',
        'Transfer�ncia TED - Empresa XYZ',
        'Compra D�bito - Supermercado',
        'PIX Enviado - Maria Santos',
        'Pagamento Fatura Cart�o',
        'Dep�sito Autom�tico',
        'Taxa de Servi�o',
        'Resgate Investimentos',
        'Boleto Pagamento',
        'Transfer�ncia PIX - Cliente',
        'Cashback',
        'Manuten��o Conta'
      ][i],
      amount: [150.50, -500.00, -85.30, -200.00, -1200.00, 3000.00, -15.90, 2500.00, -350.75, 420.00, 25.50, -9.90][i],
      category: ['Entrada', 'Sa�da', 'Alimenta��o', 'Transfer�ncia', 'Cart�o', 'Entrada', 'Taxa', 'Investimento', 'Pagamento', 'Entrada', 'Cashback', 'Taxa'][i]
    }));

    const totalAmount = mockTransactions.reduce((sum, t) => sum + t.amount, 0);

    setTimeout(() => {
      setResult({
        success: true,
        bankType: selectedBank,
        layoutUsed: BANKS[selectedBank].layout || '',
        transactionCount: mockTransactions.length,
        totalAmount,
        period: {
          start: mockTransactions[0].date,
          end: mockTransactions[mockTransactions.length - 1].date
        },
        transactions: mockTransactions,
        ofxContent: 'OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\n...',
        detectedText: 'Texto extra�do do PDF...'
      });
      setIsConverting(false);
      setShowAnimation(false);
      setScanProgress(0);
    }, 500);
  };

  const downloadOFX = () => {
    if (result) {
      const blob = new Blob([result.ofxContent], { type: 'application/ofx' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extrato_${new Date().toISOString().slice(0, 10)}.ofx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="text-center mb-8 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-2xl">
              <FileCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-300">
              HBM OFX
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
            Converte automaticamente extratos banc�rios em PDF para formato OFX com intelig�ncia artificial
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-sm text-emerald-300 bg-emerald-900/30 px-4 py-2 rounded-full">
              <Shield className="w-4 h-4" />
              <span>100% Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-300 bg-emerald-900/30 px-4 py-2 rounded-full">
              <Zap className="w-4 h-4" />
              <span>Processamento R�pido</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-300 bg-emerald-900/30 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span>IA Integrada</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        {!showAnimation && !result ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Left Column - File Upload */}
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Upload do Extrato</h2>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    dragOver 
                      ? 'border-emerald-500 bg-emerald-900/20' 
                      : selectedFile 
                      ? 'border-green-500 bg-green-900/10' 
                      : 'border-gray-600 hover:border-emerald-400 hover:bg-gray-700/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  <div className="space-y-4">
                    <div className={`inline-flex p-4 rounded-full ${
                      selectedFile 
                        ? 'bg-green-500/20' 
                        : 'bg-gray-700/50'
                    }`}>
                      {selectedFile ? (
                        <FileText className="w-12 h-12 text-green-400" />
                      ) : (
                        <Upload className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    
                    <div>
                      {selectedFile ? (
                        <>
                          <p className="text-lg font-medium text-white mb-2">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB � Pronto para convers�o
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-medium text-white mb-2">
                            Arraste e solte seu PDF aqui
                          </p>
                          <p className="text-sm text-gray-400 mb-4">
                            ou clique para selecionar
                          </p>
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <Shield className="w-3 h-3" />
                            <span>Seus dados s�o processados localmente</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {fileError && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                      <p className="text-red-300 text-sm">{fileError}</p>
                    </div>
                  )}
                </div>

                {selectedFile && (
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={resetForm}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Remover arquivo
                    </button>
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <Check className="w-4 h-4" />
                      <span>Arquivo v�lido</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Panel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">Bancos Suportados</div>
                  <div className="text-2xl font-bold text-emerald-400">{Object.keys(BANKS).length}</div>
                </div>
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">Convers�es Hoje</div>
                  <div className="text-2xl font-bold text-emerald-400">1,247</div>
                </div>
              </div>
            </div>

            {/* Right Column - Bank Selection */}
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                    <Banknote className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Selecione o Banco</h2>
                </div>

                {/* Bank Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full p-4 bg-gray-900/70 border-2 border-gray-600 rounded-2xl text-left flex items-center justify-between hover:border-emerald-500 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${BANKS[selectedBank].color} flex items-center justify-center text-2xl`}>
                        {BANKS[selectedBank].icon}
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-semibold text-white">{BANKS[selectedBank].name}</div>
                        <div className="text-sm text-gray-400">Clique para alterar</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto backdrop-blur-xl">
                      {Object.entries(BANKS).map(([key, bank]) => (
                        <button
                          key={key}
                          onClick={() => handleBankChange(key as BankType)}
                          className={`w-full p-4 text-left hover:bg-gray-800 transition-all duration-200 flex items-center gap-4 border-b border-gray-800 last:border-b-0 ${
                            selectedBank === key ? 'bg-emerald-900/30' : ''
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bank.color} flex items-center justify-center text-xl`}>
                            {bank.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{bank.name}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              {bank.supported ? (
                                <>
                                  <Check className="w-3 h-3 text-green-400" />
                                  <span>Totalmente compat�vel</span>
                                </>
                              ) : (
                                <span className="text-yellow-400">Em desenvolvimento</span>
                              )}
                            </div>
                          </div>
                          {selectedBank === key && (
                            <Check className="w-5 h-5 text-emerald-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Layout Preview */}
                {selectedBank !== 'auto' && BANKS[selectedBank]?.layout && (
                  <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Scan className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-semibold text-white">Preview do Layout</h3>
                    </div>
                    <div className="bg-gray-900/70 rounded-2xl p-4 border border-gray-700">
                      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-emerald-400" />
                          </div>
                          <p className="text-sm text-gray-400">Layout otimizado para {BANKS[selectedBank].name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto Detection Info */}
                {selectedBank === 'auto' && (
                  <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-emerald-300 mb-1">Detec��o Autom�tica Ativada</h4>
                        <p className="text-sm text-gray-400">
                          Nosso sistema identifica automaticamente o layout do banco usando IA.
                          N�o precisa selecionar manualmente!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Convert Button */}
              <button
                onClick={handleConvert}
                disabled={!selectedFile || isConverting}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:via-green-400 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-5 px-8 rounded-2xl text-xl shadow-2xl transform transition-all duration-300 disabled:transform-none disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {isConverting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6 group-hover:animate-pulse" />
                      <span>Converter para OFX</span>
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>

              {/* Configure Layout Button */}
              <a
                href="/configurar-layout"
                className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 hover:from-purple-500 hover:via-indigo-400 hover:to-purple-500 text-white font-bold py-5 px-8 rounded-2xl text-xl shadow-2xl transform transition-all duration-300"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <FileCode className="w-6 h-6 group-hover:animate-pulse" />
                  <span>Configurar Layout Personalizado</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </a>
            </div>
          </div>
        ) : null}

        {/* Processing Animation */}
        {showAnimation && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl p-8 md:p-12">
              <div className="text-center">
                <div className="relative inline-flex mb-8">
                  <div className="absolute inset-0 animate-ping bg-emerald-500/30 rounded-full"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">
                  Processando Extrato
                </h2>
                <p className="text-gray-300 mb-8">
                  Analisando PDF do {BANKS[selectedBank].name} com IA...
                </p>

                {/* Progress Bar */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Extraindo dados...</span>
                    <span>{Math.round(scanProgress)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${scanProgress}%` }}
                    >
                      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>

                {/* Processing Steps */}
                <div className="grid grid-cols-3 gap-4 mt-12">
                  {['Leitura OCR', 'An�lise de Layout', 'Convers�o OFX'].map((step, index) => (
                    <div key={step} className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                        scanProgress > (index * 33) + 20 
                          ? 'bg-emerald-500/20 border border-emerald-500/50' 
                          : 'bg-gray-700/50'
                      }`}>
                        {scanProgress > (index * 33) + 20 ? (
                          <Check className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <span className="text-gray-400">{index + 1}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && !showAnimation && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
              {/* Results Header */}
              <div className="p-8 bg-gradient-to-r from-emerald-900/30 via-green-900/20 to-emerald-900/30 border-b border-emerald-800/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Convers�o Conclu�da!
                    </h2>
                    <p className="text-gray-300">
                      Extrato convertido com sucesso para formato OFX
                    </p>
                  </div>
                  <button
                    onClick={downloadOFX}
                    className="group flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-lg"
                  >
                    <Download className="w-5 h-5 group-hover:animate-bounce" />
                    <span>Baixar Arquivo OFX</span>
                  </button>
                </div>
              </div>

              {/* Results Body */}
              <div className="p-6 md:p-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Banknote className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-sm text-gray-400">Banco</span>
                    </div>
                    <div className="text-xl font-bold text-white">{BANKS[result.bankType as BankType]?.name}</div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Calendar className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-sm text-gray-400">Per�odo</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {new Date(result.period.start).toLocaleDateString('pt-BR')} - {new Date(result.period.end).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-sm text-gray-400">Transa��es</span>
                    </div>
                    <div className="text-xl font-bold text-white">{result.transactionCount}</div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-sm text-gray-400">Saldo Total</span>
                    </div>
                    <div className={`text-xl font-bold ${result.totalAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      R$ {result.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Transactions Table */}
                {result.transactions && (
                  <div className="bg-gray-900/30 rounded-2xl border border-gray-700/50 overflow-hidden">
                    <div className="p-6 border-b border-gray-700/50">
                      <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-6 h-6 text-emerald-400" />
                        Transa��es Detectadas
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <th className="text-left p-4 text-gray-400 font-medium">Data</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Descri��o</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Categoria</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {result.transactions.map((transaction) => (
                            <tr 
                              key={transaction.id} 
                              className="hover:bg-gray-800/30 transition-colors"
                            >
                              <td className="p-4">
                                <div className="text-white">
                                  {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="text-white max-w-md truncate">{transaction.description}</div>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800/50 text-gray-300">
                                  {transaction.category}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className={`text-lg font-semibold ${
                                  transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {transaction.amount >= 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-4 mt-8">
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-xl transition-colors"
                  >
                    Converter Outro Arquivo
                  </button>
                  <button
                    onClick={downloadOFX}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl transition-all duration-300 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar OFX
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>� 2025 HBM OFX Converter. Todos os direitos reservados.</p>
          <p className="mt-2 text-xs">Processamento seguro � Dados nunca s�o armazenados � Compat�vel com principais softwares financeiros</p>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
