class Overview {
    constructor(overviewInterval, session) {
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

    createStreamTile(stream, streamNumber, tileContainer, overviewTile) { // get call from updateTiles
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
        imgSize.textContent = `${Math.round(stream.previewSize / 1024 * 10) / 10} KB`;
        tile.appendChild(imgSize);

        tile.addEventListener('click', () => {
            event.stopPropagation();

            document.documentElement.webkitRequestFullscreen();
            this.selectStream(streamNumber - 1);
            overviewTile.style.visibility = 'hidden';
            tileContainer.style.visibility = 'hidden';
            clearInterval(this.overviewInterval);

            let myStream = new Stream();
            myStream.initStream(this.session, this.overviewInterval);
        });
        return tile;
    }

    createListTree(overviewResponse, overviewTile) {
        const ul = document.createElement('ul');
        ul.id = 'tree';
        overviewTile.appendChild(ul);

        for (const key in overviewResponse.system) {
            if (overviewResponse.system.hasOwnProperty(key)) {
                const value = overviewResponse.system[key];
                const li = document.createElement('li');
                ul.appendChild(li);

                if (typeof value === 'object' && value !== null) {
                    li.textContent = key;
                    this.createListTree(value, li);
                }
                else
                    li.textContent = `${key}: ${value}`;
            }
        }
    }

    createOverviewTile(overviewResponse, overviewTile) {
        const headline = document.createElement('h4');
        headline.textContent = `System Overview`;
        overviewTile.appendChild(headline);
    
        this.createListTree(overviewResponse, overviewTile);
        const tree = document.getElementById('tree');
        
        overviewTile.addEventListener('click', () => {
            if(tree.style.visibility === 'hidden')
                tree.style.visibility = 'visible';
            else
                tree.style.visibility = 'hidden';
        });
    }

    async updateTiles() {
        const overviewResponse = await this.fetchOverviewData();
        
        const overviewTile = document.getElementById('overviewTile');
        overviewTile.innerHTML = '';
        this.createOverviewTile(overviewResponse, overviewTile);
        
        const tileContainer = document.querySelector('.tileContainer');
        tileContainer.innerHTML = '';
        for (let i = 0; i < overviewResponse.streams.length; i++)
            tileContainer.appendChild(this.createStreamTile(overviewResponse.streams[i], i + 1, tileContainer,overviewTile));
        
    }
}