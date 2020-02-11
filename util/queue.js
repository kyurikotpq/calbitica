// Keeps track of which calbits are being locked up
class CalbitQueueUtil {
    constructor() {
        if (!CalbitQueueUtil.instance) {
            this._data = []; // stores the queue

            // ensures that the queue processing is triggered only once
            this.alreadyProcessing = false;
            CalbitQueueUtil.instance = this;
        }
        return CalbitQueueUtil.instance;
    }

    /**
     * Add a new Promise to the queue for processing
     * @param {Promise} item 
     */
    push(item) {
        this._data.push(item);
    }

    /**
     * Continues the processing
     */
    processNext() {
        if (this._data.length != 0 && this.alreadyProcessing) {
            this._data.shift()
                .catch((err) => console.log("EROR IN QUEUE", err))
                .finally(() => this.processNext());
        } else this.alreadyProcessing = false;
    }
    
    /**
     * Kickstarts the processing
     */
    process() {
        if (this._data.length != 0 && !this.alreadyProcessing) {
            this.alreadyProcessing = true;
            this._data.shift()
                .catch((err) => console.log("EROR IN QUEUE", err))
                .finally(() => {
                    console.log("processed, processing next...");
                    this.processNext()
                });
        }
    }

    isProcessing() {
        return this.alreadyProcessing;
    }
}

const instance = new CalbitQueueUtil();

module.exports = instance;