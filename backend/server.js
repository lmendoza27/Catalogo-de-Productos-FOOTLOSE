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
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

app.use(cors());

const port = 8081;

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
    host: 'sql3.freemysqlhosting.net',
    user: 'sql3692502',
    password: 'B3n5sLruaB',
    database: 'sql3692502'
    // host: 'localhost',
    // user: 'root',
    // password: '',
    // database: 'catalog_products'
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

  // Configuración de Swagger
    const options = {
        definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Catálogo de Productos',
            version: '1.0.0',
            description: 'API para obtener productos de un catálogo',
        },
        },
        // Rutas para los archivos de especificación de Swagger
        apis: ['./server.js'], // Ruta de tu archivo server.js
    };
  
  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Inicia sesión de usuario
 *     description: Verifica las credenciales del usuario y devuelve un token de autenticación JWT si las credenciales son válidas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: Nombre de usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Éxito al iniciar sesión
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Estado del inicio de sesión
 *                 token:
 *                   type: string
 *                   description: Token de autenticación JWT
 *                 permissions:
 *                   type: array
 *                   description: Permisos del usuario
 *                   items:
 *                     type: string
 *                     description: Nombre del permiso
 *       400:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error interno del servidor
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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     description: Registra un nuevo usuario en la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: Nombre de usuario.
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario.
 *             required:
 *               - user
 *               - password
 *     responses:
 *       200:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Error al registrar el usuario
 */
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

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Obtiene todos los productos
 *     description: Retorna una lista de todos los productos disponibles en el catálogo.
 *     responses:
 *       200:
 *         description: Éxito al obtener los productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idProducto:
 *                     type: integer
 *                     description: ID del producto
 *                   NombreProducto:
 *                     type: string
 *                     description: Nombre del producto
 *                   NombreMarca:
 *                     type: string
 *                     description: Nombre de la marca del producto
 *                   NombreModelo:
 *                     type: string
 *                     description: Nombre del modelo del producto
 *                   NombreColor:
 *                     type: string
 *                     description: Nombre del color del producto
 *                   NombreTalla:
 *                     type: string
 *                     description: Nombre de la talla del producto
 *                   Imagen:
 *                     type: string
 *                     description: Nombre del archivo de imagen del producto
 *                   PrecioVenta:
 *                     type: number
 *                     description: Precio de venta del producto
 */
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

/**
 * @swagger
 * /detail_product:
 *   get:
 *     summary: Obtiene detalles de productos
 *     description: Retorna detalles de productos como marcas, modelos, colores y tallas disponibles.
 *     responses:
 *       200:
 *         description: Éxito al obtener detalles de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 marcas:
 *                   type: array
 *                   description: Lista de marcas disponibles.
 *                   items:
 *                     type: object
 *                     properties:
 *                       idMarca:
 *                         type: integer
 *                         description: ID de la marca.
 *                       NombreMarca:
 *                         type: string
 *                         description: Nombre de la marca.
 *                 modelos:
 *                   type: array
 *                   description: Lista de modelos disponibles.
 *                   items:
 *                     type: object
 *                     properties:
 *                       idModelo:
 *                         type: integer
 *                         description: ID del modelo.
 *                       NombreModelo:
 *                         type: string
 *                         description: Nombre del modelo.
 *                 colores:
 *                   type: array
 *                   description: Lista de colores disponibles.
 *                   items:
 *                     type: object
 *                     properties:
 *                       idColor:
 *                         type: integer
 *                         description: ID del color.
 *                       NombreColor:
 *                         type: string
 *                         description: Nombre del color.
 *                 tallas:
 *                   type: array
 *                   description: Lista de tallas disponibles.
 *                   items:
 *                     type: object
 *                     properties:
 *                       idTalla:
 *                         type: integer
 *                         description: ID de la talla.
 *                       NombreTalla:
 *                         type: string
 *                         description: Nombre de la talla.
 */
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

/**
 * @swagger
 * /save_product:
 *   post:
 *     summary: Guarda un nuevo producto
 *     description: Guarda un nuevo producto en la base de datos junto con su imagen adjunta.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               NombreProducto:
 *                 type: string
 *                 description: Nombre del producto.
 *               idMarca:
 *                 type: integer
 *                 description: ID de la marca del producto.
 *               idModelo:
 *                 type: integer
 *                 description: ID del modelo del producto.
 *               idColor:
 *                 type: integer
 *                 description: ID del color del producto.
 *               idTalla:
 *                 type: integer
 *                 description: ID de la talla del producto.
 *               PrecioVenta:
 *                 type: number
 *                 description: Precio de venta del producto.
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Imagen del producto.
 *     responses:
 *       201:
 *         description: Producto insertado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito.
 *       400:
 *         description: Se requiere una imagen para el producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 *       500:
 *         description: Error al insertar el producto en la base de datos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 */
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

/**
 * @swagger
 * /update_product:
 *   post:
 *     summary: Actualiza un producto existente
 *     description: Actualiza un producto existente en la base de datos, incluyendo la posibilidad de cambiar la imagen adjunta.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               idProducto:
 *                 type: integer
 *                 description: ID del producto a actualizar.
 *               NombreProducto:
 *                 type: string
 *                 description: Nombre actualizado del producto.
 *               idMarca:
 *                 type: integer
 *                 description: ID de la marca actualizada del producto.
 *               idModelo:
 *                 type: integer
 *                 description: ID del modelo actualizado del producto.
 *               idColor:
 *                 type: integer
 *                 description: ID del color actualizado del producto.
 *               idTalla:
 *                 type: integer
 *                 description: ID de la talla actualizada del producto.
 *               PrecioVenta:
 *                 type: number
 *                 description: Precio de venta actualizado del producto.
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Nueva imagen del producto (opcional).
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito.
 *       400:
 *         description: Se requiere una imagen para el producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 *       500:
 *         description: Error al actualizar el producto en la base de datos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 */
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

/**
 * @swagger
 * /producto/{id}:
 *   delete:
 *     summary: Elimina un producto existente
 *     description: Elimina un producto existente de la base de datos y elimina la imagen asociada del sistema de archivos, si existe.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto que se desea eliminar.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito.
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 *       500:
 *         description: Error al eliminar el producto o la imagen asociada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 */
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

/**
 * @swagger
 * /producto/{id}:
 *   get:
 *     summary: Obtiene los detalles de un producto por su ID
 *     description: Obtiene los detalles de un producto específico de la base de datos según su ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto del que se desean obtener los detalles.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del producto obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idProducto:
 *                   type: integer
 *                   description: ID del producto.
 *                 NombreProducto:
 *                   type: string
 *                   description: Nombre del producto.
 *                 NombreMarca:
 *                   type: string
 *                   description: Nombre de la marca del producto.
 *                 NombreModelo:
 *                   type: string
 *                   description: Nombre del modelo del producto.
 *                 NombreColor:
 *                   type: string
 *                   description: Nombre del color del producto.
 *                 NombreTalla:
 *                   type: string
 *                   description: Nombre de la talla del producto.
 *                 Imagen:
 *                   type: string
 *                   description: Nombre del archivo de imagen del producto.
 *                 PrecioVenta:
 *                   type: number
 *                   description: Precio de venta del producto.
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 *       500:
 *         description: Error al obtener el producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 */
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

/**
 * @swagger
 * /download_excel:
 *   get:
 *     summary: Descarga los detalles de los productos en formato Excel
 *     description: Descarga los detalles de todos los productos de la base de datos en formato Excel.
 *     responses:
 *       200:
 *         description: Archivo Excel descargado correctamente
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *               description: Archivo Excel descargado.
 *       500:
 *         description: Error al obtener los registros de productos o al escribir el archivo de Excel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 */
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

/**
 * @swagger
 * /ficha_tecnica/{id}:
 *   get:
 *     summary: Genera y descarga la ficha técnica de un producto en formato PDF
 *     description: Genera y descarga la ficha técnica de un producto en formato PDF.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto del cual se desea generar la ficha técnica.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ficha técnica generada y descargada correctamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *               description: Archivo PDF de la ficha técnica.
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 *       500:
 *         description: Error al obtener el producto o al generar la ficha técnica
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 */
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

/**
 * @swagger
 * /quote_product:
 *   post:
 *     summary: Actualiza el precio de un producto y envía una notificación por correo electrónico
 *     description: Actualiza el precio de un producto en la base de datos y envía una notificación por correo electrónico al destinatario especificado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idProducto:
 *                 type: integer
 *                 description: ID del producto que se desea actualizar.
 *               PrecioVenta:
 *                 type: number
 *                 description: Nuevo precio de venta del producto.
 *               toPerson:
 *                 type: string
 *                 description: Dirección de correo electrónico del destinatario para enviar la notificación.
 *             example:
 *               idProducto: 1
 *               PrecioVenta: 100
 *               toPerson: example@example.com
 *     responses:
 *       200:
 *         description: Precio del producto actualizado exitosamente y notificación enviada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación.
 *       500:
 *         description: Error al actualizar el precio del producto o al enviar la notificación por correo electrónico
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 */
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

/**
 * @swagger
 * /upload_products_excel:
 *   post:
 *     summary: Carga datos de productos desde un archivo Excel
 *     description: Carga datos de productos desde un archivo Excel y los inserta en la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Datos de productos insertados correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación.
 *       400:
 *         description: No se ha proporcionado ningún archivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 *       500:
 *         description: Error al cargar o procesar el archivo Excel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 */
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

app.listen(port, () => {
    console.log("Escuchando...");
})
