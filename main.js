let session;
let overviewInterval;

const Sizes = {
    0: "Byte",
    1: "KiB",
    2: "MiB",
    3: "GiB",
    4: "TiB"
}

async function fetchInitData() {
    try {
        const response = await fetch('/api/init.sctx');
        return await response.json();
    }
    catch (error) { console.error(error); }
}

async function fetchOverviewData() {
    try {
        const response = await fetch('/api/overview.sctx', { method: 'POST', body: `session=${session}` });
        return await response.json();
    }
    catch (error) { console.error(error); }
}

async function selectStream(streamNumber) {
    try {
        const response = await fetch('/api/select.sctx', {
            method: 'POST',
            body: `session=${session}&stream=${(streamNumber)}`,
        });
        return response;
    }
    catch (error) { console.error(error); }
}



function createStreamTile(stream, streamNumber) {
    const tile = document.createElement('div');
    tile.classList.add('stream-tile');

    const title = document.createElement('h3');
    title.textContent = `Monitor ${streamNumber}`;
    tile.appendChild(title);

    const img = new Image();
    img.src = `data:image/jpeg;base64,${stream.previewData}`;
    img.classList.add('tile-image');
    tile.appendChild(img);

    tile.addEventListener('click', async () => {
        await document.documentElement.webkitRequestFullscreen();
        await selectStream(streamNumber - 1);

        const mainContainer = document.querySelector(".main-container");
        mainContainer.style.display = 'none';

        const tableContainer = document.querySelector('.table-container');
        tableContainer.style.display = 'none';

        const myStream = new Stream();

        await myStream.initStream(session);
    });
    return tile;
}

//The intervall calls this Method every 5 secs.
async function updateStreamTiles(container) {
    const overviewResponse = await fetchOverviewData();

    container.innerHTML = '';

    for (let i = 0; i < overviewResponse.streams.length; i++)
        container.appendChild(this.createStreamTile(overviewResponse.streams[i], i + 1));
}


//Adds an postFix and convertes dataSizes /1024 and Hz 1000/
function converteData(data) {
    for(key in data){
        if(typeof data[key] === 'object' && data[key] !== null){
            converteData(data[key]);
            continue;
        }
        if(key === 'total' || key === 'available' || key === 'ram' || key === 'size' || key === 'space' || key === 'totalJSHeapSize' || key === 'usedJSHeapSize' || key === 'jsHeapSizeLimit'){
            let iterations = 0;
            while(data[key] > 1000){
                data[key] /= 1024;
                ++iterations;
            }
            data[key] = data[key].toFixed(2) + Sizes[iterations];
        }
        if(key === 'coreSpeed' || key === 'theoreticalTotalSpeed')
            data[key] = (data[key] / 1000).toFixed(2) + 'GHz';
    }

}

//Collects all top-level key-value pairs from an object, excluding any nested elemments.
function collectElements(data, objName = 'misc') {
    const entries = [];
    const newObject = {};
    for (const key in data)
        if (typeof data[key] !== 'object') {
            entries.push(`${objName} : ${key} : ${data[key]}`);
            delete data[key];
        }

    for (const entry of entries) {
        const parts = entry.split(" : ").map(part => part.trim());
        const [group, key, value] = parts;
        if (!newObject[group])
            newObject[group] = {};

        newObject[group][key] = isNaN(value) ? value : Number(value);
    }
    return newObject;
}

//Searches for wrappers and returns an array of objects found within those wrappers.
function collectWrappers(data) {
    let index = 0;
    const arr = [];
    for (const key in data)
        if (typeof data[key][Object.keys(data[key])[0]] === 'object')
            if (data[key][Object.keys(data[key])[0]] !== null) {
                arr[index++] = data[key];
                delete data[key];
            }

    return arr;
}

//Creates a HTML-Table from an object. Note: This method expects an object with a flat structure.
function createTable(obj, table, tableContainer, isLast = false) {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            table.appendChild(tr);
            tr.appendChild(th);
            th.textContent = key;
            createTable(obj[key], table, tableContainer, true);
            if (isLast === false) {
                table = document.createElement('table');
                tableContainer.appendChild(table);
            }
        }
        else {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            const td = document.createElement('td');
            table.appendChild(tr);
            tr.appendChild(th);
            tr.appendChild(td);
            th.textContent = key + ":";
            td.textContent = obj[key];
        }
    }
}

function createSystemOverviewTile(data) {
    const tableContainer = document.querySelector('.table-container');
    const table = document.createElement('table');
    tableContainer.appendChild(table);
    tableContainer.style.display = 'none';

    converteData(data.system);
    const miscElements = collectElements(data.system, 'sysConfig');
    const objs = collectWrappers(data.system);

    createTable(data.system, table, tableContainer);
    for (let i = 0; i < objs.length; i++)
        createTable(objs[i], tableContainer.children[tableContainer.children.length - 1], tableContainer);

    createTable(miscElements, tableContainer.children[tableContainer.children.length - 1], tableContainer);

    const memory = collectElements(window.performance.memory, "Browsermemory");
    converteData(memory);
    createTable(memory, tableContainer.children[tableContainer.children.length - 1], tableContainer, true);

    const button = document.querySelector('.material-icons');
    button.innerHTML = '<span class="material-symbols-outlined">toggle_off</span>';

    button.addEventListener('click', () => {
        if (tableContainer.style.display === 'none') {
            tableContainer.style.display = 'grid';
            button.innerHTML = '<span class="material-symbols-outlined">toggle_on</span>';
        }
        else {
            tableContainer.style.display = 'none';
            button.innerHTML = '<span class="material-symbols-outlined">toggle_off</span>';
        }
    });

}


//The init-function calls all methods to create the Overview and starts an Intervall to update the stream-preview every 5 secs.
async function init() {
    const initResponse = await fetchInitData();
    session = initResponse.session;

    createSystemOverviewTile(initResponse);

    const streamOverviewContaier = document.querySelector(".streamOverview-container");
    await updateStreamTiles(streamOverviewContaier);
    setInterval(async () => await updateStreamTiles(streamOverviewContaier), 5000);
}

init();