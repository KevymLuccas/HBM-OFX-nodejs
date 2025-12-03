import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Converter File para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extrair texto do PDF
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text;

    // Detectar tipo de banco baseado no conteúdo
    const bankType = detectBankType(pdfText);
    
    // Processar extrato baseado no tipo de banco
    const transactions = processStatementByBank(pdfText, bankType);
    
    // Gerar OFX
    const ofxContent = generateOFX(transactions, bankType);

    return NextResponse.json({
      success: true,
      bankType,
      transactionCount: transactions.length,
      ofxContent
    });

  } catch (error) {
    console.error('Erro na conversão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function detectBankType(text: string): string {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('banco do brasil') || textLower.includes('001-9')) {
    return 'bb';
  } else if (textLower.includes('caixa econômica') || textLower.includes('104-0')) {
    return 'caixa';
  } else if (textLower.includes('bradesco') || textLower.includes('237-2')) {
    return 'bradesco';
  } else if (textLower.includes('itaú') || textLower.includes('341-7')) {
    return 'itau';
  } else if (textLower.includes('santander') || textLower.includes('033-7')) {
    return 'santander';
  } else if (textLower.includes('nubank') || textLower.includes('nu pagamentos')) {
    return 'nubank';
  }
  
  return 'generico';
}

function processStatementByBank(text: string, bankType: string) {
  const transactions = [];
  
  // Padrões regex básicos para diferentes bancos
  const patterns = {
    bb: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\d+[,]\d{2})/g,
    caixa: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\d+[,]\d{2})/g,
    bradesco: /(\d{2}\/\d{2})\s+(.+?)\s+([-]?\d+[,]\d{2})/g,
    itau: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\d+[,]\d{2})/g,
    santander: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\d+[,]\d{2})/g,
    nubank: /(\d{2}\s\w{3}\s\d{4})\s+(.+?)\s+R\$\s*([-]?\d+[,]\d{2})/g,
    generico: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\d+[,]\d{2})/g
  };

  const pattern = patterns[bankType] || patterns.generico;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const [, date, description, amount] = match;
    
    transactions.push({
      date: formatDate(date, bankType),
      description: description.trim(),
      amount: parseFloat(amount.replace(',', '.'))
    });
  }

  return transactions;
}

function formatDate(dateStr: string, bankType: string): string {
  // Converter diferentes formatos de data para YYYYMMDD
  if (bankType === 'nubank') {
    // Formato: "02 NOV 2024"
    const months = {
      'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04',
      'MAI': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
      'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
    };
    const [day, month, year] = dateStr.split(' ');
    return year + months[month] + day.padStart(2, '0');
  } else {
    // Formato DD/MM/YYYY ou DD/MM
    const parts = dateStr.split('/');
    if (parts.length === 2) {
      // Assumir ano atual se não fornecido
      const currentYear = new Date().getFullYear();
      return currentYear + parts[1].padStart(2, '0') + parts[0].padStart(2, '0');
    } else {
      return parts[2] + parts[1].padStart(2, '0') + parts[0].padStart(2, '0');
    }
  }
}

function generateOFX(transactions: any[], bankType: string): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  let ofx = OFXHEADER:100
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
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>000000
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<ACCTID>123456
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>000000
<DTEND>000000
;

  transactions.forEach((transaction, index) => {
    const type = transaction.amount < 0 ? 'DEBIT' : 'CREDIT';
    ofx += <STMTTRN>
<TRNTYPE>
<DTPOSTED>000000
<TRNAMT>
<FITID>
<MEMO>
</STMTTRN>
;
  });

  ofx += </BANKTRANLIST>
<LEDGERBAL>
<BALAMT>0.00
<DTASOF>000000
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>;

  return ofx;
}
