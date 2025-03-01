export const createNotification = (openSlot, slotCount, prefs) => {
    const { tzData } = prefs
    const { timestamp } = openSlot

    chrome.notifications.create({
        title: "Global Entry Drops",
        message: `Found ${slotCount} open interview(s) at ${timestamp} (${tzData} timezone)`,
        iconUrl: "../images/globalEntryDropClone_64.png",
        type: "basic"
    })
}