const { 
    mysql,
    config
    } = require("./database");
const express = require("express");
const app = new express();
const ejs = require("ejs");
const multer = require('multer');
const XLSX = require('xlsx');
const port = process.env.PORT || 8888;

/*CONDIÇÕES DE USO DA APLICAÇÃO */

app.use("/css", express.static("css"));
app.use("/js", express.static("js"));
app.set("view engine", "ejs");

const upload = multer({ dest: 'uploads/' });

async function processExcel(filePath, tableName, insertQuery) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(sheet);

    /* const connection = await mysql.createConnection(config);
    await connection.query(`DELETE FROM ${tableName}`);

    for (const row of sheet) {
        await connection.query(insertQuery, Object.values(row));
    }

    await connection.end(); */
}

app.get('/uploadArquivos', (req,res) => {
    res.render("carregarArquivos");
})

app.post('/upload/corretores', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Nenhum arquivo foi enviado.');
        }

        const insertQuery = 'INSERT INTO corretores (cpfCorretor, nomeCorretor, pontos) VALUES (?, ?, ?)';
        await processExcel(req.file.path, 'corretores', insertQuery);

        res.send('Dados dos corretores inseridos com sucesso.');
    } catch (error) {
        console.error('Erro ao processar o upload do arquivo:', error);
        res.status(500).send('Erro ao processar o upload do arquivo.');
    }
});

app.get('/', (req, res) => {
    res.render("index");
})

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
