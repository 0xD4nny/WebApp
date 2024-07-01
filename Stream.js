class Stream {
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
        let overlayPosX, overlayPosY;

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

                case 'overlay':
                    const overlay = document.getElementById("overlay");
                    if (response.commands[i].visible == true)
                        overlay.classList.add("show");
                    else
                        overlay.classList.remove("show");
                    break;

                case 'overlayImage':
                    const overlayImg = await this.downloadImage(response.commands[i]);
                    overlayCtx.drawImage(overlayImg, overlayPosX, overlayPosY)
                    break;

                case 'overlayPosition':
                    overlayPosX = response.commands[i].x;
                    overlayPosY = response.commands[i].y
                    break;

                case 'terminated':
                    const msgBox = document.getElementById("msgBox");
                    msgBox.classList.add("show");
                    setTimeout(function () { msgBox.classList.remove("show"); }, 1500);
                    return false;

        }};
        return true;
    }

    async initStream(session, overviewIntervall) {
        let clicked = false;
        const canvas = document.getElementById("stream");
        canvas.style.display = 'initial';

        document.addEventListener('click', () => {
            event.stopPropagation();
            const h1 = document.querySelector('h1');
            const container = document.querySelector('.container');

            h1.style.display = 'inherit';
            container.style.display = 'grid';
            canvas.style.display = 'none';
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            clicked = true;
            document.exitFullscreen();
            setInterval(overviewIntervall);
        }) // this click event takes us back to the overview.

        // the eventHandler returns false if we got a terminated command.
        while (await this.eventHandler(await this.fetchStream(session)) && !clicked);
    }
}