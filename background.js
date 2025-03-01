import { fetchLocations } from "./api/fetchLocations.js"
import { fetchOpenSlots } from "./api/fetchOpenSlots.js"
import { createNotification } from "./lib/createNotification.js"

// Service workers are event driven

// Event listeners
chrome.runtime.onInstalled.addListener(details => {
    handleOnStop()
    fetchLocations()
})

// Exmaple data object
// let data = {
//     "event": "onStop/onStart",
//     "prefs": {
//         "locationId": 'some_place',
//         "startDate": 'yyyy-mm-dd',
//         "endDate": 'yyyy-mm-dd'
//     }
// }

let cachedPrefs = {}
let firstAptTimestamp = null

chrome.runtime.onMessage.addListener(data => {
    const { event, prefs } = data
    switch (event) {
        case 'onStop':
            handleOnStop();
            break;
        case 'onStart':
            handleOnStart(prefs);
            break;
        default:
            break;
    }
})

chrome.notifications.onClicked.addListener(() => {
    chrome.tabs.create({ url: `https://ttp.cbp.dhs.gov/schedulerui/schedule-interview/location?lang=en&vo=true&returnUrl=ttp-external&service=up` })
})

chrome.alarms.onAlarm.addListener(() => {
    openSlotsJob()
})

// helper methods
const handleOnStop = () => {
    setRunningStatus(false);
    stopAlarm();
    cachedPrefs = {}
    firstAptTimestamp = null
}

const handleOnStart = (prefs) => {
    cachedPrefs = prefs
    chrome.storage.local.set(prefs)
    setRunningStatus(true);
    createAlarm();
}

const ALARM_JOB_NAME = "DROP_ALARM"
const createAlarm = () => {
    chrome.alarms.get(ALARM_JOB_NAME, existingAlarm => {
        if (!existingAlarm) {
            // Immediately run the job
            openSlotsJob()
            chrome.alarms.create(ALARM_JOB_NAME, { periodInMinutes: 1.0 })
        }
    })
    chrome.alarms.create(ALARM_JOB_NAME, { periodInMinutes: 1.0 })
}

const setRunningStatus = (isRunning) => {
    chrome.storage.local.set({ isRunning })
}

const stopAlarm = () => {
    chrome.alarms.clearAll()
}

const openSlotsJob = () => {
    fetchOpenSlots(cachedPrefs)
        .then(data => handleOpenSlots(data))
}

const handleOpenSlots = (openSlots) => {
    if (openSlots && openSlots.length > 0 && openSlots[0].timestamp != firstAptTimestamp) {
        firstAptTimestamp = openSlots[0].timestamp
        createNotification(openSlots[0], openSlots.length, cachedPrefs)
    }
}
