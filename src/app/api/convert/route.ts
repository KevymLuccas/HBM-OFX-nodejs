import { NextRequest, NextResponse } from 'next/server';

const BANK_PATTERNS = {
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

  bb_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  itau_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  santander_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  safra_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  sicoob_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  sicoob_layout2: {
    pattern: /(\d{2}\/\d{2})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month] = date.split('/');
      const year = new Date().getFullYear();
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  sicredi_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  sicredi_layout2: {
    pattern: /(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('-');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  pagseguro_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+R\$\s*([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

  revolution_layout1: {
    pattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\d+[.,]\d{2})/g,
    dateFormat: (date: string) => {
      const [day, month, year] = date.split('/');
      return year + month.padStart(2, '0') + day.padStart(2, '0');
    }
  },

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Simular extração de texto por enquanto
    const pdfText = 'BANCO DO BRASIL 25/11/2025 PIX RECEBIDO 150.50';

    let bankType = selectedBankType;
    if (selectedBankType === 'auto') {
      bankType = BANK_PATTERNS.auto.detect(pdfText);
    }
    
    const bankConfig = BANK_PATTERNS[bankType as keyof typeof BANK_PATTERNS] || BANK_PATTERNS.generico;
    const transactions = extractTransactions(pdfText, bankConfig);
    const ofxContent = generateOFX(transactions, bankType);

    return NextResponse.json({
      success: true,
      bankType: bankType,
      layoutUsed: bankType,
      transactionCount: transactions.length,
      ofxContent,
      detectedText: pdfText.substring(0, 500)
    });

  } catch (error: any) {
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
    const cleanDesc = description.trim().replace(/\s+/g, ' ');
    const cleanAmount = parseFloat(amount.replace(/[.,](\d{2})$/, '.$1').replace(/[^\d.-]/g, ''));
    
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
  
  let ofx = `OFXHEADER:100
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
<DTSERVER>${today}000000</DTSERVER>
<LANGUAGE>POR</LANGUAGE>
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001</TRNUID>
<STATUS>
<CODE>0</CODE>
<SEVERITY>INFO</SEVERITY>
</STATUS>
<STMTRS>
<CURDEF>BRL</CURDEF>
<BANKACCTFROM>
<BANKID>001</BANKID>
<ACCTID>123456-${bankType}</ACCTID>
<ACCTTYPE>CHECKING</ACCTTYPE>
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${today}000000</DTSTART>
<DTEND>${today}000000</DTEND>`;

  transactions.forEach((transaction, index) => {
    const type = transaction.amount < 0 ? 'DEBIT' : 'CREDIT';
    const fitId = `${bankType}_${Date.now()}_${index}`;
    
    ofx += `
<STMTTRN>
<TRNTYPE>${type}</TRNTYPE>
<DTPOSTED>${transaction.date}000000</DTPOSTED>
<TRNAMT>${transaction.amount.toFixed(2)}</TRNAMT>
<FITID>${fitId}</FITID>
<MEMO>${transaction.description.substring(0, 80)}</MEMO>
</STMTTRN>`;
  });

  ofx += `
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>0.00</BALAMT>
<DTASOF>${today}000000</DTASOF>
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

  return ofx;
}
