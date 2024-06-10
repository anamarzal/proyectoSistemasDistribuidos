// rest.get(url, callback)
// rest.post(url, body, callback)
// rest.put(url, body, callback)
// rest.delete(url, callback)
// function callback(estado, respuesta) {...}


var conexion = null;
var seccionActual = "login_map";
var id_map = 0;
datos = [];


//PRIMER BOTON
//BOTON PARA ACCEDER A LA APLICACION MAP
function entrar(){
    get_especialidades();
    var datos = {
        login: document.getElementById("login").value,
        password: document.getElementById("password").value,
    };
    //enviamos solicitud POST para autentificar al medico
    rest.post("/api/medico/login", datos, function(estado, respuesta){
        console.log(estado,respuesta)
        if(estado == 201){
            console.log("El ID es: " + respuesta.id);

            id_map = respuesta.id; //almacenamos el ID del medico que es lo que nos pasa el servidor.

            datos_map(id_map); //Obtenemos los datos del medico especificado llamando a la funcion "datos map"
            lista_expedientes(id_map); //actualizamos la lista de los expedientes segun el id del map que ha entrado
            
            var lista = document.getElementById("nombre_menu");
            lista.innerHTML = "";
            lista.innerHTML += respuesta.nombre + " "+respuesta.apellidos; //mostramos nombre y apellidos del map que ha entrado.

            cambiarSeccion("menu_principal");
            borrar_campos_login();
            return;
        }else{
            alert("ERROR");
        }
    });
}

// OBTIENEN LOS DATOS DEL MEDICO MENOS LA CONTRASEÑA
//FUNCION QUE SE UTILIZA PARA CARGAR LOS DATOS DEL MEDICO
function datos_map(idMAP){
    rest.get("/api/medico/" + idMAP, function(estado, respuesta){
        if(estado != 200){
            alert("Error cargando los datos del médico");
        }
        else{
            datos = respuesta; //nos guardamos los datos del medico para hacer uso de ellos en adelante.
            console.log("datos map actualizado:", respuesta);    
        }
    });
}

//BOTON REGISTRARSE PARA UN NUEVO MEDICO SE ENCARGA DE CARGAR LOS CENTROS EN EL SELECT. 
var centros = [];
var centrosCargados = false; // Variable para verificar si los centros ya se han cargado

function registrarse() {
    // Si los centros aún no se han cargado, cargarlos
    if (!centrosCargados) {
        rest.get("/api/centros", function(estado, respuesta) {
            if (estado == 200) {
                for (var i = 0; i < respuesta.length; i++) {
                    centros.push({id: respuesta[i].id, nombre: respuesta[i].nombre});
                }
                var select_centros = document.getElementById("centros");
                for (var i = 0; i < centros.length; i++) {
                    var option = document.createElement("option");
                    option.value = centros[i].id;
                    option.text = centros[i].nombre;
                    select_centros.add(option);
                }
                if(centros.length > 0){
                    select_centros.value = centros[0].id;
                }
                //console.log("Lista de centros cargada exitosamente:", centros);
                centrosCargados = true; // Marcar que los centros se han cargado
            } else {
                alert(respuesta);
            }
        });
    }

    // Cambiar a la sección de registro de nuevo médico
    cambiarSeccion("registro_nuevo_medico");
}

//AÑADE UN NUEVO MEDICO AL ARRAY DE MEDICOS.
function guardar_nuevo_map(){
    var centro_seleccionado = document.getElementById("centros");
    if(centro_seleccionado){
        var centro_seleccionado_valor = parseInt(centro_seleccionado.value);
    }; 

    //COGEMOS LOS DATOS DEL NUEVO MEDICO A REGISTRAR PARA LUEGO MANDARSELOS AL SERVIDOR.
        var nuevo_map = {
            nombre: document.getElementById("nombre").value,
            apellidos : document.getElementById("apellidos").value,
            log: document.getElementById("log").value,
            pass: document.getElementById("pass").value,
            centro: centro_seleccionado_valor,
        };
        //console.log("Nuevo Map:", nuevo_map); // verificar el contenido de nuevo_map  

    rest.post("/api/medico", nuevo_map, function(estado, respuesta){
        if(estado == 201){
            cambiarSeccion("login_map");
            borrar_campos_registro();
        }
        else{
            alert("el login ya existe, pruebe otro.")
        }
        
    });

}

//obtiene una lista de todos las especialides en forma de array
var especialidades = null;
function get_especialidades(){
    especialidades = [];
    rest.get("/api/especialidades", function(estado, respuesta){
        if(estado == 200){
            for (var i = 0; i < respuesta.length; i++){
                especialidades.push({ id: respuesta[i].id, nombre: respuesta[i].nombre });   
            }
            //console.log("Lista de especialidades cargada exitosamente:", especialidades);
        } else{
            alert(respuesta);
        }
    });
}

//MUESTRA LA LISTA DE EXPEDIENTES DE ESE MEDICO 
//Y LOS AÑADE A LA TABLA
function lista_expedientes(idMAP) {
    rest.get("/api/map/" + idMAP + "/expedientes", function (estado, respuesta) {
        var lista_expedientes = document.getElementById("lista_expedientes");
        lista_expedientes.innerHTML = "";

        // Crear tabla
        var tabla = document.createElement("table");
        lista_expedientes.appendChild(tabla);
  
        // Encabezados de la tabla
        var encabezados = ["ID", "F.Cre.", "F.Asg.", "F.Res.", "Especialidad", "SIP", "", "", ""];
        var filaEncabezado = tabla.insertRow();
  
        for (var i = 0; i < encabezados.length; i++) {
            var encabezado = document.createElement("th");
            encabezado.innerHTML = encabezados[i];
            filaEncabezado.appendChild(encabezado);
        }

        if (estado !== 200) {
            console.log("Este médico aún no tiene pacientes");
        return;
        }
        // Filas con datos
        for (var i = 0; i < respuesta.length; i++) {
            var fila = tabla.insertRow();
            var datos = [
                respuesta[i].id,
                transformar_fecha_hora(respuesta[i].fecha_creacion),
                transformar_fecha_hora(respuesta[i].fecha_asignacion),
                transformar_fecha_hora(respuesta[i].fecha_resolucion),
                obtenerNombreEspecialidad(respuesta[i].especialidad),
                respuesta[i].sip
            ];

            for (var j = 0; j < datos.length; j++) {
                var celda = fila.insertCell(j);
                celda.innerHTML = datos[j];
            }

            var celdaBoton = fila.insertCell(datos.length);
            var celdaBoton1 = fila.insertCell(datos.length);
            var celdaBoton2 = fila.insertCell(datos.length);
            celdaBoton.innerHTML = "<button onclick='borrarExpediente(" + respuesta[i].id + ")'>Eliminar</button>";
            celdaBoton1.innerHTML = "<button onclick='modificarExpediente(" + respuesta[i].id + ")'>Modificar</button>";
            celdaBoton2.innerHTML = "<button onclick='chat(" + respuesta[i].id + ")'>Chat</button>";
        }
    });
}
//----------------------WEBSOCKET--------------------------------------------------------------------------------------------------------------------
// Funcionalidad del chat
let expedienteId;

function chat(expId) {
    cambiarSeccion("chat_map");
    expedienteId = expId;
    websocket = new WebSocket('ws://localhost:4444', "cliente");

    websocket.onopen = () => {
        console.log('MEDICO MAP CONECTADO!!!!!!');
        websocket.send(JSON.stringify({
            type: 'login',
            expedienteId: expedienteId,
            tipoMedico: 'MAP',
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

function enviarMensaje() {
    const mensajeInput = document.getElementById('mensajeEnviado');
    const mensaje = mensajeInput.value;

    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
            type: 'message',
            expedienteId: expedienteId,
            tipoMedico: 'MAP',
            mensaje: mensaje,
            nombreMedico: datos.nombre, 
            fecha: new Date().toLocaleString()
        }));
        mensajeInput.value = '';
    }
}

function volveratras() {
    cambiarSeccion("menu_principal");
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
    }
    websocket = null;
    expedienteId = null;

    // Limpia la interfaz del chat si es necesario
    document.getElementById("mensajes1").innerHTML = "";
}
//-----------------------------WEBSOCKET-----------------------------------------------------------------------------------------------------------------------


// FUNCION PARA OBTENER NOMBRE ESPECIALIDAD para la tabla
function obtenerNombreEspecialidad(idEspecialidad){
    //console.log("Especialidades dentro de obtenerNombreEspecialidad:", especialidades);
    for(var i = 0; i < especialidades.length; i++){
        if(especialidades[i].id == idEspecialidad){
            var espe = especialidades[i].nombre;
            return espe;
            
        }
        
    }
    return 'no existe esa especialidad';
}

// Función para borrar un expediente
function borrarExpediente(id) {
    if (confirm("¿Estás seguro de que deseas borrar este expediente?")) {
        rest.delete("/api/expediente/" + id, function(estado, respuesta) {
            if (estado == 200) {
                // Eliminar la celda correspondiente del expediente de la interfaz de usuario
                var celda = document.getElementById("expediente_" + id);
                console.log(celda);
                if (celda) {
                    celda.remove();
                }
                console.log("Expediente eliminado exitosamente");
            } else {
                alert("Error al eliminar el expediente: " + respuesta);
            }
        });
    }
}

//FUNCION QUE CARGA LOS CENTROS EN LA PANTALLA DE EDITAR DATOS DEL MEDICO
var centros1 = [];
var centrosCargados1 = false; // Variable para verificar si los centros ya se han cargado

function modificar_datos_map(){
    cargar_datos_map(id_map); //llamamos a la funcion para cargar los datos actuales del map

    // Si los centros aún no se han cargado, cargarlos
    if (!centrosCargados1) {
        rest.get("/api/centros", function(estado, respuesta) {
            if (estado == 200) {
                for (var i = 0; i < respuesta.length; i++) {
                    centros1.push({id: respuesta[i].id, nombre: respuesta[i].nombre});
                }

                var select_centros1 = document.getElementById("centros1");
                for (var i = 0; i < centros1.length; i++) {
                    var option = document.createElement("option");
                    option.value = centros1[i].id;
                    option.text = centros1[i].nombre;
                    select_centros1.add(option);
                }

                if(centros.length > 0){
                    select_centros1.value = centros1[0].id;
                }
                //console.log("Lista de centros cargada exitosamente:", centros);
                centrosCargados1 = true; // Marcar que los centros se han cargado
            } else {
                alert(respuesta);
            }
        });
    }
    cambiarSeccion("cambiar_datos_map");
    

}

//FUNCION PARA QUE SALGAN LOS DATOS DEL MAP A MODIFICAR
function cargar_datos_map(idMAP){
    rest.get("/api/medico/" + idMAP, function(estado, respuesta){
        if(estado != 200){
            alert("Error cargando los datos del médico");
        }else{
            document.getElementById("nombre1").value = respuesta.nombre;
            document.getElementById("apellidos1").value = respuesta.apellidos;
            document.getElementById("log1").value = respuesta.login;
            // No se muestra la contraseña por motivos de seguridad
            // document.getElementById("pass1").value = respuesta.password;
            // Seleccionar el centro correspondiente
            document.getElementById("centros1").value = respuesta.centro;
        }
    });
}

//FUNCION QUE SE ENCARGA DE ACTUALIZAR LOS DATOS MODIFICADOS DE ESE MAP.
function guardar_datos_modificados(){
    var centro_seleccionado = document.getElementById("centros1");
    if(centro_seleccionado){
        var centro_seleccionado_valor = parseInt(centro_seleccionado.value);
    };
        var cambios_map = {
            nombre: document.getElementById("nombre1").value,
            apellidos : document.getElementById("apellidos1").value,
            login: document.getElementById("log1").value,
            password: document.getElementById("pass1").value,
            centro: centro_seleccionado_valor,
        };
        //console.log("Cambios realizados:", cambios_map); // verificar el contenido de nuevo_map  

    rest.put("/api/medico/" + id_map, cambios_map, function(estado, respuesta){
        if(estado == 200){
            cambiarSeccion("menu_principal");
            borrar_campos_registro();
        }
        else{
            alert("el login ya existe, pruebe otro.")
        }
        
    });

}

//VOLVER A EL MENU PRINCIPAL SI ENTRAMOS EN CAMBIAR DATOS MAP
function boton_volver_inicio(){
    cambiarSeccion("menu_principal")
}

//FUNCION QUE SE ENCARGA DE CARGAR EL SELECT DE ESPECIALIDADES CUANDO ENTRAMOS 
//PARA CREAR UN NUEVO EXPEDIENTE. 
function boton_crear_nuevo_expediente(){
    var selectEspecialidades = document.getElementById("especialidades");
            selectEspecialidades.innerHTML = ""; // Limpiar el select antes de agregar las nuevas opciones
            for (var i = 0; i < especialidades.length; i++) {
                var option = document.createElement("option");
                option.value = especialidades[i].id;
                option.text = especialidades[i].nombre;
                selectEspecialidades.appendChild(option);
            }
    cambiarSeccion("nuevo_expediente");
    borrar_campos_nuevo_expediente();
}
//BOTON VOLVER AL MENU PRINCIPAL CUANDO HEMOS ENTRADO PARA CREAR UN NUEVO EXPEDIENTE
function boton_volver_inicio_medico(){
    cambiarSeccion("menu_principal");
}
//esta funcione si que es la que hay que hacer para que se guarde el nuevo expediente
//creado en la lista de expedientes del MAP
function guardar_nuevo_expediente(){
    var especialidad_seleccionada = document.getElementById("especialidades");
    if(especialidad_seleccionada){
        var especialidad_seleccionada_valor = especialidad_seleccionada.value;
    }
    var sip = document.getElementById("sip").value;
    var nombre = document.getElementById("nombrenuevoexp").value;
    var apellidos = document.getElementById("apellidosnuevoexp").value;
    var fecha_nacimiento = document.getElementById("fnacimientonuevoexp").value;
    var genero = document.getElementById("genero").value;
    var observaciones = document.getElementById("observaciones").value;
    var solicitud = document.getElementById("solicitud").value;

    var nuevoExpediente = {
        especialidad: especialidad_seleccionada_valor ,
        sip: sip,
        nombre: nombre,
        apellidos: apellidos,
        fecha_nacimiento: fecha_nacimiento,
        genero: genero,
        observaciones: observaciones,
        solicitud: solicitud,
        map: id_map // Utilizamos el ID del MAP almacenado en la variable global
    };

    rest.post("/api/map/" + id_map +" /expedientes", nuevoExpediente, function(estado, respuesta) {
        if (estado === 201) {
            //console.log("Expediente agregado correctamente:", respuesta, nuevoExpediente);
            lista_expedientes(id_map);
            cambiarSeccion("menu_principal")
        } else {
            console.error("Error al agregar el expediente:", respuesta);
        }
    });
}

//FUNCION QUE SE ENCARGA DE CARGAR EL SELECT DE ESPECIALIDADES
//Y ADEMAS CARGAR LOS DATOS DEL EXPEDIENTE A MODIFICAR
function modificarExpediente(id) {
    expedienteId = id;
    if (confirm("¿Estás seguro de que deseas modificar este expediente?")) {
        rest.get("/api/map/" + id_map + "/expedientes", function(estado, respuesta) {
            if (estado !== 200) {
                alert("Error cargando los datos del expediente");
                return;
            }
            // Encuentra el expediente correspondiente en la respuesta
            var expediente;
            for (var i = 0; i < respuesta.length; i++) {
                if (respuesta[i].id === id) {
                    expediente = respuesta[i];
                    break;
                }
            }
            if (!expediente) {
                alert("No se encontró el expediente");
                return;
            }
            // Llenar el select de especialidades
            var selectEspecialidades1 = document.getElementById("especialidades1");
            selectEspecialidades1.innerHTML = ""; // Limpiar el select antes de agregar las nuevas opciones
            for (var i = 0; i < especialidades.length; i++) {
                var option = document.createElement("option");
                option.value = especialidades[i].id;
                option.text = especialidades[i].nombre;
                selectEspecialidades1.appendChild(option);
            }
            // Rellenar los campos del formulario con los datos del expediente
            document.getElementById("id1").value = expediente.id;
            document.getElementById("medEsp1").value = expediente.me
            document.getElementById("especialidades1").value = expediente.especialidad;
            document.getElementById("sip1").value = expediente.sip;
            document.getElementById("nombrenuevoexp1").value = expediente.nombre;
            document.getElementById("apellidosnuevoexp1").value = expediente.apellidos;
            document.getElementById("fnacimientonuevoexp1").value = expediente.fecha_nacimiento;
            document.getElementById("genero1").value = expediente.genero;
            document.getElementById("observaciones1").value = expediente.observaciones;
            document.getElementById("solicitud1").value = expediente.solicitud;
            document.getElementById("respuesta1").value = expediente.respuesta;
            document.getElementById("fsolicitud1").value = expediente.fecha_creacion;
            document.getElementById("fasignacion1").value = expediente.fecha_asignacion;
            document.getElementById("fresolucion1").value = expediente.fecha_resolucion;

            cambiarSeccion("cambiar_datos_expediente");
        });
    }
}

//FUNCION QUE GUARDA LOS CAMBIOS REALIZADOS EN UN EXPEDIENTE
function guardar_cambios_expediente(){
    var especialidad = document.getElementById('especialidades1').value;
    var sip = document.getElementById('sip1').value;
    var nombre = document.getElementById('nombrenuevoexp1').value;
    var apellidos = document.getElementById('apellidosnuevoexp1').value;
    var fechaNacimientoString = document.getElementById('fnacimientonuevoexp1').value;
    var fecha_nacimiento = new Date(fechaNacimientoString);
    var genero = document.getElementById('genero1').value;
    var observaciones = document.getElementById('observaciones1').value;
    var solicitud = document.getElementById('solicitud1').value;

    var expedienteActualizado = {
        especialidad: especialidad,
        sip: sip,
        nombre: nombre,
        apellidos: apellidos,
        fecha_nacimiento: fecha_nacimiento,
        genero: genero,
        observaciones: observaciones,
        solicitud: solicitud
    };

    rest.put("/api/expediente/" + expedienteId, expedienteActualizado, function(estado, respuesta) {
        if (estado === 200) {
            console.log("Expediente actualizado correctamente:", respuesta, expedienteActualizado);
        } else {
            console.error("Error al actualizar el expediente:", respuesta);
        }
    });
    cambiarSeccion("menu_principal")
}

//BOTON PARA SALIR DE LA PAGINA PRINCIPAL Y VOLVER AL LOGIN.
function boton_volver_login(){
    cambiarSeccion("login_map");
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

//FUNCIÓN PARA CAMBIAR LAS PANTALLAS
function cambiarSeccion(seccion){
    document.getElementById(seccionActual).classList.remove("activa");
    document.getElementById(seccion).classList.add("activa");
    seccionActual=seccion;
}
//FUNCIONES PARA BORRAR CAMPOS
function borrar_campos_registro(){
    document.getElementById("nombre").value = '';
    document.getElementById("apellidos").value = '';
    document.getElementById("log").value = '';
    document.getElementById("pass").value = '';
    document.getElementById("centros").value = '';
}
function borrar_campos_cambio_datos_map(){
    document.getElementById("nombre1").value = '';
    document.getElementById("apellidos1").value = '';
    document.getElementById("log1").value = '';
    document.getElementById("pass1").value = '';
    document.getElementById("centros").value = '';
}
function borrar_campos_login(){
    document.getElementById("login").value = '';
    document.getElementById("password").value = '';
}
function borrar_campos_nuevo_expediente(){
    document.getElementById("sip").value = '';
    document.getElementById("nombrenuevoexp").value = '';
    document.getElementById("apellidosnuevoexp").value = '';
    document.getElementById("fnacimientonuevoexp").value = '';
    document.getElementById("observaciones").value = '';
    document.getElementById("solicitud").value = '';
}
function borrar_campos_cambios_expediente(){
    document.getElementById("sip1").value = '';
    document.getElementById("nombrenuevoexp1").value = '';
    document.getElementById("apellidosnuevoexp1").value = '';
    document.getElementById("fnacimientonuevoexp1").value = '';
    document.getElementById("observaciones1").value = '';
    document.getElementById("solicitud1").value = ''; 
}


//-----------------------------EXAMEN PRACTICAS--------------------------------------------------------------
function boton_estadisticas(){
    var idMedico = datos.id;
    console.log("este es el id del map que se esta pasando", idMedico);
    rest.get("/api/map/" + idMedico + "/estadisticas", function(estado,respuesta){
        console.log("Total:", respuesta.Total + "Asignados:" + respuesta.Asignados + "resueltos:" + respuesta.Resueltos);
    })
}
//-----------------------------------------------------------------------------------------------------------------









