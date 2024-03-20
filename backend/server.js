const express = require('express');
const bodyParser = require('body-parser'); // Importa body-parser
const app = express();
const mysql = require('mysql');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const Excel = require('exceljs'); 
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(cors());

// Utiliza body-parser para analizar solicitudes con cuerpo JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Configura el transporter para enviar correos electrónicos
const transporter = nodemailer.createTransport({
    //service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'mendozachateluis@gmail.com',
        pass: 'ubid rswe atnd vbbx'
    },
    tls: {
        rejectUnauthorized: false
    }
});

const db = mysql.createConnection({
    //host: 'sql3.freemysqlhosting.net',
    //user: 'sql3692502',
    //password: 'B3n5sLruaB',
    //database: 'sql3692502'
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'catalog_products'
})

const multer = require('multer');

// Configurar multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/') // Directorio donde se almacenarán los archivos
    },
    filename: function (req, file, cb) {
      // Establecer el nombre del archivo
      cb(null, Date.now() + '-' + file.originalname)
    }
  });
  
  const upload = multer({ storage: storage });

  const storage_post = multer.memoryStorage();
  const upload_post = multer({ storage: storage_post });

/*  
app.post('/login', (req, res) => {

    const sql = "SELECT r.role_id, p.permission_name FROM user u " +
                "JOIN user_roles ur ON u.id = ur.user_id " +
                "JOIN roles r ON ur.role_id = r.role_id " +
                "JOIN role_permissions rp ON r.role_id = rp.role_id " +
                "JOIN permissions p ON rp.permission_id = p.permission_id " +
                "WHERE u.username = ? AND u.password = ?";

    db.query(sql, [req.body.user, req.body.password], (err, data) => {
        if (err) return res.json("Error");

        if (data.length > 0) {
            const permissions = data.map(row => row.permission_name);
            return res.json({ status: "Correcto", permissions: permissions });
        } else {
            return res.json("No hay registro");
        }
    })

})
*/

app.post('/login', (req, res) => {
    const username = req.body.user;
    const password = req.body.password;

    const sql = "SELECT u.id, u.password, r.role_id, p.permission_name FROM user u " +
                "JOIN user_roles ur ON u.id = ur.user_id " +
                "JOIN roles r ON ur.role_id = r.role_id " +
                "JOIN role_permissions rp ON r.role_id = rp.role_id " +
                "JOIN permissions p ON rp.permission_id = p.permission_id " +
                "WHERE u.username = ?";

    db.query(sql, [username], (err, data) => {
        if (err) return res.json("Error");

        if (data.length > 0) {
            const user = data[0];
            // Comparar la contraseña cifrada almacenada en la base de datos con la contraseña proporcionada por el usuario
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) return res.json("Error");

                if (result) {
                    // Generar JWT
                    const token = jwt.sign({ id: user.id, username: username }, 'secret_key', { expiresIn: '1h' });

                    // Contraseña válida, devolver JWT y permisos del usuario
                    const permissions = data.map(row => row.permission_name);
                    return res.json({ status: "Correcto", token: token, permissions: permissions });
                } else {
                    // Contraseña incorrecta
                    return res.json("Contraseña incorrecta");
                }
            });
        } else {
            return res.json("No hay registro");
        }
    });
});

app.post('/register', (req, res) => {
    const username = req.body.user;
    const password = req.body.password;

    // Generar un hash de la contraseña usando bcrypt
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.json("Error al cifrar la contraseña");

        const sql = "INSERT INTO user (username, password) VALUES (?, ?)";
        db.query(sql, [username, hash], (err, result) => {
            if (err) return res.json("Error al registrar el usuario");

            return res.json("Usuario registrado correctamente");
        });
    });
});

app.get('/productos', (req, res) => {
    const sql = `SELECT p.idProducto, p.NombreProducto, m.NombreMarca, mo.NombreModelo, c.NombreColor, t.NombreTalla, p.Imagen, p.PrecioVenta
                FROM producto p
                JOIN marca m ON p.idMarca = m.idMarca
                JOIN modelo mo ON p.idModelo = mo.idModelo
                JOIN color c ON p.idColor = c.idColor
                JOIN talla t ON p.idTalla = t.idTalla
                ORDER BY p.idProducto DESC`;

    db.query(sql, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener los registros de productos" });
        }

        return res.json(data);
    });
});

app.get('/detail_product', (req, res) => {
    const sql = {
        marca: `SELECT idMarca, NombreMarca FROM marca`,
        modelo: `SELECT idModelo, NombreModelo FROM modelo`,
        color: `SELECT idColor, NombreColor FROM color`,
        talla: `SELECT idTalla, NombreTalla FROM talla`
    };

    const resultados = {};

    db.query(sql.marca, (err, marcas) => {
        if (err) {
            console.error("Error al obtener registros de Marca:", err);
            return res.status(500).json({ error: "Error al obtener los registros de Marca" });
        }
        resultados.marcas = marcas;

        db.query(sql.modelo, (err, modelos) => {
            if (err) {
                console.error("Error al obtener registros de Modelo:", err);
                return res.status(500).json({ error: "Error al obtener los registros de Modelo" });
            }
            resultados.modelos = modelos;

            db.query(sql.color, (err, colores) => {
                if (err) {
                    console.error("Error al obtener registros de Color:", err);
                    return res.status(500).json({ error: "Error al obtener los registros de Color" });
                }
                resultados.colores = colores;

                db.query(sql.talla, (err, tallas) => {
                    if (err) {
                        console.error("Error al obtener registros de Talla:", err);
                        return res.status(500).json({ error: "Error al obtener los registros de Talla" });
                    }
                    resultados.tallas = tallas;

                    // Una vez que se han obtenido todos los datos, retornamos el objeto completo como JSON
                    return res.json(resultados);
                });
            });
        });
    });
});

app.post('/save_product', upload.single('imagen'), (req, res) => {
    const { NombreProducto, idMarca, idModelo, idColor, idTalla, PrecioVenta } = req.body;
    const imagen = req.file; // Acceder al archivo adjunto

    // Verificar si se proporcionó una imagen
    if (!imagen) {
        return res.status(400).json({ error: "Se requiere una imagen para el producto" });
    }

    // Aquí puedes usar los datos del formulario y la imagen adjunta para guardar el producto en la base de datos
    const sql = `INSERT INTO producto (NombreProducto, idMarca, idModelo, idColor, idTalla, Imagen, PrecioVenta)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [NombreProducto, idMarca, idModelo, idColor, idTalla, imagen.filename, PrecioVenta], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al insertar el producto en la base de datos" });
        }

        return res.status(201).json({ message: "Producto insertado exitosamente" });
    });
});

app.post('/update_product', upload.single('imagen'), (req, res) => {
    const { idProducto, NombreProducto, idMarca, idModelo, idColor, idTalla, PrecioVenta } = req.body;
    let imagen = req.body.Imagen; // Conserva la imagen existente por defecto

    // Verificar si se proporcionó una nueva imagen y si hay que actualizarla
    if (req.file) {
        // Si hay una imagen nueva, actualiza el nombre de la imagen
        imagen = req.file.filename;
    }

    // Actualizar el producto en la base de datos
    const sql = `UPDATE producto 
                 SET NombreProducto=?, idMarca=?, idModelo=?, idColor=?, idTalla=?, PrecioVenta=?
                 ${imagen ? ', Imagen=?' : ''}
                 WHERE idProducto=?`;

    const params = [NombreProducto, idMarca, idModelo, idColor, idTalla, PrecioVenta];

    if (imagen) {
        // Si se proporcionó una nueva imagen, añade la imagen al array de parámetros
        params.push(imagen);
    }

    params.push(idProducto); // Añade el idProducto al final de los parámetros

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al actualizar el producto en la base de datos" });
        }

        return res.status(200).json({ message: "Producto actualizado exitosamente" });
    });
});

app.delete('/producto/:id', (req, res) => {
    const idProducto = req.params.id;

    // Consulta para obtener el nombre de la imagen asociada al producto
    const sqlObtenerImagen = 'SELECT Imagen FROM producto WHERE idProducto = ?';

    // Ejecutar la consulta para obtener el nombre de la imagen
    db.query(sqlObtenerImagen, [idProducto], (err, result) => {
        if (err) {
            console.error('Error al obtener la imagen asociada:', err);
            return res.status(500).json({ error: 'Error al obtener la imagen asociada' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const nombreImagen = result[0].Imagen;

        // Consulta para eliminar el producto de la base de datos
        const sqlEliminarProducto = 'DELETE FROM producto WHERE idProducto = ?';

        // Ejecutar la consulta para eliminar el producto
        db.query(sqlEliminarProducto, [idProducto], (err, result) => {
            if (err) {
                console.error('Error al eliminar el producto:', err);
                return res.status(500).json({ error: 'Error al eliminar el producto' });
            }

            // Eliminar la imagen asociada del sistema de archivos
            if (nombreImagen) {
                const rutaImagen = path.join('uploads', nombreImagen);

                // const rutaImagen = 'uploads/' + nombreImagen;
                if (fs.existsSync(rutaImagen)) {
                    fs.unlinkSync(rutaImagen);
                }else{
                    // console.log(`La imagen ${nombreImagen} no existe en la carpeta "uploads".`);
                }
            }

            // Responder al cliente
            return res.status(200).json({ message: 'Producto eliminado correctamente' });
        });
    });
});

app.get('/producto/:id', (req, res) => {
    const idProducto = req.params.id;

    const sql = `SELECT p.idProducto, p.NombreProducto, m.NombreMarca, mo.NombreModelo, c.NombreColor, t.NombreTalla, p.Imagen, p.PrecioVenta
    FROM producto p
    JOIN marca m ON p.idMarca = m.idMarca
    JOIN modelo mo ON p.idModelo = mo.idModelo
    JOIN color c ON p.idColor = c.idColor
    JOIN talla t ON p.idTalla = t.idTalla
    WHERE idProducto = ?`;

    db.query(sql, [idProducto], (err, result) => {
        if (err) {
            console.error('Error al obtener el producto:', err);
            return res.status(500).json({ error: 'Error al obtener el producto' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Si se encontró el producto, enviarlo como respuesta
        const producto = result[0];
        return res.status(200).json(producto);
    });
});

app.get('/download_excel', (req, res) => {
    const sql = `SELECT p.idProducto, p.NombreProducto, m.NombreMarca, mo.NombreModelo, c.NombreColor, t.NombreTalla, p.Imagen, p.PrecioVenta
                FROM producto p
                JOIN marca m ON p.idMarca = m.idMarca
                JOIN modelo mo ON p.idModelo = mo.idModelo
                JOIN color c ON p.idColor = c.idColor
                JOIN talla t ON p.idTalla = t.idTalla`;

    db.query(sql, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener los registros de productos" });
        }
        
        // Crear un nuevo workbook de Excel
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Productos');

        // Definir las cabeceras de las columnas
        worksheet.columns = [
            { header: 'ID Producto', key: 'idProducto', width: 15 },
            { header: 'Nombre Producto', key: 'NombreProducto', width: 30 },
            { header: 'Marca', key: 'NombreMarca', width: 20 },
            { header: 'Modelo', key: 'NombreModelo', width: 20 },
            { header: 'Color', key: 'NombreColor', width: 20 },
            { header: 'Talla', key: 'NombreTalla', width: 15 },
            { header: 'Imagen', key: 'Imagen', width: 30 },
            { header: 'Precio Venta', key: 'PrecioVenta', width: 15 }
        ];

        // Agregar los datos al worksheet
        data.forEach(row => {
            worksheet.addRow(row);
        });

        // Configurar la respuesta para descargar el archivo Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx');

        // Escribir el workbook en el response stream
        workbook.xlsx.write(res)
            .then(() => {
                res.end();
            })
            .catch(error => {
                console.error(error);
                return res.status(500).json({ error: "Error al escribir el archivo de Excel" });
            });
    });
});

app.get('/ficha_tecnica/:id', (req, res) => {
    const idProducto = req.params.id;

    const sql = `SELECT p.idProducto, p.NombreProducto, m.NombreMarca, mo.NombreModelo, c.NombreColor, t.NombreTalla, p.Imagen, p.PrecioVenta
    FROM producto p
    JOIN marca m ON p.idMarca = m.idMarca
    JOIN modelo mo ON p.idModelo = mo.idModelo
    JOIN color c ON p.idColor = c.idColor
    JOIN talla t ON p.idTalla = t.idTalla
    WHERE idProducto = ?`;

    db.query(sql, [idProducto], (err, result) => {
        if (err) {
            console.error('Error al obtener el producto:', err);
            return res.status(500).json({ error: 'Error al obtener el producto' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Si se encontró el producto, generar la ficha técnica en PDF
        const producto = result[0];
        const doc = new PDFDocument();
        // Configurar el encabezado del PDF
        doc.fontSize(20).text('Ficha Técnica', { align: 'center' }).moveDown();
        // Agregar detalles del producto
        doc.fontSize(14).text(`ID Producto: ${producto.idProducto}`).moveDown();
        doc.fontSize(14).text(`Nombre: ${producto.NombreProducto}`).moveDown();
        doc.fontSize(14).text(`Marca: ${producto.NombreMarca}`).moveDown();
        doc.fontSize(14).text(`Modelo: ${producto.NombreModelo}`).moveDown();
        doc.fontSize(14).text(`Color: ${producto.NombreColor}`).moveDown();
        doc.fontSize(14).text(`Talla: ${producto.NombreTalla}`).moveDown();
        doc.fontSize(14).text(`Precio Venta: ${producto.PrecioVenta}`).moveDown();
        // Enviar el PDF como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ficha_tecnica_${idProducto}.pdf`);
        doc.pipe(res);
        doc.end();
    });
});

app.post('/quote_product', (req, res) => {
    const { idProducto, PrecioVenta, toPerson } = req.body;

    // Actualizar el precio del producto en la base de datos
    const sql = `UPDATE producto 
                 SET PrecioVenta=?
                 WHERE idProducto=?`;

    const params = [PrecioVenta, idProducto, toPerson];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al actualizar el precio del producto en la base de datos" });
        }

        // Enviar notificación por correo electrónico
        const mailOptions = {
            from: 'mendozachateluis@gmail.com',
            //to: 'mendozachateluis@gmail.com',
            to: toPerson,
            subject: 'Precio del producto actualizado',
            text: `Se ha actualizado el precio del producto con ID ${idProducto} a ${PrecioVenta} soles.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar el correo electrónico:', error);
            } else {
                console.log('Correo electrónico enviado:', info.response);
            }
        });

        return res.status(200).json({ message: "Precio del producto actualizado exitosamente" });
    });
});

app.post('/upload_products_excel', upload_post.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se ha proporcionado ningún archivo" });
    }

    // Leer el archivo Excel desde la memoria
    const workbook = new Excel.Workbook();
    workbook.xlsx.load(req.file.buffer)
        .then(() => {
            const worksheet = workbook.getWorksheet(1); // Obtener la primera hoja del libro

            // Iterar sobre las filas del archivo Excel (excluyendo la fila de encabezados)
            for (let i = 2; i <= worksheet.rowCount; i++) {
                const row = worksheet.getRow(i);

                const NombreProducto = row.getCell(1).value;
                const idMarca = row.getCell(2).value;
                const idModelo = row.getCell(3).value;
                const idColor = row.getCell(4).value;
                const idTalla = row.getCell(5).value;
                const Imagen = row.getCell(6).value;
                const PrecioVenta = row.getCell(7).value;

                // Insertar los datos del producto en la base de datos
                const sql = `INSERT INTO producto (NombreProducto, idMarca, idModelo, idColor, idTalla, Imagen, PrecioVenta)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`;
                const params = [NombreProducto, idMarca, idModelo, idColor, idTalla, Imagen, PrecioVenta];

                db.query(sql, params, (err, result) => {
                    if (err) {
                        console.error('Error al insertar el producto:', err);
                    }
                });
            }

            return res.status(200).json({ message: "Datos de productos insertados correctamente" });
        })
        .catch(error => {
            console.error('Error al cargar el archivo Excel:', error);
            return res.status(500).json({ error: "Error al procesar el archivo Excel" });
        });
});

app.listen(8081, () => {
    console.log("Escuchando...");
})
