import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

const BANK_PATTERNS = {
  // Detecção automática
  auto: {
    detect: (text: string) => {
      const lower = text.toLowerCase();
      if (lower.includes('banco do brasil') || lower.includes('001-9')) return 'bb_layout1';
      if (lower.includes('itaú') || lower.includes('341-7')) return 'itau_layout1';
      if (lower.includes('santander') || lower.includes('033-7')) return 'santander_layout1';
      if (lower.includes('safra') || lower.includes('422-7')) return 'safra_layout1';
      if (lower.includes('sicoob') || lower.includes('756-0')) return 'sicoob_layout1';
      if (lower.includes('sicredi') || lower.includes('748-6')) return 'sicredi_layout1';
      if (lower.includes('pagseguro') || lower.includes('290-7')) return 'pagseguro_layout1';
      if (lower.includes('revolution') || lower.includes('cora')) return 'revolution_layout1';
      return 'generico';
    }
  },

  // Banco do Brasil Layout 1
  bb_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  // Itaú Layout 1  
  itau_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  // Santander Layout 1
  santander_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  // Safra Layout 1
  safra_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  // Sicoob Layout 1
  sicoob_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  // Sicoob Layout 2
  sicoob_layout2: {
    pattern: /(\d{2}\/\d{2})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month] = date.split('/');
      const year = new Date().getFullYear();
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  // Sicredi Layout 1
  sicredi_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  // Sicredi Layout 2
  sicredi_layout2: {
    pattern: /(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('-');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  // PagSeguro Layout Padrão
  pagseguro_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+R\$\s*([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  // Revolution/Cora Layout Padrão
  revolution_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  // Padrão genérico
  generico: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const selectedBankType = formData.get('bankType') as string || 'auto';
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Converter File para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extrair texto do PDF
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text;

    // Determinar o tipo de banco
    let bankType = selectedBankType;
    if (selectedBankType === 'auto') {
      bankType = BANK_PATTERNS.auto.detect(pdfText);
    }
    
    // Processar extrato com o padrão específico
    const bankConfig = BANK_PATTERNS[bankType] || BANK_PATTERNS.generico;
    const transactions = extractTransactions(pdfText, bankConfig);
    
    // Gerar OFX
    const ofxContent = generateOFX(transactions, bankType);

    return NextResponse.json({
      success: true,
      bankType: bankType,
      layoutUsed: bankType,
      transactionCount: transactions.length,
      ofxContent,
      detectedText: pdfText.substring(0, 500) // Para debug
    });

  } catch (error) {
    console.error('Erro na conversão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    );
  }
}

function extractTransactions(text: string, config: any) {
  const transactions = [];
  let match;

  while ((match = config.pattern.exec(text)) !== null) {
    const [, date, description, amount] = match;
    
    // Limpar descrição
    const cleanDesc = description.trim().replace(/\s+/g, ' ');
    
    // Converter valor
    const cleanAmount = parseFloat(amount.replace(/[.,](\d{2})$/, '.').replace(/[^\d.-]/g, ''));
    
    if (!isNaN(cleanAmount) && cleanDesc.length > 2) {
      transactions.push({
        date: config.dateFormat(date),
        description: cleanDesc,
        amount: cleanAmount
      });
    }
  }

  return transactions;
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
<ACCTID>123456-
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>000000
<DTEND>000000
;

  transactions.forEach((transaction, index) => {
    const type = transaction.amount < 0 ? 'DEBIT' : 'CREDIT';
    const fitId = ${bankType}__;
    
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
