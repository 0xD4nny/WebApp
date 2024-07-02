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
    
    const overview = new Overview(overviewInterval, initResponse.session);
    
    const overviewTile = document.getElementById('overviewTile');
    overview.createOverviewTile(initResponse, overviewTile);

    overview.updateTiles();
    overviewInterval = setInterval(() => overview.updateTiles(), 5005);
}


init();