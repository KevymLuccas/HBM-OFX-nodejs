'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Save, Eye, Download, Upload, Settings, Plus, Trash2, Move } from 'lucide-react';
import Link from 'next/link';

interface ColumnMapping {
  id: string;
  name: string;
  type: 'date' | 'value' | 'description' | 'ignore';
  pattern: string;
  position: number;
  example: string;
}

interface Layout {
  id: string;
  name: string;
  bankName: string;
  description: string;
  columns: ColumnMapping[];
  dateFormat: string;
  skipLines: number;
  separator: string;
}

export default function ConfigurarLayout() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'preview' | 'save'>('upload');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [layout, setLayout] = useState<Layout>({
    id: '',
    name: '',
    bankName: '',
    description: '',
    columns: [],
    dateFormat: 'DD/MM/YYYY',
    skipLines: 0,
    separator: '|'
  });
  
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    
    // Simular extração de texto do PDF
    const simulatedText = `DATA|VALOR|HISTÓRICO
01/12/2025|-150.00|COMPRA CARTAO - SUPERMERCADO XYZ
02/12/2025|2500.00|TED RECEBIDA - JOAO SILVA
03/12/2025|-85.50|PIX ENVIADO - MARIA SANTOS
04/12/2025|-45.00|TARIFA MANUTENCAO CONTA
05/12/2025|1200.00|SALARIO - EMPRESA ABC LTDA`;

    setPdfText(simulatedText);
    
    // Analisar automaticamente as colunas
    const lines = simulatedText.split('\n');
    const headerLine = lines[0];
    const dataLines = lines.slice(1);
    
    setPreviewLines(dataLines);
    
    // Criar mapeamento automático das colunas
    const columns = headerLine.split('|').map((header, index) => ({
      id: `col_${index}`,
      name: header.trim(),
      type: detectColumnType(header.trim()),
      pattern: '',
      position: index,
      example: dataLines[0]?.split('|')[index] || ''
    }));
    
    setLayout(prev => ({ ...prev, columns }));
    setCurrentStep('configure');
  };

  const detectColumnType = (header: string): 'date' | 'value' | 'description' | 'ignore' => {
    const h = header.toLowerCase();
    if (h.includes('data') || h.includes('date')) return 'date';
    if (h.includes('valor') || h.includes('value') || h.includes('amount')) return 'value';
    if (h.includes('hist') || h.includes('desc') || h.includes('memo')) return 'description';
    return 'ignore';
  };

  const updateColumn = (id: string, field: keyof ColumnMapping, value: any) => {
    setLayout(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === id ? { ...col, [field]: value } : col
      )
    }));
  };

  const addColumn = () => {
    const newColumn: ColumnMapping = {
      id: `col_${Date.now()}`,
      name: 'Nova Coluna',
      type: 'ignore',
      pattern: '',
      position: layout.columns.length,
      example: ''
    };
    
    setLayout(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn]
    }));
  };

  const removeColumn = (id: string) => {
    setLayout(prev => ({
      ...prev,
      columns: prev.columns.filter(col => col.id !== id)
    }));
  };

  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedColumn) return;
    
    const draggedIndex = layout.columns.findIndex(col => col.id === draggedColumn);
    const targetIndex = layout.columns.findIndex(col => col.id === targetColumnId);
    
    const newColumns = [...layout.columns];
    const [draggedCol] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedCol);
    
    // Atualizar posições
    newColumns.forEach((col, index) => {
      col.position = index;
    });
    
    setLayout(prev => ({ ...prev, columns: newColumns }));
    setDraggedColumn(null);
  };

  const generatePreview = () => {
    const processedTransactions = previewLines.map(line => {
      const fields = line.split(layout.separator);
      const transaction: any = {};
      
      layout.columns.forEach(col => {
        if (col.position < fields.length) {
          const value = fields[col.position]?.trim();
          transaction[col.type] = value;
        }
      });
      
      return transaction;
    });
    
    return processedTransactions.filter(t => t.date && t.value);
  };

  const saveLayout = async () => {
    const layoutData = {
      ...layout,
      id: `layout_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    // Salvar no localStorage
    const existingLayouts = JSON.parse(localStorage.getItem('customLayouts') || '[]');
    existingLayouts.push(layoutData);
    localStorage.setItem('customLayouts', JSON.stringify(existingLayouts));
    
    alert('Layout salvo com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-green-200 transition-colors">
              <ArrowLeft size={24} />
              <span>Voltar</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Configurador de Layout</h1>
              <p className="text-green-200">Crie layouts personalizados para extração automática de dados</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
            <Settings className="text-green-300" size={20} />
            <span className="text-white font-medium">Etapa: {currentStep}</span>
          </div>
        </div>

        {/* Steps Progress */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {['upload', 'configure', 'preview', 'save'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === step ? 'bg-green-400 text-green-900' : 
                  ['upload', 'configure', 'preview', 'save'].indexOf(currentStep) > index ? 'bg-green-600 text-white' : 
                  'bg-white/20 text-white/60'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-16 h-0.5 ${
                    ['upload', 'configure', 'preview', 'save'].indexOf(currentStep) > index ? 'bg-green-600' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Upload PDF */}
        {currentStep === 'upload' && (
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">1. Upload do PDF de Exemplo</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              {!pdfFile ? (
                <div>
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-4">Faça upload de um PDF de exemplo</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Selecionar PDF
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 text-2xl">📄</span>
                  </div>
                  <p className="text-lg font-medium text-gray-800">{pdfFile.name}</p>
                  <p className="text-sm text-gray-500">PDF carregado com sucesso!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Configure Columns */}
        {currentStep === 'configure' && (
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">2. Configurar Colunas</h2>
            
            {/* Layout Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Layout</label>
                <input
                  type="text"
                  value={layout.name}
                  onChange={(e) => setLayout(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: Banco XYZ - Extrato Corrente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banco</label>
                <input
                  type="text"
                  value={layout.bankName}
                  onChange={(e) => setLayout(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Nome do banco"
                />
              </div>
            </div>

            {/* Column Mapping */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Mapeamento de Colunas</h3>
                <button
                  onClick={addColumn}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Adicionar Coluna
                </button>
              </div>

              {layout.columns.map((column, index) => (
                <div
                  key={column.id}
                  draggable
                  onDragStart={() => handleDragStart(column.id)}
                  onDrop={() => handleDrop(column.id)}
                  onDragOver={(e) => e.preventDefault()}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Move size={16} className="text-gray-400" />
                      <input
                        type="text"
                        value={column.name}
                        onChange={(e) => updateColumn(column.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        placeholder="Nome da coluna"
                      />
                    </div>
                    
                    <select
                      value={column.type}
                      onChange={(e) => updateColumn(column.id, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    >
                      <option value="date">Data</option>
                      <option value="value">Valor</option>
                      <option value="description">Histórico</option>
                      <option value="ignore">Ignorar</option>
                    </select>

                    <input
                      type="text"
                      value={column.pattern}
                      onChange={(e) => updateColumn(column.id, 'pattern', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      placeholder="Padrão (regex)"
                    />

                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded">
                      {column.example || 'Sem exemplo'}
                    </div>

                    <button
                      onClick={() => removeColumn(column.id)}
                      className="flex items-center justify-center w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep('upload')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setCurrentStep('preview')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Eye size={16} />
                Visualizar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 'preview' && (
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">3. Prévia dos Dados</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Transações Processadas:</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {generatePreview().map((transaction, index) => (
                  <div key={index} className="bg-white p-3 rounded border text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="font-medium text-blue-600">Data:</span> {transaction.date}
                      </div>
                      <div>
                        <span className="font-medium text-green-600">Valor:</span> {transaction.value}
                      </div>
                      <div>
                        <span className="font-medium text-purple-600">Histórico:</span> {transaction.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('configure')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setCurrentStep('save')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Save */}
        {currentStep === 'save' && (
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">4. Salvar Layout</h2>
            
            <div className="mb-8">
              <textarea
                value={layout.description}
                onChange={(e) => setLayout(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                rows={4}
                placeholder="Descrição do layout (opcional)"
              />
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setCurrentStep('preview')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={saveLayout}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                <Save size={16} />
                Salvar Layout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}