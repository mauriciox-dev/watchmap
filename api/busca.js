// api/busca.js

// Esta é uma função que roda no servidor da Vercel (Node.js)
// Ela recebe um pedido (req) e devolve uma resposta (res)
export default async function handler(req, res) {
    // 1. Pegamos o que o usuário digitou na busca (vem na URL depois do '?q=')
    const { q: termoBuscado } = req.query;

    // 2. Pegamos a chave segura de dentro do "Cofre" da Vercel
    const apiKey = process.env.TMDB_API_KEY;

    if (!termoBuscado) {
      return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }

    // 3. O servidor monta a URL para o TMDB (aqui é seguro usar a chave)
    const urlTMDB = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(termoBuscado)}&language=pt-BR`;

    try {
      // 4. O servidor chama o TMDB
      const response = await fetch(urlTMDB);
      const data = await response.json();

      // 5. Devolvemos os dados puros para o seu site, sem mostrar a chave
      res.status(200).json(data);

    } catch (error) {
      console.error('Erro na busca:', error);
      res.status(500).json({ error: 'Erro ao buscar dados do TMDB' });
    }
  }