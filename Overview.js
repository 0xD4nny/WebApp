const tableContainer = document.createElement('div');
const wrapperObjects = [];
const miscObject = {};

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

    async fetchOverviewData() { // gets call from updateTiles.
        try {
            const response = await fetch('/api/overview.sctx', { method: 'POST', body: `session=${this.session}` });
            return await response.json();
        }
        catch (error) { console.error('Fetching has failed.', error); }
    }

    createStreamTile(stream, streamNumber) { // gets call from updateTiles
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

    
    collectElements(data, miscTable = 'misc') {
        const entries = [];
        for (const key in data)
            if (typeof data[key] !== 'object') {
                entries.push(`${miscTable} : ${key} : ${data[key]}`);
                delete data[key];
            }
    
        for (const entry of entries) {
            const parts = entry.split(" : ").map(part => part.trim());
            const[group, key, value] = parts;
            if(!miscObject[group])
                miscObject[group] = {};
    
            miscObject[group][key] = isNaN(value) ? value : Number(value);
        }
    }
    
    collectWrappers(data) {
        let index = 0;
        for (const key in data)
            if (typeof data[key][Object.keys(data[key])[0]] === 'object')
            if (data[key][Object.keys(data[key])[0]] !== null) {
                wrapperObjects[index++] = data[key];
                delete data[key];
            }
    }
    
    objToTable(data, table, isLast = false) {
        for (const key in data) {
            if (typeof data[key] === 'object' && data[key] !== null) {
                const tr = document.createElement('tr');
                const th = document.createElement('th');
                const th2 = document.createElement('th');
                table.appendChild(tr);
                tr.appendChild(th);
                tr.appendChild(th2);
                th.textContent = key;
                this.objToTable(data[key], table, true);
                if(isLast === false)
                {
                    table = document.createElement('table');
                    tableContainer.appendChild(table);
                }
            }
            else {
                const tr = document.createElement('tr');
                const th = document.createElement('th');
                const td = document.createElement('td');
                table.appendChild(tr);
                tr.appendChild(th);
                tr.appendChild(td);
                th.textContent = key;
                td.textContent = data[key];
            }
        }
    }
      

    createOverviewTile(data) {
        const overviewTile = document.createElement('div');
        overviewTile.classList.add('overview-tile');

        const headline = document.createElement('h4');
        headline.textContent = `System Overview`;
        overviewTile.appendChild(headline); 

        tableContainer.classList.add('table-container');
        overviewTile.appendChild(tableContainer);
        
        const table = document.createElement('table');
        tableContainer.appendChild(table);
        this.collectElements(data, 'sysConfig');
        this.collectWrappers(data);
        
        this.objToTable(data, table);
        for(let i = 0; i < wrapperObjects.length; i++)
            this.objToTable(wrapperObjects[i],tableContainer.children[tableContainer.children.length - 1]);
        this.objToTable(miscObject, tableContainer.children[tableContainer.children.length - 1]);

        tableContainer.style.display = 'none';
        
        this.tileContainer.appendChild(overviewTile);
        
        overviewTile.addEventListener('click', () => {
            if(tableContainer.style.display === 'none'){
                tableContainer.style.display = 'grid';
            }
            else
            tableContainer.style.display = 'none';
        });
    }

    async updateStreamTiles(streamTiles) {
        const overviewResponse = await this.fetchOverviewData();
        
        streamTiles.innerHTML = '';

        for (let i = 0; i < overviewResponse.streams.length; i++)
            streamTiles.appendChild(this.createStreamTile(overviewResponse.streams[i], i + 1));
        
    }
}