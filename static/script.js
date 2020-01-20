function utmSaver() {
    // CONSTANTS
    var storageKey = "mt_utm_saver"

    // MODELS
    function utmStorageModel() {
        return {
            query: null,
            createdAt: "",
        }
    }

    // WORKING WITH QUERY
    function hasQuery(searchQuery) {
        if (searchQuery === "") {
            return false
        }

        return true
    }

    function parseQueryToObject(queryString) {
        var result = null

        if (!hasQuery(queryString)) return null

        try {
            result = JSON.parse('{"' + queryString.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) })
        } catch (e) {
            return null
        }

        return result
    }

    function parseObjectToQuery(utmModel) {
        return new URLSearchParams(utmModel.query).toString()
    }
    
    // WORKING WITH LOCATION
    function setQueryParamsToLocation(queryModel) {
        var currentUrl = new URL(location.href)

        var queryKeys = Object.keys(queryModel)

        console.log(queryKeys)

        for (var i = 0; i < queryKeys.length; i += 1) {
            var queryValue = queryModel[queryKeys[i]]

            currentUrl.searchParams.set(queryKeys[i], queryValue)
        }

        history.pushState({"mt_utm_saver": queryModel}, "MT Query Saver", currentUrl.href)
    }

    // WORKING WITH STORAGE
    function saveQueryToStorage() {
        var model = utmStorageModel()

        var queryWithoutQuestionMark = location.search.substring(1)
        var query = parseQueryToObject(queryWithoutQuestionMark)

        if (!query) return false

        model.query = query
        model.createdAt = Date.now()

        localStorage.setItem(storageKey, JSON.stringify(model))

        return true
    }

    function getFromStorage() {
        var result = null

        var utmStorageModel = localStorage.getItem(storageKey)
        if (!utmStorageModel) return null

        try {
            result = JSON.parse(utmStorageModel)
        } catch (e) {
            console.warn("Invalid utm storage model. Error: ", e)
            return null
        }

        return result
    }

    // TODO: rewrite option true || false
    var utmModel = getFromStorage()
    if (!utmModel) {
        var saved = saveQueryToStorage()
        if (!saved) return
    }

    utmModel = getFromStorage()

    setQueryParamsToLocation(utmModel.query)
}

// url parse +
// save to localStorage +
// save and get localstorage +
// add to window location params +
// replacing params
// add only absent params // TODO make param customizable
// code organize (!)
// add sub-page +
// add ttl to save params (?)


document.addEventListener('DOMContentLoaded', utmSaver)