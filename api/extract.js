import { Buffer } from 'buffer';

async function extrairTextoPDF(base64) {
  const buffer = Buffer.from(base64, 'base64');
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const data = await pdfParse(buffer);
  return { text: data.text, words: null }; // pdf-parse não dá coordenadas
}

// Extrator por coordenadas X — usa pdfjs-dist no edge
// Como pdf-parse não tem coordenadas, usamos regex robusto no texto
function parsearDANFE(texto) {
  const r = {};

  // ── Número da NF ────────────────────────────────────────────────
  const mNF = texto.match(/N[º°o][:\s]+(\d{3,6})/);
  if (mNF) r.numero_nf = mNF[1];

  // ── Data de saída (ou emissão) ───────────────────────────────────
  let mData = texto.match(/DATA DE SA[IÍ]DA\s+(\d{2}\/\d{2}\/\d{4})/);
  if (!mData) mData = texto.match(/Emiss[ãa]o\s+(\d{2}\/\d{2}\/\d{4})/);
  if (!mData) mData = texto.match(/DATA DE EMISS[ÃA]O\s+(\d{2}\/\d{2}\/\d{4})/);
  if (mData) {
    const [d, mo, y] = mData[1].split('/');
    r.data = `${y}-${mo}-${d}`;
  }

  // ── Placa ────────────────────────────────────────────────────────
  const mPlaca = texto.match(/\b([A-Z]{3}[-\s]?\d[A-Z0-9]\d{2})\b/);
  r.placa = mPlaca ? mPlaca[1].replace(/[-\s]/g, '') : null;

  // ── Produto: linha com UNIDADE + QUANTIDADE ──────────────────────
  // Formato da linha no texto extraído:
  // "AMT AREIA MEDIA LAVADA 25051000 0102 5102 TON 19,9600 110,0000 2.195,60 ..."
  // Estratégia: achar padrão "UNIDADE QUANTIDADE" onde UNIDADE = TON|M3|KG|UN
  // e QUANTIDADE = número decimal brasileiro (ex: 19,9600)

  const linhas = texto.split('\n');
  for (const linha of linhas) {
    // Linha de produto contém: código NCM (8 dígitos) + CFOP (4 dígitos) + unidade + quant
    const mLinha = linha.match(
      /\d{7,8}\s+\d{4}\s+\d{4}\s+(TON|M3|KG|UN)\s+([\d,]+)/
    );
    if (mLinha) {
      const unidade = mLinha[1];
      const qtd = parseFloat(mLinha[2].replace(',', '.'));

      if (unidade === 'TON')      r.peso_carga_kg = Math.round(qtd * 1000);
      else if (unidade === 'KG')  r.peso_carga_kg = Math.round(qtd);
      else                        r.peso_carga_kg = Math.round(qtd * 1000);

      // Material: tudo entre o código do produto (2-5 chars) e o NCM
      // Ex: "AMT AREIA MEDIA LAVADA 25051000..."
      const mMat = linha.match(/^[A-Z]{2,5}\s+(.+?)\s+\d{7,8}/);
      if (mMat) r.material = mMat[1].trim().toUpperCase();

      break;
    }
  }

  return r;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64, filename } = req.body;
    if (!base64) return res.status(400).json({ error: 'PDF não enviado.' });

    const { text } = await extrairTextoPDF(base64);
    const dados = parsearDANFE(text);

    if (!dados.numero_nf) {
      return res.status(422).json({ 
        error: 'PDF não reconhecido como DANFE. Verifique se o arquivo é uma Nota Fiscal eletrônica válida.' 
      });
    }

    return res.status(200).json({ ok: true, data: dados, filename });

  } catch (err) {
    console.error('Erro:', err);
    return res.status(500).json({ error: err.message || 'Erro interno.' });
  }
}
 
