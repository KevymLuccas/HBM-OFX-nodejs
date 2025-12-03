const fs = require('fs');
const pdfParse = require('pdf-parse').default || require('pdf-parse');

async function analyzePDF() {
  try {
    const pdfPath = 'G:/Contabilidade/CONTROLADORIA/Organização/BANCO_DO_BRASIL/LAYOUT_1/09-2025 Banco do Brasil setemb.pdf';
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    
    console.log('=== BANCO DO BRASIL LAYOUT 1 ===');
    console.log('Total chars:', data.text.length);
    console.log('\nPrimeiras linhas relevantes:');
    
    const lines = data.text.split('\n');
    let found = 0;
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if(trimmed && /\d{2}\/\d{2}/.test(trimmed) && found < 15) {
        console.log('Linha ' + i + ': ' + trimmed.substring(0, 120));
        found++;
      }
    });
  } catch(err) {
    console.log('Erro:', err.message);
  }
}

analyzePDF();
