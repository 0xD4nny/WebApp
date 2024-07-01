class Stream {
    constructor(OverviewIntervall) {
        this.OverviewIntervall = OverviewIntervall;
    }

    async fetchStream(session) {
        try {
            const response = await fetch('/api/event.sctx', {
                method: 'POST',
                body: `session=${session}`
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
    })};

    async eventHandler(response) {
        const canvas = document.getElementById("stream");
        const ctx = canvas.getContext("2d");

        for(let i = 0; i < response.commands.length; i++){
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
                    const overview = document.getElementById("msgBox");
                    if (response.commands[i].command == true)
                        overview.classList.add("show");
                    else
                        overview.classList.remove("show");
                    break;
                case 'overlayImage':
                    break;
                case 'overlayPosition':
                    break;
                case 'terminated':
                    const msgBox = document.getElementById("msgBox");
                    msgBox.classList.add("show");
                    setTimeout(function () { msgBox.classList.remove("show"); }, 1500);
                    return false;
            }
        };
        return true;
    }

    async initStream(session) {
        let clicked = false;
        const canvas = document.getElementById("stream");
        canvas.style.display = 'initial';

        document.addEventListener('click', () => {
            event.stopPropagation();
            const h1 = document.querySelector('h1');
            h1.style.display = 'inherit';
            const container = document.querySelector('.container');
            container.style.display = 'grid';

            canvas.style.display = 'none';

            clicked = true;
            document.exitFullscreen();
            setInterval(this.OverviewIntervall);
        }) // this click event takes us back to the overview.

        // the eventHandler returns false if we got a terminated command.
        while (await this.eventHandler(await this.fetchStream(session)) && !clicked);

    }

}