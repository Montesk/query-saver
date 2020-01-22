(function () {
    // CONSTANTS
    const storageTypes = {
        sessionStorage: 1,
        localStorage: 2,
    }

    const storageKey = "mt_utm_saver"

    // MODELS
    const models = {
        newStorageModel: function () {
            return {
                query: null,
                createdAt: "",
            }
        }
    }


    window.mtQuerySaver = {
        models: {
            newStorageModel: function () {
                return {
                    query: null,
                    createdAt: "",
                }
            }
        },

        location: {
            setQueryParamsToLocation: function (queryModel) {
                const currentUrl = new URL(location.href)

                const queryKeys = Object.keys(queryModel)

                for (let i = 0; i < queryKeys.length; i += 1) {
                    const queryKey = queryKeys[i]
                    const queryValue = queryModel[queryKey]

                    currentUrl.searchParams.set(queryKey, queryValue)
                }

                history.pushState({"mt_utm_saver": queryModel}, "MT Query Saver", currentUrl.href)
            },
        },

        storage: {
            options: {
                storage: storageTypes.sessionStorage
            },

            init(options) {
                this.options = {...this.options, ...options}

                return this
            },

            setModel: function (key, value, queryModule) {
                const queryWithoutQuestionMark = location.search.substring(1)
                const query = queryModule.parseQueryToObject(queryWithoutQuestionMark) // FIXME: don't use modules inside each other

                if (!query) return false

                value.query = query
                value.createdAt = Date.now()

                this.getStorage().setItem(key, JSON.stringify(value))

                return true
            },

            getModel: function () {
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
        },

        queryModule: {
            hasQuery: function (searchQuery) {
                if (searchQuery === "") {
                    return false
                }

                return true
            },

            parseQueryToObject: function (queryString) {
                let result = null

                if (!this.hasQuery(queryString)) return null

                try {
                    result = JSON.parse('{"' + queryString.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) {
                        return key === "" ? value : decodeURIComponent(value)
                    })
                } catch (e) {
                    return null
                }

                return result
            },

            parseObjectToQuery: function (utmModel) {
                return new URLSearchParams(utmModel.query).toString()
            },
        },

        init: function (instance) {
            const defaultOptions = {
                storage: storageTypes.sessionStorage,
            }

            const storage = instance.storage.init(defaultOptions)

            let utmModel = storage.getModel()
            if (!utmModel) {
                const model = instance.models.newStorageModel()

                const saved = storage.setModel(storageKey, model, instance.queryModule)
                if (!saved) return
            }

            utmModel = storage.getModel()

            this.location.setQueryParamsToLocation(utmModel.query)
        }
    }
})()

function mtQuerySaver() {
    window.mtQuerySaver.init(window.mtQuerySaver)
}

document.addEventListener('DOMContentLoaded', mtQuerySaver)