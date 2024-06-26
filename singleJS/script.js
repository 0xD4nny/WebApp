//stream
async function downloadImage(command) {
    try {
        await fetch(command.uri).then((response) =>
            response.blob()).then((blob) => {

                const imageElement = document.createElement("stream");
                imageElement.src = URL.createObjectURL(blob);

                imageElement.width = command.width;
                imageElement.height = command.height;
                imageElement.x = command.x;
                imageElement.y = command.y;

                const canvas = document.getElementById("stream");
                canvas.appendChild(imageElement);
                const ctx = canvas.getContext("2d");
                ctx.drawImage(imageElement.src)
            });
    }
    catch (error) { console.error('Error fetching the image:', error); }
}

async function eventHandler(response) {
    let isNotTerminated = true;

    response.commands.forEach(command => {
        //console.log(`current event: ${command.command}`);
        switch (command.command) {
            case 'geometry':
                console.log(`geometry event: ${command.command}`); // returns width and height.
                break;
            case 'image':
                this.downloadImage(command);
                console.log(`image event: ${command.command}`); // returns img fragments.
                break;
            case 'overlay':
                console.log(`overlay event: ${command.command}`); // returns the visibility of the overlay.
                break;
            case 'overlayImage':
                console.log(`overlayImage event: ${command.command}`); // returns an overlay img.
                break;
            case 'overlayPosition':
                console.log(`overlayPosition event: ${command.command}`); // returns the x and y pos for the Overlay.
                break;
            case 'terminated':
                isNotTerminated = false;
                console.log(`terminated event: ${command.command}`); // returns weathever the stream is terminated.
                break;
        }
    });
    return isNotTerminated;
}

async function fetchStream(session) {
    try {
        const response = await fetch('/api/event.sctx', {
            method: 'POST',
            body: `session=${session}`
        });

        return await response.json();
    }
    catch (error) { console.error(error); }
}

function bringBackCss(){
    const container = document.querySelector('.container');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(400px, 1fr))';
    container.style.gap = '30px';
    container.style.padding = '30px';
    container.style.boxSizing = 'border-box';

    const tile = document.querySelector('.tile');
    tile.style.backgroundColor = 'rgb(64, 64, 64)';
    tile.style.border = '2px solid rgb(32, 32, 32)';
    tile.style.boxSizing = 'border-box';
    tile.style.textAlign = 'center';

    const tileImage = document.querySelector('.tile-image');
    tileImage.style.imageRendering = 'optimizeQuality';
    tileImage.style.objectFit = 'fill';
    tileImage.style.width = '70%';
    tileImage.style.height = '70%';
}

async function initStream(session) {
    let clicked = false;
    document.addEventListener('click', () => {
        if (document.fullscreenElement) {
            clicked = true;
            document.exitFullscreen();
            updateTiles(session);
            OverviewInterval = setInterval(() => updateTiles(session), 5000);
            document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) { bringBackCss(); }});
    }}) // this click event takes us back to the overview.

    // the eventHandler returns false if we got a terminated command.
    while (await eventHandler(await fetchStream(session)) && !clicked);
}

//Overview
async function selectStream(session, streamNumber) { // gets call from createTile
    try {
        const response = await fetch('/api/select.sctx', {
            method: 'POST',
            body: `session=${session}&stream=${encodeURIComponent(streamNumber)}`,
        });
        return response;
    }
    catch (error) { console.error(error); }
}

async function fetchOverviewData(session) { // get call from updateTiles.
    try {
        const response = await fetch('/api/overview.sctx', { method: 'POST', body: `session=${session}` });
        return await response.json();
    }
    catch (error) { console.error('Fetching has failed.', error); }
}

function createTile(stream, streamNumber, session) { // get call from updateTiles
    const tile = document.createElement('div');
    tile.classList.add('tile');

    const title = document.createElement('h3');
    title.textContent = `Stream ${streamNumber}`;
    title.classList.add('tile-title');
    tile.appendChild(title);

    const img = new Image();
    img.src = `data:image/jpeg;base64,${stream.previewData}`;
    img.classList.add('tile-image');
    tile.appendChild(img);

    const container = document.querySelector('.container');
    const h1 = document.querySelector('h1');

    tile.addEventListener('click', () => {
        document.documentElement.webkitRequestFullscreen();
        selectStream(session, streamNumber);
        container.style.display = 'none';
        h1.style.display = 'none';
        clearInterval(OverviewInterval);
        initStream(session);

    });
    return tile;
}

async function updateTiles(session) {
    const overviewResponse = await fetchOverviewData(session);

    const container = document.querySelector('.container');
    container.innerHTML = '';

    for (let i = 0; i < overviewResponse.streams.length; i++)
        container.appendChild(createTile(overviewResponse.streams[i], i + 1, session));
}

// Main
let OverviewInterval;

async function fetchInitData() {
    try {
        const response = await fetch('/api/init.sctx');
        return await response.json();
    }
    catch (error) { console.error('Fetching has failed.', error); }
}

async function init() {
    const initResponse = await fetchInitData();
    updateTiles(initResponse.session);
    OverviewInterval = setInterval(() => updateTiles(initResponse.session), 5000);
}

init();