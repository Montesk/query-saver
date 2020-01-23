(function () {
    // CONSTANTS
    const storageTypes = {
        sessionStorage: 1,
        localStorage: 2,
    }

    const checkExpirationInterval = 1000 // ms

    const defaultOptions = {
        storage: storageTypes.sessionStorage,
        lifeTimeSeconds: 0, // no lifetime
    }

    const storageKey = 'mt_utm_saver'

    // MODELS
    const models = {
        newStorageModel: function (options) {
            return {
                query: null,
                createdAt: new Date(),
                lifeTimeSeconds: options.lifeTimeSeconds,
            }
        },
    }

    // STATIC HELPERS
    function isExpired (expiresAt) {
        return Date.now() > expiresAt
    }

    function getStorageModelExpiresAt(model) {
        const createdAt = new Date(model.createdAt)
        return createdAt.setSeconds(createdAt.getSeconds() + model.lifeTimeSeconds)
    }

    window.mtQuerySaver = {
        location: {
            setQueryParamsToLocation: function (queryModel) {
                const currentUrl = new URL(location.href)

                const queryKeys = Object.keys(queryModel)

                for (let i = 0; i < queryKeys.length; i += 1) {
                    const queryKey = queryKeys[i]
                    const queryValue = queryModel[queryKey]

                    currentUrl.searchParams.set(queryKey, queryValue)
                }

                history.pushState({'mt_utm_saver': queryModel}, 'MT Query Saver', currentUrl.href)
            },
        },

        storage: {
            options: {
                storage: storageTypes.sessionStorage,
            },

            init(options) {
                this.options = {...this.options, ...options}

                return this
            },

            getStorage: function () {
                switch (this.options.storage) {
                    case storageTypes.sessionStorage:
                        return sessionStorage
                    case storageTypes.localStorage:
                        return localStorage
                    default:
                        throw Error('Unknown storage type')
                }
            },

            clearStorage: function () {
                this.getStorage().clear()
            },

            setModel: function (key, value, queryModule) {
                const queryWithoutQuestionMark = location.search.substring(1)
                const query = queryModule.parseQueryToObject(queryWithoutQuestionMark) // remove module inner dependency and injection

                if (!query) return false

                value.query = query
                value.createdAt = new Date()

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
                    console.warn('Invalid utm storage model. Error: ', e)
                    return null
                }

                return result
            },
        },

        query: {
            hasQuery: function (searchQuery) {
                if (searchQuery === '') {
                    return false
                }

                return true
            },

            parseQueryToObject: function (queryString) {
                let result = null

                if (!this.hasQuery(queryString)) return null

                try {
                    result = JSON.parse('{"' + queryString.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) {
                        return key === '' ? value : decodeURIComponent(value)
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

        workers: {
            modelExpirationInterval: null,
            storageModel: null,
            storage: null,

            checkModelExpiration: function () {
                function expirationHandler() {
                    if (!(this.storageModel.lifeTimeSeconds)) return

                    const expiresAt = getStorageModelExpiresAt(this.storageModel)

                    if (isExpired(expiresAt)) {
                        this.modelExpirationInterval = clearInterval(this.modelExpirationInterval)
                        this.storage.clear()
                    }
                }

                expirationHandler = expirationHandler.bind(this)

                this.modelExpirationInterval = setInterval(expirationHandler, checkExpirationInterval)
            },

            // update model on change ?
            init: function (storage) {
                this.storageModel = storage.getModel()
                this.storage = storage.getStorage()

                this.checkModelExpiration()
            }
        },

        init: function (instance, options) {
            options = {...defaultOptions, ...options}

            const storage = instance.storage.init(options)

            let storageModel = storage.getModel()
            if (!storageModel) {
                const model = models.newStorageModel(options)

                const saved = storage.setModel(storageKey, model, instance.query)
                if (!saved) return
            }

            storageModel = storage.getModel()

            if (isExpired(getStorageModelExpiresAt(storageModel))) {
                storage.clearStorage()
                return
            }

            this.location.setQueryParamsToLocation(storageModel.query)

            this.workers.init(storage)
        },
    }
})()

function newMtQuerySaver() {
    mtQuerySaver.init(mtQuerySaver, {})
}

document.addEventListener('DOMContentLoaded', newMtQuerySaver)