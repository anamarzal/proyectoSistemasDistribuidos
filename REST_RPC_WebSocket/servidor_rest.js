var express = require("express");
var app = express();


let datos = require('./datos.json'); //llamamos a datos.json.

//Todos los arrays con los diferentes datos que se encuentran en datos.json.
const especialidades = datos.especialidades
const centros = datos.centros
const medicos = datos.medicos
const expedientes = datos.expedientes


app.use("/map", express.static("cliente_rest")); //para verlo localhost:3000/map devuelve contenido estatico del cliente en el google
app.use("/me", express.static("cliente_rpc"));
app.use(express.json()); 


//ENDPOINT PARA INICIAR SESION COMO MEDICO MAP. 
// primera funcion del map cuando accede al sitio web y se tiene 
// que ver si las credenciales son correctas
app.post("/api/medico/login", function(req, res){
    var map = {
        login: req.body.login, //obtiene el login desde el cuerpo de la solicitud
        password: req.body.password, //obtiene el password
    };
    //console.log(map.login, map.password);

    //buscamos si existe
    var pos = -1;
    var i = 0;

    //buscamos al medico en el array de medicos
    while(i < medicos.length && pos == -1){
        if(map.login == medicos[i].login && map.password == medicos[i].password){
            pos = i; //actualizamos posicion si encontramos al medico
        }
        else{
            i++;
        }
    }
    if(pos == -1){//no se ha encontrado
        res.status(403).json("No existe ese usuario");
    }
    else{
        res.status(201).json(medicos[pos]); // devueleve los datos del medico encontrado en la posicion [pos].
        
    }
});


//ENDPOINT PARA OBTENER LOS DATOS DE UN MEDICO POR SU ID.
//obtiene los datos del medico menos la contraseña
//se especifica el id del medico del que se quiere obtener la info
app.get("/api/medico/:id", function(req, res){
    var id = req.params.id;
    for(var i = 0; i<medicos.length; i++){
        //recorre el array de medicos y busca cual es el que tiene ese id
        if(medicos[i].id == id){
            var datos_med = JSON.parse(JSON.stringify(medicos[i])); //clonan los datos del medico

            delete datos_med["password"]; //eliminamos la contraseña de los datos a devolver

            res.status(200).json(datos_med); //devolvemos los datos del medico.
            return;
        }
    }
    res.status(404).json("El medico que se pide no existe");
});

//ENDPOINT PARA OBTENER LOS EXPEDIENES DE UN MEDICO POR SU ID.
//Se obtienen los expedientes especificos de un map y se
//pasan en un array.
app.get("/api/map/:id/expedientes", function(req, res){
    var id = req.params.id;
    var expedientes_array = []; //creamos el array que pasaremos al cliente

    for(var i = 0; i<expedientes.length; i++){
        if(id == expedientes[i].map){ //buscamos expedientes segun el ID del medico especificado.
            expedientes_array.push(expedientes[i]); //agregamos los expedientes encontrados al array.
        }
    }
    if(expedientes_array.length == 0){
        res.status(404).json("El medico no tiene pacientes");
        return;

    }
    else{
        res.status(200).json(expedientes_array); //devolvemos los expedientes encontrados.
        return;
    }
});


//ENDOPOINT PARA OBTENER TODAS LAS ESPECIALIDADES.
//creamos el GET que obtiene un array con todas las especialidades
app.get("/api/especialidades", function(req,res){
    res.status(200).json(especialidades);
});

//ENDPOINT PARA OBTENER TODOS LOS CENTROS MEDICOS.
//creamos GET que obtiene un array con todos los centros
app.get("/api/centros", function(req,res){
    res.status(200).json(centros);
});

//ENDPOINT PARA CREAR UN NUEVO MEDICO.
//creacion de un nuevo medico
app.post("/api/medico", function(req,res){
    var nuevo_id = 0;
    for(var i = 0; i < medicos.length; i++){
        if(medicos[i].id > nuevo_id){
            nuevo_id = medicos[i].id; //encontrar el ID mas alto entre los medicos existentes.
        }
    }

    //OBTENEMOS TODOS LOS DATOS DESDE EL "BODY" QUE NOS PASA EL CLIENTE.
    //el nuevo map tiene que tener los mismos campos que los maps ya creados 
    //por eso se llaman igual los campos y lo rellenamos con los campos diferentes log y pass
    var nuevo_map = {
        id: nuevo_id + 1,
        nombre: req.body.nombre,
        apellidos : req.body.apellidos,
        login : req.body.log,
        password : req.body.pass,
        centro : req.body.centro
    };


    //una vez hemos rellenado los campos lo tenemos que añadir al array de medicos y
    //comprobar que no existe el mismo login

    var existe = false;
    for(var i = 0; i < medicos.length; i++){
        if(medicos[i].login == nuevo_map.login){
            existe = true;
            break;
        }
    }
    if(existe){
        res.status(400).json("Ya existe ese login");
    }
    else{
        medicos.push(nuevo_map);
        res.status(201).json(nuevo_map); //se devuelven los datos de ese nuevo medico creado
    }
});

//ENDPOINT PARA ACTUALIZAR LOS DATOS DE UN EXPEDIENTE SEGUN SU ID.
//Actualizar los datos de un expediente
app.put("/api/expediente/:id", function (req, res) {
	var id = req.params.id;

	// Encuentra el expediente que deseas actualizar
	var expediente = expedientes.find((exp) => exp.id == id);
	if (!expediente) {
		res.status(404).json("No se encontró ningún expediente con este ID");
		return;
	}

	// Actualiza los campos del expediente según lo que esté en req.body y sino se quiere acutualizar lo deja como estaba por eso hacemos
    //uso de "or"
	expediente.especialidad = req.body.especialidad || expediente.especialidad;
	expediente.sip = req.body.sip || expediente.sip;
	expediente.nombre = req.body.nombre || expediente.nombre;
	expediente.apellidos = req.body.apellidos || expediente.apellidos;
	expediente.fecha_nacimiento = req.body.fecha_nacimiento || expediente.fecha_nacimiento;
	expediente.genero = req.body.genero || expediente.genero;
	expediente.observaciones = req.body.observaciones || expediente.observaciones;
	expediente.solicitud = req.body.solicitud || expediente.solicitud;
    expediente.respuesta = req.body.respuesta || expediente.respuesta;

	res.status(200).json(expediente);
});


//ENDPOINT PARA CREAR UN NUEVO EXPEDIENTE ASOCIADO A UN MAP.
// Endpoint para crear un nuevo expediente asociado a un MAP
app.post("/api/map/:id/expedientes", function(req, res) {
    var idMap = req.params.id;
    var nuevoExpediente = req.body;
    //console.log("Este es el nuevo expediente",nuevoExpediente);

    // Validación para evitar datos prohibidos previamente
    var datosProhibidos = ["id", "fecha_creacion", "fecha_asignacion", "fecha_resolucion"];
    for (var i = 0; i < datosProhibidos.length; i++) {
        if (nuevoExpediente.hasOwnProperty(datosProhibidos[i])) {
            return res.status(400).json({ error: "No se permiten datos prohibidos: " + datosProhibidos[i] });
        }
    }

    // Obtener el último ID de expediente asociado a este MAP utilizando un bucle for
    var ultimoIdExpediente = 0;
    for (var i = 0; i < expedientes.length; i++) {
        if (expedientes[i].id > ultimoIdExpediente) {
            ultimoIdExpediente = expedientes[i].id; //encontramos el ID mas alto
        }
    }

    // Asignar el nuevo ID de expediente basado en el último ID encontrado
    var idExpediente = ultimoIdExpediente + 1;

    // Agregar el ID del MAP al nuevo expediente antes de guardarlo
    nuevoExpediente.idMap = idMap;

    nuevoExpediente.idMap = parseInt(nuevoExpediente.idMap);
    // Crear el nuevo expediente completo
    var nuevoExpedienteCompleto = {
        id: idExpediente,
        map: nuevoExpediente.idMap,
        me: 0,
        especialidad: parseInt(nuevoExpediente.especialidad),
        sip: nuevoExpediente.sip,
        nombre: nuevoExpediente.nombre,
        apellidos: nuevoExpediente.apellidos,
        fecha_nacimiento: nuevoExpediente.fecha_nacimiento,
        genero: nuevoExpediente.genero,
        observaciones: nuevoExpediente.observaciones,
        solicitud: nuevoExpediente.solicitud,
        respuesta: null,
        fecha_creacion: new Date().toISOString(),
        fecha_resolucion : null,
        fecha_asignacion: null
    };

    // Agregar el nuevo expediente a la base de datos
    expedientes.push(nuevoExpedienteCompleto);

    // Devolver el ID del nuevo expediente
    res.status(201).json(expedientes);
});


//ENDPOINT PARA ACTUALIZAR LOS DATOS DE UN MEDICO SEGUN SU ID.
//CAMBIAR INFO DEL MEDICO INDICADO EN EL ID. 
//evitar que se repita el login
app.put("/api/medico/:id", function (req, res) {
	var id = req.params.id;
	var medico = medicos.find((med) => med.id == id);
	if (!medico) {
		res.status(404).json("El médico no existe");
		return;
	}

	// Verifica si ya existe otro médico con el mismo login
	var medicoExistente = medicos.find((med) => med.login === req.body.login && med.id != id);
	if (medicoExistente) {
		res.status(400).json("Ya existe otro médico con este login");
		return;
	}

	// Actualiza los campos del médico según lo que esté en req.body
	medico.nombre = req.body.nombre || medico.nombre;
	medico.apellidos = req.body.apellidos || medico.apellidos;
	medico.login = req.body.login || medico.login;
	medico.password = req.body.password || medico.password;
	medico.centro = req.body.centro || medico.centro;

	res.status(200).json(medico);
});

//ENDPOINT PARA ELIMINAR UN EXPEDIENTE POR SU ID.
//BORRAMOS UN EXPEDIENTE CONCRETO
app.delete("/api/expediente/:id", function(req, res) {
    var idExpediente = req.params.id;
    var expedienteEncontrado = false;

    for (var i = 0; i < expedientes.length; i++) {
        if (expedientes[i].id == idExpediente) {
            expedientes.splice(i, 1); //elimina el expediente del array
            expedienteEncontrado = true;
            break;
        }
    }

    if (!expedienteEncontrado) {
        return res.status(404).send("No se encontró el expediente");
    }

    res.status(200).send("Expediente eliminado con éxito");
});

//---------------------------------EXAMEN PRACTICAS----------------------------------------------
app.get("/api/map/:idMedico/estadisticas", function(req,res){
    var idMedico = req.params.idMedico;
    var total = 0;
    var expAsig = 0;
    var expRes = 0;
    for(i = 0; i < expedientes.length; i++){
        if(expedientes[i].map == idMedico){
            total = total + 1;
            if(expedientes[i].fecha_asignacion != ''){
                expAsig = expAsig + 1;
                if(expedientes[i].fecha_resolucion != ''){
                    expRes = expRes + 1;
                }
            }
        }
    }
    res.status(200).send({Total: total, Asignados: expAsig, Resueltos: expRes});
});
//---------------------------------------------------------------------------------------------------------------------

app.listen(3000);
