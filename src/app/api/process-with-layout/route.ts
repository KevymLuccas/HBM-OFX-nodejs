import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
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

interface Transaction {
  date: string;
  amount: number;
  description: string;
  type: 'DEBIT' | 'CREDIT';
}

const LAYOUTS_DIR = path.join(process.cwd(), 'data', 'layouts');

// Simular extração de texto do PDF baseado no layout
function extractTextWithLayout(pdfText: string, layout: LayoutConfig): Transaction[] {
  const transactions: Transaction[] = [];
  
  try {
    // Simular linhas do PDF
    const lines = pdfText.split('\n').filter(line => line.trim());
    
    // Para cada linha, tentar extrair dados baseado no layout
    for (const line of lines) {
      const transaction = extractTransactionFromLine(line, layout);
      if (transaction) {
        transactions.push(transaction);
      }
    }
    
  } catch (error) {
    console.error('Erro ao extrair dados com layout:', error);
  }
  
  return transactions;
}

function extractTransactionFromLine(line: string, layout: LayoutConfig): Transaction | null {
  try {
    let date = '';
    let amount = 0;
    let description = '';
    
    // Simular extração baseada nas posições das colunas
    const parts = line.split(/\s+/);
    
    // Buscar colunas do layout
    const dataColumn = layout.columns.find(col => col.type === 'DATA');
    const valorColumn = layout.columns.find(col => col.type === 'VALOR');
    const historicoColumn = layout.columns.find(col => col.type === 'HISTORICO');
    
    if (!dataColumn || !valorColumn || !historicoColumn) {
      return null;
    }
    
    // Simular extração baseada na posição relativa
    // Em um sistema real, usaria as coordenadas x,y,width,height para extrair o texto exato
    
    // Procurar data (formato dd/mm/yyyy ou similar)
    const dateMatch = line.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{1,2}-\d{1,2}-\d{4}\b/);
    if (dateMatch) {
      date = dateMatch[0];
    }
    
    // Procurar valor (formato monetário)
    const valueMatches = line.match(/-?\d+[\.,]\d{2}|\d+[\.,]\d{2}/g);
    if (valueMatches && valueMatches.length > 0) {
      // Pegar o último valor encontrado (geralmente o valor principal)
      const valueStr = valueMatches[valueMatches.length - 1].replace(',', '.');
      amount = parseFloat(valueStr);
    }
    
    // Extrair descrição (resto da linha, excluindo data e valores)
    description = line
      .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g, '') // Remove datas
      .replace(/-?\d+[\.,]\d{2}/g, '') // Remove valores
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
    
    if (date && amount !== 0 && description) {
      return {
        date: convertDateFormat(date),
        amount: Math.abs(amount),
        description: description,
        type: amount < 0 ? 'DEBIT' : 'CREDIT'
      };
    }
    
  } catch (error) {
    console.error('Erro ao processar linha:', error);
  }
  
  return null;
}

function convertDateFormat(dateStr: string): string {
  try {
    // Converter dd/mm/yyyy para yyyy-mm-dd
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('Erro ao converter data:', error);
  }
  return dateStr;
}

function generateOFX(transactions: Transaction[], bankName: string): string {
  const now = new Date();
  const dtserver = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);
  
  let ofxContent = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0</CODE>
<SEVERITY>INFO</SEVERITY>
</STATUS>
<DTSERVER>${dtserver}</DTSERVER>
<LANGUAGE>POR</LANGUAGE>
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTRS>
<CURDEF>BRL</CURDEF>
<BANKACCTFROM>
<BANKID>001</BANKID>
<ACCTID>12345678</ACCTID>
<ACCTTYPE>CHECKING</ACCTTYPE>
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20240101</DTSTART>
<DTEND>20241231</DTEND>
`;

  transactions.forEach((transaction, index) => {
    const dtposted = transaction.date.replace(/-/g, '');
    const trnamt = transaction.type === 'DEBIT' ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);
    
    ofxContent += `<STMTTRN>
<TRNTYPE>${transaction.type === 'DEBIT' ? 'DEBIT' : 'CREDIT'}</TRNTYPE>
<DTPOSTED>${dtposted}</DTPOSTED>
<TRNAMT>${trnamt.toFixed(2)}</TRNAMT>
<FITID>TXN${index + 1}_${Date.now()}</FITID>
<MEMO>${transaction.description}</MEMO>
</STMTTRN>
`;
  });

  ofxContent += `</BANKTRANLIST>
</STMTRS>
</BANKMSGSRSV1>
</OFX>`;

  return ofxContent;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const layoutId = formData.get('layoutId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo PDF é obrigatório' }, { status: 400 });
    }

    if (!layoutId) {
      return NextResponse.json({ error: 'ID do layout é obrigatório' }, { status: 400 });
    }

    // Carregar configuração do layout
    const layoutFile = path.join(LAYOUTS_DIR, `${layoutId}.json`);
    if (!fs.existsSync(layoutFile)) {
      return NextResponse.json({ error: 'Layout não encontrado' }, { status: 404 });
    }

    const layout: LayoutConfig = JSON.parse(fs.readFileSync(layoutFile, 'utf8'));

    // Simular extração do texto do PDF
    // Em um sistema real, aqui usaria uma biblioteca como pdf2pic ou pdf-parse
    const simulatedPdfText = `
    01/11/2024  PAGAMENTO PIX RECEBIDO          +1.250,00  12.500,00
    02/11/2024  TED TRANSFERENCIA ENVIADA       -850,50   11.649,50
    03/11/2024  COMPRA CARTAO DEBITO            -45,90    11.603,60
    04/11/2024  DEPOSITO CONTA CORRENTE         +2.000,00 13.603,60
    05/11/2024  SAQUE TERMINAL ELETRONICO       -200,00   13.403,60
    `;

    // Extrair transações baseado no layout
    const transactions = extractTextWithLayout(simulatedPdfText, layout);

    if (transactions.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhuma transação foi encontrada. Verifique se o layout está configurado corretamente.' 
      }, { status: 422 });
    }

    // Gerar OFX
    const ofxContent = generateOFX(transactions, layout.bankName);

    return NextResponse.json({
      success: true,
      transactions,
      ofx: ofxContent,
      layoutUsed: {
        id: layout.id,
        bankName: layout.bankName,
        columnsCount: layout.columns.length
      },
      summary: {
        totalTransactions: transactions.length,
        totalCredits: transactions.filter(t => t.type === 'CREDIT').length,
        totalDebits: transactions.filter(t => t.type === 'DEBIT').length,
        totalAmount: transactions.reduce((sum, t) => {
          return sum + (t.type === 'CREDIT' ? t.amount : -t.amount);
        }, 0)
      }
    });

  } catch (error) {
    console.error('Erro ao processar PDF com layout:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor ao processar PDF' 
    }, { status: 500 });
  }
}