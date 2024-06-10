// Crear un servidor HTTP
var http = require("http");
var httpServer = http.createServer();

// Crear servidores WS
var WebSocketServer = require("websocket").server; // instalar previamente: npm install websocket
var wsServer = new WebSocketServer({
	httpServer: httpServer
});

// Iniciar el servidor HTTP en un puerto
var puerto = 4444;
httpServer.listen(puerto, function () {
	console.log("Servidor de WebSocket iniciado en puerto:", puerto);
});

//Se requieren los datos del archivo datos.js
var datos = require("./datos.json");


let expedienteConexiones = []; // Almacena las conexiones por expediente

wsServer.on("request", function (request) {
    var connection = request.accept("cliente", request.origin);
    var ws = { connection: connection };

    expedienteConexiones.push(ws);

    connection.on("message", function (message) {
        if (message.type === "utf8") {
            console.log("Mensaje recibido de cliente: " + message.utf8Data);
            const data = JSON.parse(message.utf8Data);

            switch (data.type) {
                case "login":
                    if (!expedienteConexiones[data.expedienteId]) {
                        expedienteConexiones[data.expedienteId] = { MAP: null, ME: null };
                    }

                    if (data.tipoMedico === "MAP") {
                        expedienteConexiones[data.expedienteId].MAP = ws;
                    } else if (data.tipoMedico === "ME") {
                        expedienteConexiones[data.expedienteId].ME = ws;
                    }

                    ws.connection.expedienteId = data.expedienteId;
                    ws.connection.tipoMedico = data.tipoMedico;
                    ws.connection.nombreMedico = data.nombreMedico;
                    ws.connection.especialidad = data.especialidad;
                    break;
                case "message":
                    enviarMensaje(data);
                    break;
                default:
                    console.error("Error", data.type);
            }
        }
    });

    connection.on("close", function () {
        if (connection.expedienteId && connection.tipoMedico) {
            expedienteConexiones[connection.expedienteId][connection.tipoMedico] = null;
        }
    });
});

function enviarMensaje(data) {
    const conexion = expedienteConexiones[data.expedienteId];

    if (conexion) {
        const receptorTipo = data.tipoMedico === "MAP" ? "ME" : "MAP"; //si es igual a MAP hablamos con un ME si es igual a ME hablamos con un MAP
        const receptorWs = conexion[receptorTipo];

        // ¿El expediente está abierto?
        if (data.tipoMedico === "MAP"){
			enviarMensajeAll(data);
		}
        // En caso contrario, el expediente está asignado y nos comunicamos con el medico especialista en concreto
        else enviarMensajeMedico(receptorWs, data);
    }
}

function enviarMensajeMedico(receptorWS, data) {
    if (receptorWS && receptorWS.connection.readyState === wsServer.OPEN) {
        receptorWS.connection.send(JSON.stringify(data));
    }
}

function enviarMensajeAll(data) {
    // Buscar el expediente correspondiente en los datos
    const expediente = datos.expedientes.find(exp => exp.id === data.expedienteId);

    if (!expediente) {
        console.error("No se encontró el expediente con ID");
        return;
    }

    // Buscar todas las conexiones relacionadas con el expediente
    const conexionesExpediente = expedienteConexiones.filter(conexion => {
        return conexion && conexion.connection && conexion.connection.expedienteId === data.expedienteId;
    });

    // Filtrar las conexiones que no son del mismo tipo de médico que el remitente
    const conexionesDestino = conexionesExpediente.filter(conexion => {
        return conexion && conexion.connection && conexion.connection.tipoMedico !== data.tipoMedico;
    });

    // Enviar el mensaje a todas las conexiones destino
    conexionesDestino.forEach(conexion => {
        if (conexion.connection.readyState === wsServer.OPEN) {
            conexion.connection.send(JSON.stringify(data));
        }
    });
}




