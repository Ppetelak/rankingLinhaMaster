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
app.use("/assets", express.static("assets"));
app.set("view engine", "ejs");

const upload = multer({ dest: 'uploads/' });

async function processExcel(filePath, tableName, insertQuery, columns) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: columns });

    console.log(sheet); // Verificando a estrutura dos dados

    const connection = await mysql.createConnection(config);
    await connection.query(`DELETE FROM ${tableName}`);

    for (const row of sheet) {
        await connection.query(insertQuery, Object.values(row));
    }

    await connection.end();
}

async function handleUpload(req, res, tableName, insertQuery, columns) {
    try {
        if (!req.file) {
        return res.render('upload', { message: 'Nenhum arquivo foi enviado.', messageType: 'danger' });
        }

        await processExcel(req.file.path, tableName, insertQuery, columns);

        res.render('carregarArquivos', { message: `Dados de ${tableName} inseridos com sucesso.`, messageType: 'success' });
    } catch (error) {
        console.error('Erro ao processar o upload do arquivo:', error);
        res.render('carregarArquivos', { message: 'Erro ao processar o upload do arquivo.', messageType: 'danger' });
    }
}

app.post('/upload/corretores', upload.single('file'), (req, res) => {
    const columns = ['cpfCorretor', 'nome', 'pontos'];
    const insertQuery = 'INSERT INTO corretores (numeroDocumento, nome, pontos) VALUES (?, ?, ?)';
    handleUpload(req, res, 'corretores', insertQuery, columns);
});

app.post('/upload/corretoras', upload.single('file'), (req, res) => {
    const columns = ['cnpjCorretora', 'nome', 'pontos'];
    const insertQuery = 'INSERT INTO corretoras (numeroDocumento, nome, pontos) VALUES (?, ?, ?)';
    handleUpload(req, res, 'Corretoras', insertQuery, columns);
});

app.post('/upload/supervisores', upload.single('file'), (req, res) => {
    const columns = ['cpfSupervisor', 'nome', 'pontos'];
    const insertQuery = 'INSERT INTO supervisores (numeroDocumento, nome, pontos) VALUES (?, ?, ?)';
    handleUpload(req, res, 'Supervisores', insertQuery, columns);
});

app.get('/ranking', (req, res) => {
    res.render('ranking')
})

app.get('/consultaRanking/:numeroDocumento/:funcao', async (req, res) => {
    const numeroDocumento = req.params.numeroDocumento;
    const funcao = req.params.funcao;

    const selectRanking = `
    WITH Ranked AS (
        SELECT 
            numeroDocumento,
            nome,
            pontos,
            DENSE_RANK() OVER (
                ORDER BY pontos DESC, nome ASC
            ) AS ranking
        FROM 
            ${funcao}
    )
    SELECT 
        numeroDocumento,
        nome,
        pontos,
        ranking
    FROM 
        Ranked
    WHERE 
        numeroDocumento = ${numeroDocumento};
    `;

    try {
        const connection = await mysql.createConnection(config);
        const result = await connection.query(selectRanking, [numeroDocumento]);
        connection.end();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao consultar o ranking' });
    }
});

app.get('/uploadArquivos', (req,res) => {
    res.render("carregarArquivos", { message: 'Insira uma planilha por vez e faça upload.', messageType: 'success' });
})

app.get('/', (req, res) => {
    res.render("index");
})

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
