/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Aggregate the events from all of the recording buffers
 * @param {Array} recordings
 * @returns {{events: Array, duration: number, firstTime: number, lastTime: number}}
 */
const eventAggregator = recordings => {
    let errors = [];

    let events = [];
    let lastEvent = null;
    let firstEvent = null;
    let totalDuration = 0;

    let eventTypes = {};
    let nodeNames = {};

    let lastPage;
    let pages = [];
    let pageIdx = 0;
    let pageEvents = [];
    let lastBufferPageIdx = 0;

    for (const recording of recordings) {
        // TODO: page-overlapping-events need to loop continually until the duration is done (might span multiple pages)
        pages = pages.concat(recording.pages.map(page => {
            if (lastPage) {
                lastPage.endTime = page.startTime;
                lastPage.duration = lastPage.endTime - lastPage.startTime;
            }
            page.time = new Date(page.startTime);
            page.endTime = 0;
            page.duration = 0;
            page.idx = pageIdx++;
            lastPage = page;
            return page;
        }));
        for (const [bufferCollectionIdx, bufferCollection] of recording.payload.eventBuffer.entries()) {
            for (const buffer of bufferCollection.buffer) {

                // init references
                const payload = buffer.payload;
                const eventPayload = payload.eventPayload;
                const metadata = eventPayload.metadata;

                // make sure we have a timestamp
                let time = metadata.time;

                /* NOTE: If we have a previous event, update its duration.
                         We calculate the synchronous event time on the payload.
                         Any asynchronous durations are already calculated on the payload. */

                if (lastEvent) {
                    const lastEventPayload = lastEvent.payload.eventPayload;
                    lastEventPayload.duration = Math.abs(time - lastEventPayload.metadata.time);

                    totalDuration += lastEventPayload.duration;

                    buffer.memory.isUp = buffer.memory.usedJSHeapSize > lastEvent.memory.usedJSHeapSize;
                    buffer.memory.isDown = buffer.memory.usedJSHeapSize < lastEvent.memory.usedJSHeapSize;
                }

                lastEvent = buffer;
                if (!firstEvent) {
                    firstEvent = buffer;
                }

                // keep track of node names that events originated on
                const nodeName = metadata.nodeName || null;
                const nodeType = metadata.nodeType || null;
                if (nodeName && !(nodeName in nodeNames) && (nodeType === 1 || nodeType === 9)) {
                    // 1 = element, 9 = document
                    nodeNames[nodeName] = nodeName;
                }

                // keep track of event types that occurred
                const type = payload.type +
                    (eventPayload.event.type ? '.' + eventPayload.event.type : '');

                if (!(type in eventTypes)) {
                    eventTypes[type] = type;
                }

                /* NOTE: Each recording buffer has its own set of pages, so the bufferPageIdx
                         represents the current page in the current buffer where the event
                         was found or saved.  To get the true page index, we add the buffer idx
                         to our current iteration page (lastPage) idx. Since we iterate over pages
                         first, we keep track of the last buffer's last page index for these
                         calculations. */

                if (false && lastBufferPageIdx === 0) {
                    eventPayload.pageIdx = payload.bufferPageIdx ? payload.bufferPageIdx - 1 : 0;
                } else {
                    eventPayload.pageIdx = Math.min(lastPage.idx, lastBufferPageIdx + (payload.bufferPageIdx || 0));
                }

                let pushEvents = [];

                // handle overlapping asynchronous events
                if (pageEvents.length !== 0) {
                    // inject page-overlapping-events before the first event on 'page'
                    let keepPageEvents = [];
                    for (const pageEvt of pageEvents) {
                        //console.log('page evt idx', pageEvt.payload.eventPayload.pageIdx, '===', eventPayload.pageIdx);
                        if (pageEvt.payload.eventPayload.pageIdx === eventPayload.pageIdx) {
                            //console.log('INSERTING PAGE EVENT', pageEvt);
                            pageEvt.payload.eventPayload.eventIdx = events.length + pushEvents.length;
                            pushEvents.push(pageEvt);
                        } else {
                            keepPageEvents.push(pageEvt);
                        }
                    }
                    pageEvents = keepPageEvents;
                }
                if (payload.data && payload.data.duration) {
                    // find all events in this buffer that go beyond their page end times
                    const eventEndTime = metadata.time + payload.data.duration;
                    const originalEventIdx = events.length;
                    let loopIdx = eventPayload.pageIdx;
                    let isOverlapDuration = false;
                    while (pages.length > ++loopIdx) {
                        const nextPage = pages[loopIdx];
                        if (eventEndTime > nextPage.startTime) {
                            const overlapDuration = eventEndTime - nextPage.startTime;
                            const overlap = _.cloneDeep(buffer);
                            overlap.isPageOverlap = true;
                            overlap.payload.eventPayload.orginalEventIdx = originalEventIdx;
                            overlap.payload.eventPayload.pageIdx = nextPage.idx;
                            overlap.payload.eventPayload.event.timeStamp = nextPage.timeStamp;
                            overlap.payload.eventPayload.metadata.time = nextPage.startTime;
                            overlap.payload.eventPayload.duration = overlapDuration;

                            const nextEndTime = loopIdx + 1 >= pages.length
                                ? nextPage.endTime
                                : pages[loopIdx + 1].startTime;

                            overlap.isOverlapDuration = (
                                nextEndTime && (nextPage.startTime + overlapDuration) > nextEndTime
                            );
                            pageEvents.push(overlap);
                            isOverlapDuration = true;
                        }
                    }
                    buffer.isOverlapDuration = isOverlapDuration;
                    //console.log('FOUND PAGE EVENTS', pageEvents);
                }

                // keep track of error events
                if (payload.type === 'error') {
                    pages[eventPayload.pageIdx].hasErrors = true;
                    errors.push(buffer);
                }

                // track the index for this event on the event payload
                eventPayload.eventIdx = events.length;

                // add this event to the event collection
                events = events.concat(pushEvents);
                events.push(buffer);
            }
        }
        lastBufferPageIdx = lastPage.idx;
    }
    const data = {
        errors,
        pages,
        events,
        eventTypes: Object.keys(eventTypes).sort().reduce((types, type) => {
            types[type] = eventTypes[type];
            return types;
        }, {}),
        nodeNames: Object.keys(nodeNames).sort().reduce((names, type) => {
            names[type.toLowerCase()] = nodeNames[type].toLowerCase();
            return names;
        }, {}),
        duration: lastEvent.payload.eventPayload.metadata.time - firstEvent.payload.eventPayload.metadata.time,
        firstTime: firstEvent.payload.eventPayload.metadata.time,
        lastTime: lastEvent.payload.eventPayload.metadata.time
    };
    // compute the last page's duration
    if (lastPage && !lastPage.endTime) {
        lastPage.endTime = data.lastTime;
        lastPage.duration = lastPage.endTime - lastPage.startTime;
    }
    // compute the last event's duration (should be 0)
    lastEvent.payload.eventPayload.duration = 0; // can't do this cause events got injecte dand it's not accurate anymore -> data.duration - totalDuration;
    return data;
};

module.exports = {
    eventAggregator
};