let overviewInterval;
let overview;

async function fetchInitData() {
    try {
        const response = await fetch('/api/init.sctx');
        return await response.json();
    }
    catch (error) { console.error('Fetching has failed.', error); }
}

async function init() {
    const initResponse = await fetchInitData();
    overview = new Overview(overviewInterval, initResponse.session);
    overview.updateTiles();
    overviewInterval = setInterval(() => overview.updateTiles(), 5005);
}

init();