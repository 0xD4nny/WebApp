let OverviewInterval;
let overview;
let myStream;

async function fetchInitData() {
    try {
        const response = await fetch('/api/init.sctx');
        return await response.json();
    }
    catch (error) { console.error('Fetching has failed.', error); }
}

async function init() {
    const initResponse = await fetchInitData(); // this fetch is just for the seassonKey.
    overview = new Overview(OverviewInterval, initResponse.session, myStream);
    overview.updateTiles(initResponse.session);
    OverviewInterval = setInterval(() => overview.updateTiles(initResponse.session), 5000);
}

init();