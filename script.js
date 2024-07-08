let overviewInterval;

async function fetchInitData() {
    try {
        const response = await fetch('/api/init.sctx');
        return await response.json();
    }
    catch (error) { console.error('Fetching has failed.', error); }
}

async function init() {
    const initResponse = await fetchInitData();
    
    const tileContainer = document.querySelector('.tileContainer');

    const overview = new Overview(overviewInterval, initResponse.session, tileContainer);    
    overview.createOverviewTile(initResponse.system);
    
    const streamTiles = document.createElement('div');
    streamTiles.classList.add('streamTiles');
    tileContainer.appendChild(streamTiles);
    
    overview.updateStreamTiles(streamTiles);
    overviewInterval = setInterval(() => overview.updateStreamTiles(streamTiles), 5000);
}

init();