// api/detalhes.js

export default async function handler(req, res) {
    // 1. Pegamos o ID e o TIPO (movie ou tv) que o front enviou na URL
    const { id, type } = req.query;

    // 2. Pegamos a chave do cofre
    const apiKey = process.env.TMDB_API_KEY;

    if (!id || !type) {
      return res.status(400).json({ error: 'ID e Type são obrigatórios' });
    }

    // 3. Montamos a URL certa dependendo se é filme ou série
    // Nota: aqui usamos a base https://api.themoviedb.org/3/
    const urlTMDB = `https://api.themoviedb.org/3/${type}/${id}/watch/providers?api_key=${apiKey}`;

    try {
      // 4. Chama o TMDB
      const response = await fetch(urlTMDB);
      const data = await response.json();

      // 5. Devolve os dados seguros para o front
      res.status(200).json(data);

    } catch (error) {
      console.error('Erro nos detalhes:', error);
      res.status(500).json({ error: 'Erro ao buscar providers do TMDB' });
    }
  }