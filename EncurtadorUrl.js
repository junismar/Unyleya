const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'junismaralves',
    password: '123456',
    database: 'encurtadorurl'
});

db.connect(err => {
    if (err) throw err;
    console.log('Conexão com o banco de dados estabelecida.');
});

function generateShortURL() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const urlLength  = 10; // Tamanho desejado para a URL curta

    let url_curta = '';

    for (let i = 0; i < urlLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        url_curta += characters.charAt(randomIndex);
    }
    return url_curta;
}

// Rota para encurtar uma URL e persisti-la no banco de dados
app.post('/encurtar', (req, res) => {
    const { url_original } = req.body;

    // Verifica se a url_original é válida
    if (!url_original) {
        res.status(400).json({ error: 'Valor inválido para url_original' });
        return;
    }

    // Gera uma url_curta
    const url_curta = generateShortURL();

    const query = 'INSERT INTO url (url_original, url_curta) VALUES (?, ?)';
    db.query(query, [url_original, url_curta], (err, result) => {
        if (err) throw err;
        res.json({ url_curta });
    });
});

// Rota para retornar a URL original com base no ID
app.get('/url/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT url_original FROM url WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.json({ url_original: result[0].url_original });
        } else {
            res.status(404).json({ error: 'URL não encontrada.' });
        }
    });
});

// Rota para retornar todas as URLs encurtadas em uma data específica Exemplo: "2023-10-26"
app.get('/urls/:data', (req, res) => {
    const data = req.params.data;
    const query = 'SELECT * FROM url WHERE DATE(data_criacao) = ?';
    db.query(query, [data], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Rota para redirecionar para a URL original com base no encurtamento
app.get('/:url_curta', (req, res) => {
    const url_curta = req.params.url_curta;
    const query = 'SELECT url_original FROM url WHERE url_curta = ?';
    db.query(query, [url_curta], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro interno do servidor.' });
            return;
        }
        
        if (result.length > 0) {
            // Redirecionar para a URL original
            const url_original = result[0].url_original;
            
            // Certifique-se de que não estamos redirecionando para a própria URL curta
            if (url_original !== req.originalUrl) {
                res.redirect(301, url_original); // Redirecionamento permanente
            } else {
                res.status(400).json({ error: 'URL curta inválida.' });
            }
        } else {
            res.status(404).json({ error: 'URL encurtada não encontrada.' });
        }
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor está executando na porta ${port}`);
});