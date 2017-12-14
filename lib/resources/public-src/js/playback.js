/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

Promise.all([
    import('./app/EventFactory'),
    import('./app/EventBuffer'),
    import('./app/EventBufferPlayback')
]).then(all => {

    const EventFactory = all[0].EventFactory;
    const EventBuffer = all[1].EventBuffer;
    const EventBufferPlayback = all[2].EventBufferPlayback;

    const script = document.getElementById('conga-client-profiler-playback');
    const session = JSON.parse(script.getAttribute('data-recording-session'));
    const sessionId = encodeURIComponent(session.id);

    const buffer = new EventBuffer();
    const playback = new EventBufferPlayback(buffer);

    const fetchRecording = index => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('readystatechange', evt => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    let payload;
                    try {
                        payload = JSON.parse(xhr.responseText);
                    } catch (err) {
                        reject(err);
                        return;
                    }
                    if (xhr.status === 200) {
                        let parsed = session.url.parsed;
                        let rewriteUrl = parsed.protocol + '//' + parsed.host;
                        if (parsed.path.substr(parsed.path.lastIndexOf('/')).indexOf('.') !== -1) {
                            rewriteUrl += parsed.path.substr(0, parsed.path.lastIndexOf('/'));
                        } else {
                            rewriteUrl += parsed.path;
                        }
                        let recording = EventFactory.bufferFromSerialized(
                            payload.payload.eventBuffer,
                            rewriteUrl
                        );
                        recording.buffer.forEach(payload => buffer.add(payload));
                        resolve(payload);
                        return;
                    }
                    reject();
                }
            });
            xhr.open('GET',
                '/_conga/client/profiler/events/playback/api/' + sessionId + '/' + index);
            xhr.send();
        });
    };

    const catchRun = (err, index) => {
        let delay = 5000;
        if (!err) {
            delay = 10000;
        }
        setTimeout(run, delay, index);
    };

    const run = (index = 0) => {
        if (index === 0) {
            console.log('>>>>>>>>>>>>> STARTING THE RUN');
        }
        if (!playback.isPlaying() && index !== 0) {
            playback.playback(err => {
                if (err) {
                    console.error(err.stack || err);
                }
                // start over (but don't fetch again)
                setTimeout(run, 3500, index);
            });
        }
        if (false && playback.isSafeBufferLength()) {
            // we have enough buffer, wait for a bit longer to fetch more
            return catchRun(null, index);
        }
        // fetch another recording right away and then recursion
        fetchRecording(index).then(() => run(index + 1)).catch(err => catchRun(err, index));
    };

    run();
});
