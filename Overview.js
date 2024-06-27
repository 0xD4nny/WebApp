class Overview{
    constructor(OverviewInterval, session, myStream){
        this.OverviewInterval = OverviewInterval;
        this.session = session;
        this.myStream = myStream;
    };

    async selectStream(streamNumber) { // gets call from createTile
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

    createTile(stream, streamNumber, h1, container) { // get call from updateTiles
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

        const description = document.createElement('h5');
        description.textContent = `Size ${100}`;
        description.classList.add('description');
        tile.appendChild(description);

        tile.addEventListener('click', () => { 
            event.stopPropagation();
            document.documentElement.webkitRequestFullscreen();
            this.selectStream(streamNumber - 1);
            
            container.style.display = 'none';
            h1.style.display = 'none';
            clearInterval(this.OverviewInterval);
            
            this.myStream = new Stream(this.OverviewInterval);
            this.myStream.initStream(this.session);
            
        });
        return tile;
    }
    
    async updateTiles() { 
        const overviewResponse = await this.fetchOverviewData();
        
        const container = document.querySelector('.container');
        const h1 = document.querySelector('h1');
        container.innerHTML = '';
        
        for (let i = 0; i < overviewResponse.streams.length; i++)
            container.appendChild(this.createTile(overviewResponse.streams[i], i + 1, h1, container));   
    }
}