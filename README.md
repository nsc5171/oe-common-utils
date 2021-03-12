# oe-common-utils
A well defined useful set of customizations on oe-apps packed as a pluggable module.

# Gcloud logging
To enable/disable streaming of logs to google cloud logging service when app depoyed in Google App Engine.
set environment variables as below:
ENABLE_GCLOUD_LOGGING=true
ENABLE_GCLOUD_LOGGING_LVL=info

# CachingMixinNSC
A mixin to enable caching on any model connected to mongodb via oe-connector-mongodb. Supports caching by node-cache module as of today (Read through cache).

```
 "mixins": {
    "CachingMixinNSC": {
      "cacheModule": "node-cache", //default is node-cache
      "stdTTL": 300,
      "checkperiod": 300,
      "useClones": false,
      "deleteOnExpire": true,
      "maxKeys": 100
    }
  }
``` 
