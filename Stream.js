class Stream {
    #streamCanvas = null;
    #streamCanavsCtx = null;
    #overlayCanvas = null;
    #overlayCtx = null;

    #overlayPosX = 32;
    #overlayPosY = 32;

    #clicked = false;

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
                    this.#overlayCtx.clearRect(0, 0, this.#overlayCanvas.width, this.#overlayCanvas.height);
                    const overlayImage = await this.downloadImage(response.commands[i]);
                    await this.#overlayCtx.drawImage(overlayImage, this.#overlayPosX, this.#overlayPosY, 68, 68);
                    break;

                case 'overlay':
                    if (response.commands[i].visible === true)
                        this.#overlayCanvas.style.visibility = 'visible';
                    else
                        this.#overlayCanvas.style.visibility = 'hidden';
                    break;

                case 'terminated':
                    alert("Terminated.");
                    this.backToOverview();
                    return false;
            }
        };
        return true;
    }

    backToOverview() {
        document.exitFullscreen();
        this.#overlayCanvas.style.display = 'none';
        this.#streamCanvas.style.display = 'none';
        this.#streamCanavsCtx.clearRect(0, 0, this.#streamCanvas.width, this.#streamCanvas.height);

        const container = document.querySelector('.main-container');
        container.style.display = 'grid';
        container.style.visibility = 'visible';
        this.#clicked = true;
    }

    async initStream(session) {
        this.#streamCanvas = document.getElementById("stream");
        this.#streamCanavsCtx = this.#streamCanvas.getContext('2d');
        this.#streamCanvas.style.display = 'initial';

        this.#overlayCanvas = document.getElementById("overlay");
        this.#overlayCtx = this.#overlayCanvas.getContext('2d');
        this.#overlayCanvas.style.display = 'initial';

        this.#overlayCanvas.addEventListener('click', () => { this.backToOverview(); });

        // the eventHandler returns false if we got a terminated command.
        while (await this.eventHandler(await this.fetchStream(session)) && !this.#clicked);

    }
}