import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ColumnMapping {
  type: 'DATA' | 'VALOR' | 'HISTORICO';
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

const LAYOUTS_DIR = path.join(process.cwd(), 'data', 'layouts');

// Garantir que o diretório existe
if (!fs.existsSync(LAYOUTS_DIR)) {
  fs.mkdirSync(LAYOUTS_DIR, { recursive: true });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get('id');

    if (layoutId) {
      // Buscar layout específico
      const layoutFile = path.join(LAYOUTS_DIR, `${layoutId}.json`);
      
      if (fs.existsSync(layoutFile)) {
        const layout = JSON.parse(fs.readFileSync(layoutFile, 'utf8'));
        return NextResponse.json(layout);
      } else {
        return NextResponse.json({ error: 'Layout não encontrado' }, { status: 404 });
      }
    } else {
      // Listar todos os layouts
      const files = fs.readdirSync(LAYOUTS_DIR).filter(file => file.endsWith('.json'));
      const layouts = files.map(file => {
        const layout = JSON.parse(fs.readFileSync(path.join(LAYOUTS_DIR, file), 'utf8'));
        return {
          id: layout.id,
          bankName: layout.bankName,
          columnsCount: layout.columns.length
        };
      });
      
      return NextResponse.json(layouts);
    }
  } catch (error) {
    console.error('Erro ao buscar layouts:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const layout: LayoutConfig = await request.json();
    
    // Validar dados do layout
    if (!layout.bankName || !layout.columns || layout.columns.length === 0) {
      return NextResponse.json({ error: 'Dados do layout incompletos' }, { status: 400 });
    }

    // Validar se há pelo menos uma coluna de cada tipo essencial
    const hasData = layout.columns.some(col => col.type === 'DATA');
    const hasValor = layout.columns.some(col => col.type === 'VALOR');
    const hasHistorico = layout.columns.some(col => col.type === 'HISTORICO');

    if (!hasData || !hasValor || !hasHistorico) {
      return NextResponse.json({ 
        error: 'Layout deve ter pelo menos uma coluna de cada tipo: DATA, VALOR e HISTORICO' 
      }, { status: 400 });
    }

    // Gerar ID único se não existir
    if (!layout.id) {
      layout.id = `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Salvar layout
    const layoutFile = path.join(LAYOUTS_DIR, `${layout.id}.json`);
    fs.writeFileSync(layoutFile, JSON.stringify(layout, null, 2));

    return NextResponse.json({ 
      success: true, 
      id: layout.id,
      message: 'Layout salvo com sucesso!' 
    });

  } catch (error) {
    console.error('Erro ao salvar layout:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get('id');

    if (!layoutId) {
      return NextResponse.json({ error: 'ID do layout é obrigatório' }, { status: 400 });
    }

    const layoutFile = path.join(LAYOUTS_DIR, `${layoutId}.json`);
    
    if (fs.existsSync(layoutFile)) {
      fs.unlinkSync(layoutFile);
      return NextResponse.json({ success: true, message: 'Layout removido com sucesso!' });
    } else {
      return NextResponse.json({ error: 'Layout não encontrado' }, { status: 404 });
    }

  } catch (error) {
    console.error('Erro ao remover layout:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}