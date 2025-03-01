// Listen to the input events
// Declare vars to attach listeners to the states of certain elements

// ELEMENTS
const locIdElem = document.getElementById("locationId")
const startDateElem = document.getElementById("startDate")
const endDateElem = document.getElementById("endDate")

// Button elements
const startButton = document.getElementById("startButton")
const stopButton = document.getElementById("stopButton")

// Span Listeners
const runningSpan = document.getElementById("runningSpan")
const stoppedSpan = document.getElementById("stoppedSpan")

// Error message
const locationIdError = document.getElementById("locationIdError")
const startDateError = document.getElementById("startDateError")
const endDateError = document.getElementById("endDateError")

const hideElement = (elem) => {
    elem.style.display = 'none'
}

const showElement = (elem) => {
    elem.style.display = ''
}

const disableElement = (elem) => {
    elem.disabled = true
}

const enableElement = (elem) => {
    elem.disabled = false
}

const handleOnStartState = () => {
    // Spans
    showElement(runningSpan)
    hideElement(stoppedSpan)

    // Buttons
    disableElement(startButton)
    enableElement(stopButton)

    // Inputs
    disableElement(locIdElem)
    disableElement(startDateElem)
    disableElement(endDateElem)
}

const handleOnStopState = () => {
    // Spans
    showElement(stoppedSpan)
    hideElement(runningSpan)

    // Buttons
    disableElement(stopButton)
    enableElement(startButton)

    // Inputs
    enableElement(locIdElem)
    enableElement(startDateElem)
    enableElement(endDateElem)
}

const showDateError = (dateErrorElem, errorMsg) => {
    dateErrorElem.innerHTML = errorMsg
    showElement(dateErrorElem)
}

const validateStartDate = (today, startDate) => {
    const isAfterToday = !startDate.isBefore(today, 'date')

    if (!startDateElem.value) showDateError(startDateError, 'Please enter a valid start date')
    else if (!isAfterToday) showDateError(startDateError, "Can't look in the past")
    else hideElement(startDateError)

    return startDateElem.value && isAfterToday
}

const validateEndDate = (today, startDate, endDate) => {
    const isAfterStart = startDate.isBefore(endDate, 'date')
    const isAfterToday = !endDate.isBefore(today, 'date')

    if (!endDateElem.value) showDateError(endDateError, "Please enter a valid end date")
    else if (!isAfterStart) showDateError(endDateError, "End date must come after start date")
    else if (!isAfterToday) showDateError(endDateError, "Can't look in the past")
    else hideElement(endDateError)

    return endDateElem.value && isAfterToday && isAfterStart 

}

const validateDates = () => {
    // today <= start date <= end date
    const today = spacetime.now().startOf('day')
    const startDate = spacetime(startDateElem.value).startOf('day')
    const endDate = spacetime(endDateElem.value).startOf('day')

    const isValidStartDate = validateStartDate(today, startDate)
    const isValidEndDate = validateEndDate(today, startDate, endDate)

    return isValidStartDate && isValidEndDate
}

const performOnStartValidations = () => {
    const areValidDates = validateDates()

    if (!locIdElem.value) showElement(locationIdError)
    else hideElement(locationIdError)

    return locIdElem.value && areValidDates
}

startButton.onclick = () => {
    const allFieldsValid = performOnStartValidations();

    if (allFieldsValid) {
        handleOnStartState();
        const prefs = {
            locationId: locIdElem.value,
            startDate: startDateElem.value,
            endDate: endDateElem.value,
            tzData: locIdElem.options[locIdElem.selectedIndex].getAttribute('data-tz')
        }
        chrome.runtime.sendMessage({ event: 'onStart', prefs })
    }
}

stopButton.onclick = () => {
    handleOnStopState();
    chrome.runtime.sendMessage({ event: 'onStop' })
}

chrome.storage.local.get(
    ['locationId', 'startDate', 'endDate', 'locations', 'isRunning'], (result) => {
        const { locationId, startDate, endDate, locations, isRunning } = result;

        setLocations(locations);

        locIdElem.value = locationId ? locationId : null;
        startDateElem.value = startDate ? startDate : null;
        endDateElem.value = endDate ? endDate : null;

        if (isRunning) handleOnStartState()
        else handleOnStopState()
    }
)

// Locations objects contains
// {
//     "id": 5005,
//     "name": 'Some Name',
//     "shortName": 'some shorthand name',
//     "tzData": "time zone data"
// }

const setLocations = (locations) => {
    locations.forEach(location => {
        let optionElem = document.createElement("option");
        optionElem.value = location.id
        optionElem.innerHTML = location.name
        optionElem.setAttribute('data-tz', location.tzData)
        locIdElem.appendChild(optionElem);
    })
}

const today = spacetime.now().startOf('day').format()
startDateElem.setAttribute('min', today)
endDateElem.setAttribute('min', today)
