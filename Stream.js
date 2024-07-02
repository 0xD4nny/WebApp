class Stream {
    constructor(){
        this.OverlayX = 32;
        this.OverlayY = 32;
    }
    async fetchStream(session) {
        try {
            const response = await fetch('/api/event.sctx', {
                method: 'POST', body: `session=${session}`
            });
            return await response.json();
        }
        catch (error) { console.error(error); }
    }

    async downloadImage(command) {
        return await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = command.uri;
        })
    };

    async eventHandler(response) {
        const canvas = document.getElementById("stream");
        const ctx = canvas.getContext("2d");
        const overlayCanvas = document.getElementById("overlay");
        const overlayCtx = overlayCanvas.getContext("2d");
        overlayCanvas.width = 68;
        overlayCanvas.height = 68;
        overlayCanvas.style.zIndex = top;

        for (let i = 0; i < response.commands.length; i++) {
            console.log(`event: ${response.commands[i].command}`);
            switch (response.commands[i].command) {
                case 'geometry':
                    canvas.width = response.commands[i].width;
                    canvas.height = response.commands[i].height;
                    break;

                case 'image':
                    const img = await this.downloadImage(response.commands[i]);
                    await ctx.drawImage(img, response.commands[i].x, response.commands[i].y, response.commands[i].width, response.commands[i].height);
                    break;

                case 'overlayPosition':
                    this.OverlayX = response.commands[i].x;
                    this.OverlayY = response.commands[i].y
                    break;

                case 'overlayImage':
                    const overlayImg = await this.downloadImage(response.commands[i]);
                    await overlayCtx.drawImage(overlayImg, this.OverlayX, this.OverlayY, 68, 68)
                    break;

                case 'overlay':
                    const overlay = document.getElementById("overlay");
                    if (response.commands[i].visible === true)
                        overlay.style.visibility = 'visible';
                    else
                    overlay.style.visibility = 'hidden';
                    break;

                case 'terminated':
                    const msgBox = document.getElementById("msgBox");
                    msgBox.style.visibility = 'visible';
                    return false;
            }
        };
        return true;
    }
    
    async initStream(session, overviewIntervall) {
        let clicked = false;
        const canvas = document.getElementById("stream");
        canvas.style.display = 'initial';
        
        document.addEventListener('click', () => {
            event.stopPropagation();
            const container = document.querySelector('.tileContainer');
            container.style.display = 'grid';
            container.style.visibility = 'visible';
            
            const overviewTile = document.getElementById('overviewTile');
            overviewTile.style.visibility = 'visible';
            
            
            canvas.style.display = 'none';
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const msgBox = document.getElementById("msgBox");
            msgBox.style.visibility = 'hidden';

            document.exitFullscreen();
            clicked = true;

            setInterval(overviewIntervall);
        }) // this click event takes us back to the overview.

        // the eventHandler returns false if we got a terminated command.
        while (await this.eventHandler(await this.fetchStream(session)) && !clicked);
    }
}