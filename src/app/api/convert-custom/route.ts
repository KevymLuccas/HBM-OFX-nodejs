import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const layoutData = formData.get('layout') as string;
    
    if (!pdfFile || !layoutData) {
      return NextResponse.json({ error: 'PDF e layout são obrigatórios' }, { status: 400 });
    }

    const layout: Layout = JSON.parse(layoutData);

    // Simular extração de texto do PDF
    const simulatedText = `DATA|VALOR|HISTÓRICO
01/12/2025|-150.00|COMPRA CARTAO - SUPERMERCADO XYZ
02/12/2025|2500.00|TED RECEBIDA - JOAO SILVA
03/12/2025|-85.50|PIX ENVIADO - MARIA SANTOS
04/12/2025|-45.00|TARIFA MANUTENCAO CONTA
05/12/2025|1200.00|SALARIO - EMPRESA ABC LTDA
06/12/2025|-200.00|SAQUE CAIXA ELETRONICO
07/12/2025|500.00|PIX RECEBIDO - FREELANCE
08/12/2025|-75.30|COMPRA DEBITO - FARMACIA DEF
09/12/2025|-120.00|CONTA TELEFONE
10/12/2025|800.00|TRANSFERENCIA RECEBIDA`;

    // Processar dados com base no layout personalizado
    const lines = simulatedText.split('\n').slice(layout.skipLines + 1); // Pular linhas de cabeçalho
    const transactions = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const fields = line.split(layout.separator);
      const transaction: any = {};
      let hasRequiredFields = false;

      // Mapear campos conforme configuração
      layout.columns.forEach(column => {
        if (column.position < fields.length) {
          const value = fields[column.position]?.trim();
          
          switch (column.type) {
            case 'date':
              transaction.date = parseDate(value, layout.dateFormat);
              hasRequiredFields = true;
              break;
            case 'value':
              transaction.amount = parseAmount(value);
              hasRequiredFields = true;
              break;
            case 'description':
              transaction.description = value;
              hasRequiredFields = true;
              break;
          }
        }
      });

      // Só adicionar se tiver os campos obrigatórios
      if (hasRequiredFields && transaction.date && transaction.amount && transaction.description) {
        transactions.push({
          ...transaction,
          id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: transaction.amount > 0 ? 'CREDIT' : 'DEBIT'
        });
      }
    }

    // Gerar arquivo OFX
    const ofxContent = generateOFX(transactions, layout.bankName);

    return NextResponse.json({
      success: true,
      message: `${transactions.length} transações processadas com layout personalizado`,
      transactions: transactions.slice(0, 5), // Preview das primeiras 5
      total: transactions.length,
      ofxContent,
      layoutUsed: {
        name: layout.name,
        bankName: layout.bankName,
        columnsProcessed: layout.columns.filter(c => c.type !== 'ignore').length
      }
    });

  } catch (error) {
    console.error('Erro ao processar PDF com layout personalizado:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor ao processar PDF',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

function parseDate(dateStr: string, format: string): string {
  // Converter data para formato ISO
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function parseAmount(amountStr: string): number {
  // Converter string de valor para número
  try {
    const cleaned = amountStr.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  } catch {
    return 0;
  }
}

function generateOFX(transactions: any[], bankName: string): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:]/g, '').split('T')[0] + '120000';
  
  let ofxTransactions = '';
  
  transactions.forEach(transaction => {
    const dateFormatted = transaction.date.replace(/-/g, '') + '120000';
    const amount = Math.abs(transaction.amount).toFixed(2);
    const trnType = transaction.type === 'CREDIT' ? 'CREDIT' : 'DEBIT';
    
    ofxTransactions += `
      <STMTTRN>
        <TRNTYPE>${trnType}</TRNTYPE>
        <DTPOSTED>${dateFormatted}</DTPOSTED>
        <TRNAMT>${transaction.amount.toFixed(2)}</TRNAMT>
        <FITID>${transaction.id}</FITID>
        <MEMO>${transaction.description}</MEMO>
      </STMTTRN>`;
  });

  return `OFXHEADER:100
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
      <DTSERVER>${dateStr}</DTSERVER>
      <LANGUAGE>POR</LANGUAGE>
    </SONRS>
  </SIGNONMSGSRSV1>
  
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1</TRNUID>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <STMTRS>
        <CURDEF>BRL</CURDEF>
        <BANKACCTFROM>
          <BANKID>001</BANKID>
          <ACCTID>LAYOUT_PERSONALIZADO</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>${dateStr}</DTSTART>
          <DTEND>${dateStr}</DTEND>
          ${ofxTransactions}
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;
}