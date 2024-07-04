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
        imgSize.textContent = `${Math.round(stream.previewSize / 1024 * 10) / 10} KB`;
        tile.appendChild(imgSize);

        tile.addEventListener('click', () => {
            event.stopPropagation();
            document.documentElement.webkitRequestFullscreen();
            this.selectStream(streamNumber - 1);

            const overviewTile = document.getElementById('overviewTile');
            overviewTile.style.visibility = 'hidden';
            tileContainer.style.visibility = 'hidden';
            clearInterval(this.overviewInterval);

            let myStream = new Stream();
            myStream.initStream(this.session, this.overviewInterval);
        });
        return tile;
    }

    createListTree(systemData, ul) {
        for (const key in systemData) {
            const li = document.createElement('li');
            if(typeof systemData[key] === 'object' && systemData[key] !== null){
                const subUl = document.createElement('ul');
                subUl.classList.add('sub-ul');
                li.textContent = `${key}`;
                subUl.appendChild(li);
                ul.appendChild(subUl);
                this.createListTree(systemData[key], ul);
            }
            else{
                li.textContent = `${key}: ${systemData[key]}`;
                ul.appendChild(li);
            }
        }
    }

    createOverviewTile(systemData) {
        const overviewTile = document.getElementById('overviewTile');

        const headline = document.createElement('h4');
        headline.textContent = `System Overview`;
        overviewTile.appendChild(headline);
        
        const ul = document.createElement('ul');
        overviewTile.appendChild(ul);
        ul.classList.add('main-ul');

        this.createListTree(systemData, ul);
        ul.style.display = 'none';
        
        overviewTile.addEventListener('click', () => {
            if(ul.style.display === 'none'){
                ul.style.display = 'grid';
            }
            else
                ul.style.display = 'none';
        });
    }

    async updateTiles(tileContainer) {
        const overviewResponse = await this.fetchOverviewData();

        tileContainer.innerHTML = '';

        for (let i = 0; i < overviewResponse.streams.length; i++)
            tileContainer.appendChild(this.createStreamTile(overviewResponse.streams[i], i + 1, tileContainer));
        
    }
}