var app = rpc("localhost", "gestion_me");
var seccionActual = "login_me";
/*
Obtener referencias a los procedimientos remotos registrados
por el servidor
*/
const login = app.procedure("login");
const obtenerCentros = app.procedure("obtenerCentros");
const obtenerEspecialidades = app.procedure("obtenerEspecialidades");
const obtenerDatosMedico = app.procedure("obtenerDatosMedico");
const crearME = app.procedure("crearME");
const actualizarme = app.procedure("actualizarme");
const obtenerExpDisponibles = app.procedure("obtenerExpDisponibles");
const asignarExp = app.procedure("asignarExp");
const obtenerExpAsignados = app.procedure("obtenerExpAsignados");
const resolverExp = app.procedure("resolverExp");


//VARIABLES GLOBALES
var id_medico = null;
var expedientesAsignados=[];
var expedientesYaAsignados1 =[];
var datos = [];

//WEBSOCKET
var conexion = null; 

function entrar(){
    var loginME = document.getElementById("loginME").value;
    var passwordME = document.getElementById("passwordME").value;

    //llamamos metodo RPC login
    //el servidor tan solo nos devuelve el ID del medico como respuesta de que todo ha ido bien por lo que medico = id.
    login(loginME,passwordME, function (medico) {
        //console.log("Este es el medico que pasa el servidor:", medico)
        if(medico != null){
            console.log("Login correcto");
            datos_especialista(medico); //llamada a la funcion para cargar el nombre y el apellido una vez hecho el login
        }
        else{
            console.log("Login incorrecto, pruebe otra vez");
        }    
    });
    borrar_campos_login();
}

//funcion creada para cargar los datos del ME
function datos_especialista(datos_ME){
    medico = datos_ME; //tenemos el id del medico y se lo pasamos para obtener sus datos.

    //hacemos llamada RPC pasandole el ID
    //nos devuelve TODOS los datos del ME menos la contra
    obtenerDatosMedico(medico, function(medico_ME){
        //console.log("el medico que me pasa el servidor 2:", medico_ME)
        if(medico != null){
            var bienvenida = document.getElementById("nombre_doctor_ME");
            bienvenida.innerHTML = "";
            bienvenida.innerHTML = medico_ME.nombre + " "+ medico_ME.apellidos;
            cambiarSeccion("menu_principal");
            datos = medico_ME;
        }
        else{
            console.log("No existe ese medico");
        } 
    })  
}


// Esta función carga los centros en el select
function cargarCentros() {
    obtenerCentros(function(centros) {
        var selectCentros = document.getElementById("centros");
        // Limpiamos cualquier opción previa
        selectCentros.innerHTML = "";
        // Iteramos sobre los centros y los agregamos como opciones al select
        centros.forEach(function(centro) {
            var option = document.createElement("option");
            option.value = centro.id;
            option.text = centro.nombre; 
            selectCentros.appendChild(option);
        });
    });
}

// Esta función carga las especialidades en el select
function cargarEspecialidades() {
    obtenerEspecialidades(function(especialidades) {
        var selectEspecialidades = document.getElementById("especialidad");
        // Limpiamos cualquier opción previa
        selectEspecialidades.innerHTML = "";
        // Iteramos sobre las especialidades y las agregamos como opciones al select
        especialidades.forEach(function(especialidad) {
            var option = document.createElement("option");
            option.value = especialidad.id;
            option.text = especialidad.nombre; 
            selectEspecialidades.appendChild(option);
        });
    });
}

//Boton para entrar en la pantalla de registrar a un nuevo medico por eso cargamos centros y especialidades.
function registrarse(){
    cargarCentros();
    cargarEspecialidades();
    cambiarSeccion("registro_nuevo_ME");
}

//FUNCION QUE SE ENCARGA DE GUARDAR AL NUEVO ME REGISTRADO.
function guardar_nuevo_me(){
    var centro_seleccionado = document.getElementById("centros");
    if(centro_seleccionado){
        var centro_seleccionado_valor = parseInt(centro_seleccionado.value);
    };
    var especialidad_seleccionada = document.getElementById("especialidad");
    if(especialidad_seleccionada){
        var especialidad_seleccionada_valor = parseInt(especialidad_seleccionada.value);
    }

    var nuevo_me = {
        nombre: document.getElementById("nombre").value,
        apellidos: document.getElementById("apellidos").value,
        login: document.getElementById("loginME1").value,
        password : document.getElementById("passwordME1").value,
        centro: centro_seleccionado_valor,
        especialidad: especialidad_seleccionada_valor,
    }

    //llamada a RPC donde le pasamos el nuevo ME y nos devuelve si todo a ido bien el id del nuevo medico.
    crearME(nuevo_me, function(id_nuevoME){
        if(id_nuevoME){
            cambiarSeccion("login_me");
            console.log("Este es el id del nuevo ME:", id_nuevoME);
            borrar_campos_registro();
        }
        else{
            console.log("Error creando el nuevo medico");
        }

    });
}

function boton_volver_login(){
    cambiarSeccion("login_me");
}

//funcion para cargar tanto los select de centros y especialidades como los datos actuales del medico que se quiere actualizar
function modificar_datos_me(){
    cargarCentros1();
    cargarEspecialidades1();
    cambiarSeccion("cambiar_datos_me");

    //llamada a RPC para obtener los datos de ese medico.
    obtenerDatosMedico(medico, function(medico_pasado2){
        document.getElementById("nombre1").value = medico_pasado2.nombre;
        document.getElementById("apellidos1").value = medico_pasado2.apellidos;
        document.getElementById("loginME2").value = medico_pasado2.login;
        document.getElementById("centros1").value = medico_pasado2.centro;
        document.getElementById("especialidad1").value = medico_pasado2.especialidad;
    })
}

// Esta función carga los centros en el select
function cargarCentros1() {
    obtenerCentros(function(centros) {
        var selectCentros = document.getElementById("centros1");
        // Limpiamos cualquier opción previa
        selectCentros.innerHTML = "";
        // Iteramos sobre los centros y los agregamos como opciones al select
        centros.forEach(function(centro) {
            var option = document.createElement("option");
            option.value = centro.id; // Puedes cambiar esto según la estructura de tu objeto centro
            option.text = centro.nombre; // Puedes cambiar esto según la estructura de tu objeto centro
            selectCentros.appendChild(option);
        });
    });
}

// Esta función carga las especialidades en el select
function cargarEspecialidades1() {
    obtenerEspecialidades(function(especialidades) {
        var selectEspecialidades = document.getElementById("especialidad1");
        // Limpiamos cualquier opción previa
        selectEspecialidades.innerHTML = "";
        // Iteramos sobre las especialidades y las agregamos como opciones al select
        especialidades.forEach(function(especialidad) {
            var option = document.createElement("option");
            option.value = especialidad.id; // Puedes cambiar esto según la estructura de tu objeto especialidad
            option.text = especialidad.nombre; // Puedes cambiar esto según la estructura de tu objeto especialidad
            selectEspecialidades.appendChild(option);
        });
    });
}

//funcion que guarda los datos una vez han sido modificados.
function guardar_datos_modificados(){
    var centro_seleccionado = document.getElementById("centros1");
    if(centro_seleccionado){
        var centro_seleccionado_valor = parseInt(centro_seleccionado.value);
    };
    var especialidad_seleccionada = document.getElementById("especialidad1");
    if(especialidad_seleccionada){
        var especialidad_seleccionada_valor = parseInt(especialidad_seleccionada.value);
    }

    var cambios_me = {
        nombre: document.getElementById("nombre1").value,
        apellidos: document.getElementById("apellidos1").value,
        login: document.getElementById("loginME2").value,
        password : document.getElementById("passwordME2").value,
        centro: centro_seleccionado_valor,
        especialidad: especialidad_seleccionada_valor,
    }

    //llamada a RPC donde se le pase el ID del medico y los cambios realizados 
    //nos devuelve el medico como tal con los datos actualizados.
    actualizarme(medico, cambios_me, function(medicoActualizado){
        if (!medicoActualizado){
            alert("El medico que se quiere actualizar no existe");
            return;
        }
        cambiarSeccion("menu_principal");
        console.log("datos del medico actualizados", medicoActualizado);
    });

    
}

function boton_volver_inicio(){
    cambiarSeccion("menu_principal");
}

//boton para volver al login.
function volver_login(){
    cambiarSeccion("login_me");
}

//BOTON QUE SE ENCARGA DE CARGAR LA TABLA CON LOS EXPEDIENTES A ASIGNAR DE UN ME
//Array de expedientes sin ME y de esa especialidad (solo id, map, fecha_creacion)
//Para asignar un expediente
function asignar_expediente(){
    var lista_expedientes_disponibles = document.getElementById("lista_expedientes");
    lista_expedientes_disponibles.innerHTML = "";

    var tabla = document.createElement("table");
    lista_expedientes_disponibles.appendChild(tabla);

    var encabezados = ["ID", "F.Cre.", "MAP", "", ""];
    var filaEncabezado = tabla.insertRow();

    for(var i = 0; i < encabezados.length; i++){
        var encabezado = document.createElement("th");
        encabezado.innerHTML = encabezados[i];
        filaEncabezado.appendChild(encabezado);
    }

    //hacemos uso de la funcion obtenerdatosmedico para poder sacar la especialidad de este.
    //medico = solo el id
    obtenerDatosMedico(medico, function(medico_ME){
        // Verificar si se pudo obtener el médico
        if (medico_ME === null) {
            console.log("Error: No se pudo obtener el médico.");
            return;
        }
        // Obtener el ID de la especialidad del médico
        var id_especialidad = medico_ME.especialidad;

        //hacemos llamada RPC de obtener los expedientes sin ningun ME asignado pasandole el ID de la especialidad
        //se nos pasa un array = "listado" con el ID, nombre MAP y la fecha de CREACIÓN.
        obtenerExpDisponibles(id_especialidad, function(listado){
            if(listado == null){
                console.log("Error");
            }
            for(var i = 0; i < listado.length; i++){
                var fila = tabla.insertRow();
                var datos = [
                    listado[i].id,
                    transformar_fecha_hora(listado[i].fecha_creacion),
                    listado[i].nombre_map
                ];
    
                for(var j = 0; j < datos.length; j++){
                    var celda = fila.insertCell(j);
                    celda.innerHTML = datos[j];
                }
    
                var celdaBoton = fila.insertCell(datos.length);
                var celdaBoton1 = fila.insertCell(datos.length);
                celdaBoton.innerHTML = "<button onclick='asignado(" + listado[i].id + ")'>Asignar</button>";
                celdaBoton1.innerHTML = "<button onclick='chat(" + listado[i].id + ")'>Chat</button>";
            }
        });

    });
    
    cambiarSeccion("asignar_expediente");
}

//-----------------------------------WEBSOCKET1-------------------------------------------------------------------------------------------------------------
let id_exp_chat_me = null;

function chat(expId) {
    cambiarSeccion("chat_me");
    id_exp_chat_me = expId;
    websocket = new WebSocket('ws://localhost:4444', "cliente");

    websocket.onopen = () => {
        console.log('MEDICO ESPECIALISTA CONECTADO!!!!!!!');
        websocket.send(JSON.stringify({
            type: 'login',
            expedienteId: id_exp_chat_me,
            tipoMedico: 'ME',
            nombreMedico: datos.nombre,
            especialidad: datos.especialidad
        }));
    };

    // Cuando recibo un mensaje de otro médico
    websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const listaMensajes = document.getElementById('mensajes');
        const nuevoMensaje = document.createElement('li');
        nuevoMensaje.textContent = `${data.nombreMedico} (${data.tipoMedico}): ${data.mensaje} - ${data.fecha}`;
        listaMensajes.appendChild(nuevoMensaje);

    };

    websocket.onclose = () => {
        console.log('WebSocket cerrado...');
    };

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        };
}

function enviarMensaje() {
    const mensajeInput = document.getElementById('mensajeEnviado');
    const mensaje = mensajeInput.value;

    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
            type: 'message',
            expedienteId: id_exp_chat_me,
            tipoMedico: 'ME', 
            mensaje: mensaje,
            nombreMedico: datos.nombre,
            fecha: new Date().toLocaleString()
        }));
        mensajeInput.value = '';
    }
}

function volveratras() {
    cambiarSeccion("asignar_expediente");
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
    }
    websocket = null;
    expedienteId = null;

    // Limpia la interfaz del chat si es necesario
    document.getElementById("mensajes").innerHTML = "";
}
//-------------------------------------------WEBSOCKET1-----------------------------------------------------------------------------------------------------------------


function boton_volver_menuP(){
    cambiarSeccion("menu_principal");
}


function cargarEspecialidades2() {
    obtenerEspecialidades(function(especialidades) {
        var selectEspecialidades = document.getElementById("especialidades2");
        // Limpiamos cualquier opción previa
        selectEspecialidades.innerHTML = "";
        // Iteramos sobre las especialidades y las agregamos como opciones al select
        especialidades.forEach(function(especialidad) {
            console.log("otra mas", especialidad);
            var option = document.createElement("option");
            option.value = especialidad.id; 
            option.text = especialidad.nombre; 
            selectEspecialidades.appendChild(option);
        });
    });
}

//BOTON QUE HACE REFERENCIA A LA FUNCION PARA QUE UN ME SE ASIGNE UN EXPEDIENTE.
function asignado(id){
    cargarEspecialidades2();

    //debemos de 1º obtener el id del medico que se va a asignar ese expediente para poder pasarselo a la funcion asignarExp.
    obtenerDatosMedico(medico, function(medico_pasado){
        // Verificar si se pudo obtener el médico
        if (medico_pasado === null) {
            console.log("Error: No se pudo obtener el médico.");
            return;
        }
        // Obtener el ID de la especialidad del médico
        var id_me = medico_pasado.id;

        //llamada a RPC para asignarse el expediente.
        //le pasamos tanto el id del expediente (lo tenemos porque es un boton en la tabla) como el id del medico
        asignarExp(id, id_me, function(exito){
            if(exito){
               cambiarSeccion("expediente_asignado"); 
               
               //actualizamos la fecha de asignacion
               var fechaActual = new Date().toISOString();
               document.getElementById("fasignacion").value = fechaActual;

            }
        
        //llamada a RPC para cargar los datos del expediente que se quiere asignar y que asi el ME los pueda ver.
        obtenerExpAsignados(id_me, function(expedientes){
            //aprovechamos esta llamada para guardanos en la variable expedientesAsignados todos los expedientes de ese ME.
            expedientesAsignados = expedientes;

            for (var i = 0; i < expedientesAsignados.length; i++) {
            // Comparar el ID del expediente con el ID recibido como parámetro
                if (expedientesAsignados[i].id === id) {
                // Aquí encontraste el expediente que deseas mostrar
                var expediente = expedientesAsignados[i];
                console.log("Expediente encontrado:", expediente);

                document.getElementById("id1").value = expediente.id;
                document.getElementById("medEsp").value = expediente.me;
                document.getElementById("especialidades2").value = expediente.especialidad;
                document.getElementById("sip").value = expediente.sip;
                document.getElementById("nombrenuevoexp").value = expediente.nombre;
                document.getElementById("apellidosnuevoexp").value = expediente.apellidos;
                document.getElementById("fnacimientonuevoexp").value = expediente.fecha_nacimiento;
                document.getElementById("genero").value = expediente.genero;
                document.getElementById("observaciones").value = expediente.observaciones;
                document.getElementById("solicitud").value = expediente.solicitud;
                document.getElementById("respuesta").value = expediente.respuesta;
                document.getElementById("fsolicitud").value = expediente.fecha_creacion;
                document.getElementById("fasignacion").value = expediente.fecha_asignacion;
                document.getElementById("fresolucion").value = expediente.fecha_resolucion;

                }
            }
            
        });

        });
    });
}

function boton_volver_listado(){
    cambiarSeccion("asignar_expediente");
}

//FUNCION QUE SE ENCARGA DE CREAR LA TABLA CON LOS EXPEDIENTES YA ASIGNADOS A ESE ME.
function mostrar_expedientes_asignados(){
    var lista_expedientes = document.getElementById("lista_expedientes_asignados");
    lista_expedientes.innerHTML = "";

    // Crear tabla
    var tabla = document.createElement("table");
    lista_expedientes.appendChild(tabla);

    // Encabezados de la tabla
    var encabezados = ["ID", "F.Cre.", "F.Asg.", "F.Res.", "SIP", "", ""];
    var filaEncabezado = tabla.insertRow();

    for (var i = 0; i < encabezados.length; i++) {
        var encabezado = document.createElement("th");
        encabezado.innerHTML = encabezados[i];
        filaEncabezado.appendChild(encabezado);
    }
    //obtenemos los expedientes ya asignados para mostrarlos en la tabla
    var IDMedico = datos.id;
    obtenerExpAsignados(IDMedico, function(expedientesAsignados1){
        //nos guardamos los expedientes que nos pasa el servidor en una variable global
        expedientesYaAsignados1 = expedientesAsignados1;

        if(expedientesAsignados1 == null){
            console.log("Error");
        }
        for(var i = 0; i < expedientesAsignados1.length; i++){
            var fila = tabla.insertRow();
            var datos = [
                expedientesAsignados1[i].id,
                transformar_fecha_hora(expedientesAsignados1[i].fecha_creacion),
                transformar_fecha_hora(expedientesAsignados1[i].fecha_asignacion),
                transformar_fecha_hora(expedientesAsignados1[i].fecha_resolucion),
                expedientesAsignados1[i].sip
            ];
                
            for(var j = 0; j < datos.length; j++){
                var celda = fila.insertCell(j);
                celda.innerHTML = datos[j];
            }
                
            var celdaBoton = fila.insertCell(datos.length);
            var celdaBoton1 = fila.insertCell(datos.length);
            celdaBoton.innerHTML = "<button onclick='mostrar(" + expedientesAsignados1[i].id + ")'>Mostrar</button>";
            celdaBoton1.innerHTML = "<button onclick='chat1(" + expedientesAsignados1[i].id + ")'>Chat</button>";
            }

    });
    cambiarSeccion("expedientes_asignados");
}

//----------------------------------------WEBSOCKET2-----------------------------------------------------------------------------------------------
let id_exp_chat_me1 = null;

function chat1(expId) {
    cambiarSeccion("chat_me2");
    id_exp_chat_me1 = expId;
    websocket = new WebSocket('ws://localhost:4444', "cliente");

    websocket.onopen = () => {
        console.log('MEDICO ESPECIALISTA CONECTADO!!!!');
        websocket.send(JSON.stringify({
            type: 'login',
            expedienteId: id_exp_chat_me1,
            tipoMedico: 'ME',
            nombreMedico: datos.nombre,
            especialidad: datos.especialidad
        }));
    };

    // Cuando recibo un mensaje de otro médico
    websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const listaMensajes = document.getElementById('mensajes1');
        const nuevoMensaje = document.createElement('li');
        nuevoMensaje.textContent = `${data.nombreMedico} (${data.tipoMedico}): ${data.mensaje} - ${data.fecha}`;
        listaMensajes.appendChild(nuevoMensaje);

    };

    websocket.onclose = () => {
        console.log('WebSocket cerrado...');
    };

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        };
}

function enviarMensaje1() {
    const mensajeInput = document.getElementById('mensajeEnviado1');
    const mensaje = mensajeInput.value;

    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
            type: 'message',
            expedienteId: id_exp_chat_me,
            tipoMedico: 'ME',
            mensaje: mensaje,
            nombreMedico: datos.nombre,
            fecha: new Date().toLocaleString()
        }));
        mensajeInput.value = '';
    }
}

function volveratras1() {
    cambiarSeccion("expedientes_asignados");
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
    }
    websocket = null;
    expedienteId = null;

    // Limpia la interfaz del chat si es necesario
    document.getElementById("mensajes1").innerHTML = "";
}
//-----------------------------------WEBSOCKET2-------------------------------------------------------------------------------------------------------

function cargarEspecialidades3() {
    obtenerEspecialidades(function(especialidades1) {
        console.log("especialidades que me pasa el servidor", especialidades1);
        var selectEspecialidades1 = document.getElementById("especialidades3");
        console.log("select de especialidades", selectEspecialidades1);
        // Limpiamos cualquier opción previa
        //selectEspecialidades1.innerHTML = "";
        // Iteramos sobre las especialidades y las agregamos como opciones al select
        especialidades1.forEach(function(especialidad1) {
            console.log("otra compribacion", especialidad1);
            var option = document.createElement("option");
            option.value = especialidad1.id; 
            option.text = especialidad1.nombre; 
            selectEspecialidades1.appendChild(option);
        });
    });
}

//FUNCION QUE SE ENCARGA DE MOSTRAR LOS DATOS DEL EXPEDIENTE QUE SE VA A RESOLVER.
var idExpResolver=null
//aqui tambien tengo que cargar todos los datos del expediente y la especialidad...
function mostrar(id_expediente){

    cargarEspecialidades3();

    cambiarSeccion("ver_expediente_asignado");
    
    idExpResolver = id_expediente;

    // Iterar sobre el array de expedientes que hemos creado como variable global
    for (var i = 0; i < expedientesYaAsignados1.length; i++) {
        // Comparar el ID del expediente con el ID recibido como parámetro
        if (expedientesYaAsignados1[i].id === id_expediente) {
        // Aquí encontraste el expediente que deseas mostrar
        var expediente = expedientesYaAsignados1[i];
        console.log("Expediente encontrado:", expediente);

        document.getElementById("id2").value = expediente.id;
        document.getElementById("medEsp1").value = expediente.me;
        document.getElementById("especialidades3").value = expediente.especialidad;
        document.getElementById("sip1").value = expediente.sip;
        document.getElementById("nombre2").value = expediente.nombre;
        document.getElementById("apellidos2").value = expediente.apellidos;
        document.getElementById("fnacimiento2").value = expediente.fecha_nacimiento;
        document.getElementById("genero2").value = expediente.genero;
        document.getElementById("observaciones2").value = expediente.observaciones;
        document.getElementById("solicitud2").value = expediente.solicitud;
        document.getElementById("respuesta2").value = expediente.respuesta;
        document.getElementById("fsolicitud2").value = expediente.fecha_creacion;
        document.getElementById("fasignacion2").value = expediente.fecha_asignacion;
        document.getElementById("fresolucion2").value = expediente.fecha_resolucion;

        // Una vez que encuentras el expediente que deseas mostrar, salir del bucle
        break;
        }
    }
}


//Resuelve un expediente poniendo la respuesta y asignado la fecha_resolucion.
function resolverExpediente(){
    respuesta = document.getElementById("respuesta2").value;

    //hacemos llamada RPC
    // Resolver el expediente seleccionado
    //le pasamos el id del expediente que nos hemos guardado arriba como variable global y la respuesta
    resolverExp(idExpResolver, respuesta, function(respuestaServer){
        if(respuestaServer){ 
            asignado(idExpResolver); //hacemos llamada a esta funcion para que nos aparezca la fecha de resolucion

            var fechaActual = new Date().toISOString();
            document.getElementById("fresolucion2").value = fechaActual;
            console.log(fechaActual);
            console.log("Expediente resuelto con exito"); 
        }
        else{
            console.log("expediente no encontrado");
        }

        cambiarSeccion("expedientes_asignados");
    });
}

//BOTONES PARA VOLVER ATRAS
function boton_volver_listado2(){
    cambiarSeccion("expedientes_asignados");
}

function borrar_campos_login(){
    document.getElementById("loginME").value = '';
    document.getElementById("passwordME").value = '';
}
function borrar_campos_registro(){
    document.getElementById("nombre").value = '';
    document.getElementById("apellidos").value = '';
    document.getElementById("loginME1").value = '';
    document.getElementById("passwordME1").value = '';
    document.getElementById("centros").value = '';
    document.getElementById("especialidad").value = '';
}

//FUNCIÓN PARA CAMBIAR LAS PANTALLAS
function cambiarSeccion(seccion){
    document.getElementById(seccionActual).classList.remove("activa");
    document.getElementById(seccion).classList.add("activa");
    seccionActual=seccion;
}

//FUNCION PARA CAMBIAR FECHA A UNA MAS LEGIBLE
function transformar_fecha(fecha){
    var año = String(fecha).substring(0,4);
    var mes = String(fecha).substring(5,7);
    var dia = String(fecha).substring(8,10);
    return año+"-"+mes+"-"+dia;
}

//Para las horas
function transformar_fecha_hora(fecha){
    var horas = String(fecha).substring(11,13);
    var minutos = String(fecha).substring(14,16);
    var segundos = String(fecha).substring(17,19);

    return transformar_fecha(fecha)+ " "+horas+":"+minutos+":"+segundos;

}










