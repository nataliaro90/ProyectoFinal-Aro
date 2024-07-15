class Tarea {
    constructor(descripcion, date, hour, ciudad) {
        this.descripcion = descripcion;
        this.date = date;
        this.hour = hour;
        this.realizada = false;
        this.ciudad = ciudad;
        this.clima = '';
    }
}

let Tareas = JSON.parse(localStorage.getItem("tareas")) || [];

const guardarTareas = () => {
    localStorage.setItem("tareas", JSON.stringify(Tareas));
}

const mostrarTareas = () => {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";
    Tareas.sort((a, b) => moment(a.date + ' ' + a.hour, 'YYYY-MM-DD HH:mm').diff(moment(b.date + ' ' + b.hour, 'YYYY-MM-DD HH:mm')));
    Tareas.forEach((tarea, index) => {
        const { descripcion, date, hour, realizada, clima, ciudad } = tarea;
        const formattedDate = moment(date).format('DD-MM-YYYY');
        const tareaItem = document.createElement("li");
        tareaItem.className = "task-item";
        const taskHtml = `<span>${descripcion} - ${formattedDate} - ${hour}</span>
            <div>
                <p>Ciudad: ${ciudad} Clima: ${clima} °C</p>
            </div>
            ${!realizada ? `<button onclick="marcarRealizada(${index})" class="button-realizar">Marcar como realizada</button>` : `<button disabled class="button-realizada">Realizada</button>`}
            <button onclick="eliminarTarea(${index})" class="button-eliminar">Eliminar</button>`;
        tareaItem.innerHTML = taskHtml;
        taskList.appendChild(tareaItem);
    });
}

const agregarTarea = async () => {
    const descripcion = document.getElementById("taskDescription").value;
    const date = document.getElementById("taskDate").value;
    const hour = document.getElementById("taskTime").value;
    const ciudad = document.getElementById("taskCity").value;
    const errorMessage = document.getElementById("errorMessage");

    if (!descripcion || !date || !hour || !ciudad) {
        errorMessage.textContent = "Por favor, complete todos los campos.";
        errorMessage.style.display = "block";
        return;
    }
    
    errorMessage.style.display = "none";
    
    const nuevaTarea = new Tarea(descripcion, date, hour, ciudad);
    Tareas.push(nuevaTarea);
    
    try {
        nuevaTarea.clima = await obtenerClima(ciudad);
    } catch (error) {
        console.error('Error obteniendo el clima:', error);
        nuevaTarea.clima = 'No disponible';
    }
    
    guardarTareas();
    mostrarTareas();
    
    document.getElementById("taskForm").reset();
    document.getElementById("taskForm").style.display = "none";
    Swal.fire({
        icon: 'success',
        title: 'Tarea agregada',
        showConfirmButton: false,
        timer: 1500
    });
}

const marcarRealizada = (index) => {
    Tareas[index].realizada = true;
    guardarTareas();
    mostrarTareas();
}

const eliminarTarea = (index) => {
    Tareas.splice(index, 1);
    guardarTareas();
    mostrarTareas();
    Swal.fire({
        icon: 'success',
        title: 'Tarea eliminada',
        showConfirmButton: false,
        timer: 1500
    });
}

document.getElementById("addTaskButton").addEventListener("click", () => {
    document.getElementById("taskForm").style.display = "block";
});

document.getElementById("saveTaskButton").addEventListener("click", agregarTarea);

const obtenerClima = async (ciudad) => {
    try {
        const apiKey = '3d2c972681d840d0316df7fc761c80d7';
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric`;
        
        if (!ciudad) {
            throw new Error('Ciudad no especificada.');
        }
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Ciudad no encontrada.');
            } else {
                throw new Error('No se pudo obtener el clima.');
            }
        }
        
        const data = await response.json();
        return data.main.temp;
    } catch (error) {
        console.error('Error obteniendo el clima:', error);
        return null;
    }
}

const cargarDatos = async () => {
    try {
        const response = await fetch('./data/tareas.json');
        const data = await response.json();
        
        Tareas = data.map(tarea => new Tarea(tarea.descripcion, tarea.date, tarea.hour, tarea.ciudad));
        
        await Promise.all(Tareas.map(async tarea => {
            tarea.clima = await obtenerClima(tarea.ciudad);
        }));

        guardarTareas();
        mostrarTareas();
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

cargarDatos();