class Overview {
    constructor(overviewInterval, session, tileContainer) {
        this.overviewInterval = overviewInterval;
        this.session = session;
        this.tileContainer = tileContainer;
    };

    async selectStream(streamNumber) { // gets call from tile.ClickEvent.
        try {
            const response = await fetch('/api/select.sctx', {
                method: 'POST',
                body: `session=${this.session}&stream=${encodeURIComponent(streamNumber)}`,
            });
            return response;
        }
        catch (error) { console.error(error); }
    }

    async fetchOverviewData() { // get call from updateTiles.
        try {
            const response = await fetch('/api/overview.sctx', { method: 'POST', body: `session=${this.session}` });
            return await response.json();
        }
        catch (error) { console.error('Fetching has failed.', error); }
    }

    createStreamTile(stream, streamNumber) { // get call from updateTiles
        const tile = document.createElement('div');
        tile.classList.add('stream-tile');

        const title = document.createElement('h3');
        title.textContent = `Monitor ${streamNumber}`;
        tile.appendChild(title);

        const img = new Image();
        img.src = `data:image/jpeg;base64,${stream.previewData}`;
        img.classList.add('stream-tile-image');
        tile.appendChild(img);

        const imgSize = document.createElement('h5');
        imgSize.textContent = `${Math.round(stream.previewSize / 1024 * 10) / 10} KB`;
        tile.appendChild(imgSize);

        tile.addEventListener('click', () => {
            event.stopPropagation();
            document.documentElement.webkitRequestFullscreen();
            this.selectStream(streamNumber - 1);

            const sysOverview = document.querySelector('.table-container');
            sysOverview.style.display = 'none';
            this.tileContainer.style.visibility = 'hidden';
            clearInterval(this.overviewInterval);

            let myStream = new Stream();
            myStream.initStream(this.session, this.overviewInterval);
        });
        return tile;
    }

    //Todo: Sammle die Elemente ohne Verschachtelung und füge sie am ende als misc hinzu.
    createListTree(systemData, tableContainer, misc) {
        const table = document.createElement('table');
        tableContainer.appendChild(table);
        for (const key in systemData) {
            const tr = document.createElement('tr');
            table.appendChild(tr);

            if(typeof systemData[key] === 'object' && systemData[key] !== null){
                const th = document.createElement('th');
                const th2 = document.createElement('th');
                th.textContent = `${key}`;
                tr.appendChild(th);
                tr.appendChild(th2);
                this.createListTree(systemData[key], tableContainer);
            }
            else{
                const th = document.createElement('th');
                th.textContent = `${key}: `
                tr.appendChild(th);

                const td = document.createElement('td');
                td.textContent = `${systemData[key]}`;
                tr.appendChild(td);
            }
        }
    }

    createOverviewTile(systemData) {
        const overviewTile = document.createElement('div');
        overviewTile.classList.add('overview-tile');

        const headline = document.createElement('h4');
        headline.textContent = `System Overview`;
        overviewTile.appendChild(headline);
        
        const tableContainer = document.createElement('div');
        tableContainer.classList.add('table-container');
        const misc = [];
        this.createListTree(systemData, tableContainer, misc);
        overviewTile.appendChild(tableContainer);
        tableContainer.style.display = 'none';

        overviewTile.addEventListener('click', () => {
            if(tableContainer.style.display === 'none'){
                tableContainer.style.display = 'grid';
            }
            else
            tableContainer.style.display = 'none';
        });
        this.tileContainer.appendChild(overviewTile);
    }

    async updateStreamTiles(streamTiles) {
        const overviewResponse = await this.fetchOverviewData();
        
        streamTiles.innerHTML = '';

        for (let i = 0; i < overviewResponse.streams.length; i++)
            streamTiles.appendChild(this.createStreamTile(overviewResponse.streams[i], i + 1));
        
    }
}