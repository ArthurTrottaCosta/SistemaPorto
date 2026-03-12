import { Buffer } from 'buffer';

async function extrairTextoPDF(base64) {
  const buffer = Buffer.from(base64, 'base64');
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

function parsearDANFE(texto) {
  const r = {};

  // Número da NF
  const mNF = texto.match(/N[º°o][:\s]+(\d{3,6})/);
  if (mNF) r.numero_nf = mNF[1];

  // Data: tenta DATA DE SAÍDA, depois emissão
  let mData = texto.match(/DATA DE SA[IÍ]DA\s+(\d{2}\/\d{2}\/\d{4})/);
  if (!mData) mData = texto.match(/Emiss[ãa]o\s+(\d{2}\/\d{2}\/\d{4})/);
  if (!mData) mData = texto.match(/DATA DE EMISS[ÃA]O\s+(\d{2}\/\d{2}\/\d{4})/);
  if (mData) {
    const [d, mo, y] = mData[1].split('/');
    r.data = `${y}-${mo}-${d}`;
  }

  // Placa (padrão antigo ABC-1234 ou Mercosul ABC1D23)
  const mPlaca = texto.match(/\b([A-Z]{3}[-\s]?\d[A-Z0-9]\d{2})\b/);
  r.placa = mPlaca ? mPlaca[1].replace(/[-\s]/g, '') : null;

  // Produto: cód material unidade quantidade
  const mProd = texto.match(
    /^([A-Z]{2,5})\s+(.+?)\s+\d{6,8}\s+\d+\s+\d+\s+(TON|M3|KG|UN)\s+([\d,]+)/m
  );
  if (mProd) {
    r.material = mProd[2].trim().toUpperCase();
    const unidade = mProd[3];
    const qtd = parseFloat(mProd[4].replace(',', '.'));
    if (unidade === 'TON')     r.peso_carga_kg = Math.round(qtd * 1000);
    else if (unidade === 'KG') r.peso_carga_kg = Math.round(qtd);
    else                       r.peso_carga_kg = Math.round(qtd * 1000);
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

    const texto = await extrairTextoPDF(base64);
    const dados = parsearDANFE(texto);

    if (!dados.numero_nf) {
      return res.status(422).json({ error: 'PDF não reconhecido como DANFE. Verifique o arquivo.' });
    }

    return res.status(200).json({ ok: true, data: dados, filename });

  } catch (err) {
    console.error('Erro:', err);
    return res.status(500).json({ error: err.message || 'Erro interno.' });
  }
}
