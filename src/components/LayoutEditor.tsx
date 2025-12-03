'use client';

import { useState, useRef } from 'react';
import { 
  Upload, 
  Settings, 
  Save, 
  Eye,
  Plus,
  X,
  Move,
  Calendar,
  DollarSign,
  FileText,
  Check,
  Edit2,
  Download
} from 'lucide-react';

type ColumnType = 'DATA' | 'VALOR' | 'HISTORICO';

interface ColumnMapping {
  type: ColumnType;
  x: number;
  y: number;
  width: number;
  height: number;
  regex?: string;
  label: string;
  color: string;
}

interface LayoutConfig {
  id: string;
  bankName: string;
  columns: ColumnMapping[];
  pageSettings: {
    startY: number;
    endY: number;
    lineHeight: number;
  };
}

export default function LayoutEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<ColumnMapping | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{x: number, y: number} | null>(null);
  const [bankName, setBankName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const columnTypes = [
    { type: 'DATA' as ColumnType, icon: Calendar, color: 'bg-blue-500', label: 'Data da Transação' },
    { type: 'VALOR' as ColumnType, icon: DollarSign, color: 'bg-green-500', label: 'Valor' },
    { type: 'HISTORICO' as ColumnType, icon: FileText, color: 'bg-purple-500', label: 'Histórico/Descrição' }
  ];

  const [activeColumnType, setActiveColumnType] = useState<ColumnType>('DATA');

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // Aqui seria o processamento do PDF para preview
        // Por enquanto vamos simular
        setPdfPreview('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
        
        // Inicializar layout vazio
        setCurrentLayout({
          id: Date.now().toString(),
          bankName: bankName || 'Novo Layout',
          columns: [],
          pageSettings: {
            startY: 100,
            endY: 700,
            lineHeight: 20
          }
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setDrawStart({ x, y });
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart || !currentLayout) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    const newColumn: ColumnMapping = {
      type: activeColumnType,
      x: Math.min(drawStart.x, endX),
      y: Math.min(drawStart.y, endY),
      width: Math.abs(endX - drawStart.x),
      height: Math.abs(endY - drawStart.y),
      label: columnTypes.find(t => t.type === activeColumnType)?.label || '',
      color: columnTypes.find(t => t.type === activeColumnType)?.color || 'bg-gray-500'
    };

    setCurrentLayout({
      ...currentLayout,
      columns: [...currentLayout.columns, newColumn]
    });

    setIsDrawing(false);
    setDrawStart(null);
  };

  const saveLayout = async () => {
    if (!currentLayout) return;

    try {
      const response = await fetch('/api/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLayout)
      });

      if (response.ok) {
        alert('Layout salvo com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar layout:', error);
    }
  };

  const removeColumn = (index: number) => {
    if (!currentLayout) return;
    
    const newColumns = currentLayout.columns.filter((_, i) => i !== index);
    setCurrentLayout({
      ...currentLayout,
      columns: newColumns
    });
  };

  const testLayout = async () => {
    if (!currentLayout) return;

    // Simular teste do layout
    alert(`Testando layout "${currentLayout.bankName}" com ${currentLayout.columns.length} colunas mapeadas!`);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
      >
        <Settings className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Editor de Layout PDF → OFX
              </h1>
              <span className="text-sm text-gray-400">Configure mapeamento de colunas</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-80 bg-gray-800 border-r border-gray-700 p-6">
            {/* Upload PDF */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                1. Upload PDF para configurar
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                  id="pdf-layout-upload"
                />
                <label
                  htmlFor="pdf-layout-upload"
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Selecionar PDF
                </label>
              </div>
            </div>

            {/* Nome do Banco */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                2. Nome do Banco/Layout
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ex: Banco do Brasil - Layout 1"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Tipos de Coluna */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                3. Selecione o tipo de coluna
              </label>
              <div className="space-y-2">
                {columnTypes.map(({ type, icon: Icon, color, label }) => (
                  <button
                    key={type}
                    onClick={() => setActiveColumnType(type)}
                    className={`w-full flex items-center p-3 rounded-lg transition-all ${
                      activeColumnType === type
                        ? `${color} text-white shadow-lg`
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{type}</div>
                      <div className="text-sm opacity-75">{label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Colunas Mapeadas */}
            {currentLayout && currentLayout.columns.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  4. Colunas Configuradas ({currentLayout.columns.length})
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {currentLayout.columns.map((column, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg ${column.color} bg-opacity-20 border border-opacity-30`}
                    >
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${column.color} mr-2`}></div>
                        <span className="text-sm font-medium">{column.type}</span>
                      </div>
                      <button
                        onClick={() => removeColumn(index)}
                        className="p-1 hover:bg-red-500 hover:bg-opacity-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="space-y-3">
              <button
                onClick={testLayout}
                disabled={!currentLayout || currentLayout.columns.length === 0}
                className="w-full flex items-center justify-center p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5 mr-2" />
                Testar Layout
              </button>
              
              <button
                onClick={saveLayout}
                disabled={!currentLayout || currentLayout.columns.length === 0}
                className="w-full flex items-center justify-center p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Save className="w-5 h-5 mr-2" />
                Salvar Layout
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 p-6">
            <div className="bg-gray-800 rounded-lg p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Preview do PDF</h2>
                <div className="text-sm text-gray-400">
                  Arraste para mapear: <span className={`px-2 py-1 rounded ${columnTypes.find(t => t.type === activeColumnType)?.color}`}>
                    {activeColumnType}
                  </span>
                </div>
              </div>
              
              {pdfPreview ? (
                <div className="relative bg-white rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseUp={handleCanvasMouseUp}
                  />
                  
                  {/* Overlay das colunas mapeadas */}
                  {currentLayout?.columns.map((column, index) => (
                    <div
                      key={index}
                      className={`absolute border-2 ${column.color} bg-opacity-20`}
                      style={{
                        left: column.x,
                        top: column.y,
                        width: column.width,
                        height: column.height,
                      }}
                    >
                      <div className={`${column.color} text-white text-xs px-2 py-1 rounded-tl`}>
                        {column.type}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-700 rounded-lg">
                  <div className="text-center">
                    <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Faça upload de um PDF para começar</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Você poderá mapear visualmente as colunas DATA, VALOR e HISTÓRICO
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 rounded-lg p-4 max-w-md">
          <h3 className="font-semibold mb-2 text-purple-400">Como usar:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>1. Faça upload de um PDF de extrato</li>
            <li>2. Selecione o tipo de coluna (DATA/VALOR/HISTÓRICO)</li>
            <li>3. Arraste no PDF para mapear a área da coluna</li>
            <li>4. Repita para todas as colunas necessárias</li>
            <li>5. Teste e salve o layout</li>
          </ul>
        </div>
      </div>
    </div>
  );
}