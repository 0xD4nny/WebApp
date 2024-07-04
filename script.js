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

    overview.createOverviewTile(initResponse.system);

    const tileContainer = document.querySelector('.tileContainer');
    overview.updateTiles(tileContainer);
    overviewInterval = setInterval(() => overview.updateTiles(tileContainer), 5000);
}


init();