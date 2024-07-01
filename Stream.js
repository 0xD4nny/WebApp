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
        const response = await fetch(command.uri);
        const blob = await response.blob();
        const image = new Image();
        const imageLoadPromise = new Promise((resolve, reject) => {
            image.onload = () => resolve(image);
            image.onerror = reject;
        });
        image.src = URL.createObjectURL(blob);
        return imageLoadPromise;
    }

    async printImage(command, ctx) {
        try {
            const img = await this.downloadImage(command, ctx);
            await ctx.drawImage(img, command.x, command.y);
        }
        catch (error) { console.error('Failed to load or draw the image:', error); }

    }

    async eventHandler(response) {
        let isNotTerminated = true;

        const canvas = document.getElementById("stream");
        const ctx = canvas.getContext("2d");


        response.commands.forEach(command => {
            console.log(`event: ${command.command}`);
            switch (command.command) {
                case 'geometry':
                    canvas.width = command.width;
                    canvas.height = command.height;
                    break;
                case 'image':
                    this.printImage(command, ctx);
                    break;
                case 'overlay':
                    const overview = document.getElementById("msgBox");
                    if (command == true)
                        overview.classList.add("show");
                    else
                        overview.classList.remove("show");
                    break;
                case 'overlayImage':
                    break;
                case 'overlayPosition':
                    break;
                case 'terminated':
                    isNotTerminated = false;
                    const msgBox = document.getElementById("msgBox");
                    msgBox.classList.add("show");
                    setTimeout(function () { msgBox.classList.remove("show"); }, 1500);
                    break;
            }
        });
        return isNotTerminated;
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