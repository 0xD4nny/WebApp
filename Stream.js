class Stream {
    #overlayPosX = 32;
    #overlayPosY = 32;

    #streamCanvas = null;
    #streamCanavsCtx = null;

    #overlayCanvas = null;
    #overlayCtx = null;

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
        for (let i = 0; i < response.commands.length; i++) {
            //console.log(`event: ${response.commands[i].command}`);
            switch (response.commands[i].command) {
                case 'geometry':
                    this.#streamCanvas.width = response.commands[i].width;
                    this.#streamCanvas.height = response.commands[i].height;
                    this.#overlayCanvas.width = response.commands[i].width;
                    this.#overlayCanvas.height = response.commands[i].height;
                    break;

                case 'image':
                    const image = await this.downloadImage(response.commands[i]);
                    await this.#streamCanavsCtx.drawImage(image, response.commands[i].x, response.commands[i].y, response.commands[i].width, response.commands[i].height);
                    break;

                case 'overlayPosition':
                    this.#overlayPosX = response.commands[i].x;
                    this.#overlayPosY = response.commands[i].y
                    break;

                case 'overlayImage':
                    const overlayImage = await this.downloadImage(response.commands[i]);
                    await this.#overlayCtx.clearRect(0, 0, this.#overlayCanvas.width, this.#overlayCanvas.height);
                    await this.#overlayCtx.drawImage(overlayImage, this.#overlayPosX, this.#overlayPosY, 68, 68);
                    break;

                case 'overlay':
                    if (response.commands[i].visible === true)
                        this.#overlayCanvas.style.visibility = 'visible';
                    else
                        this.#overlayCanvas.style.visibility = 'hidden';
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
        this.#streamCanvas = document.getElementById("stream");
        this.#streamCanavsCtx = this.#streamCanvas.getContext('2d');
        this.#streamCanvas.style.display = 'initial';

        this.#overlayCanvas = document.getElementById("overlay")
        this.#overlayCtx = this.#overlayCanvas.getContext('2d');
        this.#overlayCanvas.style.display = 'initial';

        // this click event takes us back to the overview.
        document.addEventListener('click', () => {
            event.stopPropagation();
            const container = document.querySelector('.tileContainer');
            container.style.display = 'grid';
            container.style.visibility = 'visible'; 

            const overviewTile = document.getElementById('overviewTile');
            overviewTile.style.visibility = 'visible';

            this.#streamCanvas.style.display = 'none';
            this.#streamCanavsCtx.clearRect(0, 0, this.#streamCanvas.width, this.#streamCanvas.height);

            const msgBox = document.getElementById("msgBox");
            msgBox.style.visibility = 'hidden';

            document.exitFullscreen();
            clicked = true;

            setInterval(overviewIntervall);
        })

        // the eventHandler returns false if we got a terminated command.
        while (await this.eventHandler(await this.fetchStream(session)) && !clicked);

    }
}