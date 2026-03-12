export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada no servidor.' });
  }

  try {
    const { base64, filename } = req.body;

    if (!base64) {
      return res.status(400).json({ error: 'PDF base64 não enviado.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 }
            },
            {
              type: 'text',
              text: `Você é um extrator especializado em Notas Fiscais brasileiras de transporte de materiais (areia, pedra, brita).

Leia este PDF e retorne SOMENTE um JSON válido, sem texto extra, sem markdown:

{"numero_nf":"apenas os dígitos","data":"YYYY-MM-DD","peso_carga_kg":número inteiro em KG (se vier em toneladas multiplique por 1000),"placa":"placa sem hífen ex ABC1D23","material":"nome do material em MAIÚSCULAS"}

Se não encontrar um campo retorne null.`
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const text = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json({ ok: true, data: parsed, filename });

  } catch (err) {
    console.error('Erro na API:', err);
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
}
