class Overview{
    constructor(overviewInterval, session){
        this.overviewInterval = overviewInterval;
        this.session = session;
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

    createStreamTile(stream, streamNumber, tileContainer) { // get call from updateTiles
        const tile = document.createElement('div');
        tile.classList.add('tile');
        
        const title = document.createElement('h3');
        title.textContent = `Monitor ${streamNumber}`;
        tile.appendChild(title);
        
        const img = new Image();
        img.src = `data:image/jpeg;base64,${stream.previewData}`;
        img.classList.add('tile-image');
        tile.appendChild(img);

        const imgSize = document.createElement('h5');
        imgSize.textContent = `${Math.round(stream.previewSize/1024 * 10 ) / 10} KB`;
        tile.appendChild(imgSize);

        tile.addEventListener('click', () => { 
            event.stopPropagation();

            document.documentElement.webkitRequestFullscreen();
            this.selectStream(streamNumber - 1);
            
            tileContainer.style.display = 'none';
            clearInterval(this.overviewInterval);
            
            let myStream = new Stream();
            myStream.initStream(this.session, this.overviewInterval);
        });
        return tile;
    }

    createSystemOverviewTile(overviewResponse, systemOverview){
        const headline = document.createElement('h3');
        headline.textContent = `SystemOverview.`
        systemOverview.appendChild(headline);

        const description = document.createElement('h5');
        description.textContent = `System Informations:\nBios version: ${overviewResponse.system.bios.version}.\n
        Bios manufacturer: ${overviewResponse.system.bios.manufacturer}.\n\nBus: ${overviewResponse.system.bus}.\n
        DisplayAdapter: ${overviewResponse.system.displayAdapter.adapter}.\nRam: ${overviewResponse.system.displayAdapter.ram}.\n`;
        systemOverview.appendChild(description);
    }

    async updateTiles() { 
        const overviewResponse = await this.fetchOverviewData();
        
        const systemOverview = document.getElementById('systemOverviewTile');
        systemOverview.innerHTML = '';
        
        const tileContainer = document.querySelector('.tileContainer');
        tileContainer.innerHTML = '';

        this.createSystemOverviewTile(overviewResponse, systemOverview);
        for (let i = 0; i < overviewResponse.streams.length; i++)
            tileContainer.appendChild(this.createStreamTile(overviewResponse.streams[i], i + 1, tileContainer));
    }
}