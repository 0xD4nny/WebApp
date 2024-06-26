class Stream {
    constructor(OverviewIntervall) {
        this.OverviewIntervall = OverviewIntervall;
    }

    async downloadImage(command) {
        try {
            const response = await fetch(command.uri);
            const blob = await response.blob();
            const image = new Image();
            image.src = URL.createObjectURL(blob);

            const offscreenCanvas = document.createElement('canvas');
            const ctx = offscreenCanvas.getContext('2d');

            const mainCanvas = document.getElementById("stream");
            const mainCtx = mainCanvas.getContext("2d");

            mainCtx.drawImage(offscreenCanvas, 0, 0);
        }
        catch (error) { console.error('Error fetching or drawing the image fragments:', error); }
    }

    async eventHandler(response) {
        let isNotTerminated = true;

        response.commands.forEach(command => {
            switch (command.command) {
                case 'geometry':
                    console.log(`geometry event: ${command.command}`); // returns width and height.
                    break;
                case 'image':
                    this.downloadImage(command);
                    console.log(`image event: ${command.command}`); // returns img fragments.
                    break;
                case 'overlay':
                    console.log(`overlay event: ${command.command}`); // returns the visibility of the overlay.
                    break;
                case 'overlayImage':
                    console.log(`overlayImage event: ${command.command}`); // returns an overlay img.
                    break;
                case 'overlayPosition':
                    console.log(`overlayPosition event: ${command.command}`); // returns the x and y pos for the Overlay.
                    break;
                case 'terminated':
                    isNotTerminated = false;
                    const msgBox = document.getElementById("msgBox");
                    msgBox.classList.add("show");
                    setTimeout(function () { msgBox.classList.remove("show"); }, 3000);
                    console.log(`terminated event: ${command.command}`); // returns weathever the stream is terminated.
                    break;
            }
        });
        return isNotTerminated;
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

    async initStream(session) {
        let clicked = false;

        document.addEventListener('DOMContentLoaded', function () {
            var container = document.getElementById('container');
            var originalDisplay = getComputedStyle(container).display;
            console.log(originalDisplay);
        });
        //Todo: Fix the losing css problem after fullscreen.
        document.addEventListener('click', () => {
            if (document.fullscreenElement) {
                const h1 = document.querySelector('h1');
                const container = document.querySelector('.container');

                container.style.display = 'inherit';
                h1.style.display = 'inherit';
                clicked = true;

                setInterval(this.OverviewIntervall);
                document.exitFullscreen();
            }
        }) // this click event takes us back to the overview.

        // the eventHandler returns false if we got a terminated command.
        while (await this.eventHandler(await this.fetchStream(session)) && !clicked);

    }

}