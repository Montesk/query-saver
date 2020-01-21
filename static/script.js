// CONSTANTS
const storageKey = "mt_utm_saver"

// TYPES
const storageTypes = {
    sessionStorage: 1,
    localStorage : 2,
}

/**
 * Models
 * @type {{newStorageModel: (function(): {createdAt: string, query: null})}}
 */
const models = {
    newStorageModel: function () {
        return {
            query: null,
            createdAt: "",
        }
    }
}
/**
 * Module to work with search query and model
 * @type {{parseQueryToObject: queryModule.parseQueryToObject, parseObjectToQuery: (function(*): string), hasQuery: queryModule.hasQuery}}
 */
const queryModule = {
    /**
     * Checks if location has search query
     * @param searchQuery
     * @returns {boolean}
     */
    hasQuery: function (searchQuery) {
        if (searchQuery === "") {
            return false
        }

        return true
    },

    /**
     * parse query string to query model
     * @param queryString
     * @returns {null|*}
     */
    parseQueryToObject: function (queryString) {
        let result = null

        if (!this.hasQuery(queryString)) return null

        try {
            result = JSON.parse('{"' + queryString.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) })
        } catch (e) {
            return null
        }

        return result
    },

    /**
     * parse query model to query string
     * @param utmModel
     * @returns {string}
     */
    parseObjectToQuery: function (utmModel) {
        return new URLSearchParams(utmModel.query).toString()
    }
};

/**
 * Module works with window location (browser history)
 * @type {{setQueryParamsToLocation: locationModule.setQueryParamsToLocation}}
 */
const locationModule = {
    /**
     * Set query model to search prop of window location
     * @param queryModel
     */
    setQueryParamsToLocation: function(queryModel) {
        const currentUrl = new URL(location.href)

        const queryKeys = Object.keys(queryModel)

        for (let i = 0; i < queryKeys.length; i += 1) {
            const queryKey = queryKeys[i]
            const queryValue = queryModel[queryKey]

            currentUrl.searchParams.set(queryKey, queryValue)
        }

        history.pushState({"mt_utm_saver": queryModel}, "MT Query Saver", currentUrl.href)
    },
}

/**
 *
 * @type {{getModel: storageModule.getModel, setModel: storageModule.setModel}}
 */
const storageModule = {
    options: {
        storage: storageTypes.sessionStorage
    },

    init(options) {
        this.options = { ...this.options, ...options }

        return this
    },

    /**
     * Saves to parsed query to storage
     * Validate query and query exists
     * @returns {boolean} success
     */
    setModel: function(model) {
        const queryWithoutQuestionMark = location.search.substring(1)
        const query = queryModule.parseQueryToObject(queryWithoutQuestionMark) // FIXME: don't use modules inside each other

        if (!query) return false

        model.query = query
        model.createdAt = Date.now()

        this.getStorage().setItem(storageKey, JSON.stringify(model))

        return true
    },

    /**
     * Get utmModel from storage
     * @returns {null|*}
     */
    getModel: function() {
        let result = null

        const utmStorageModel = this.getStorage().getItem(storageKey)
        if (!utmStorageModel) return null

        try {
            result = JSON.parse(utmStorageModel)
        } catch (e) {
            console.warn("Invalid utm storage model. Error: ", e)
            return null
        }

        return result
    },

    getStorage: function () {
        switch (this.options.storage) {
            case storageTypes.sessionStorage:
                return sessionStorage
            case storageTypes.localStorage:
                return localStorage
            default:
                throw Error("Unknown storage type")
        }
    }
}

const defaultOptions = {
    storage: storageTypes.sessionStorage,
}

function querySaver(options = defaultOptions) {

    // MODULES INIT
    const queryM = queryModule // FIXME: work with module inside main instance
    const locationM = locationModule

    const storageM = storageModule.init(defaultOptions)

    let utmModel = storageM.getModel()
    if (!utmModel) {
        const model = models.newStorageModel()

        const saved = storageM.setModel(model)
        if (!saved) return
    }

    utmModel = storageM.getModel()

    locationM.setQueryParamsToLocation(utmModel.query)
}

document.addEventListener('DOMContentLoaded', querySaver)

// TODO:
// Move everything to window object and close from global scope
// Add expiration time and option for model to store
// Add replacement option on/off (global)
// Add query replacement all / specific tags
// Add query specific only tags to replace
// Add links to replace all over the page off / on
// Add cookies storage