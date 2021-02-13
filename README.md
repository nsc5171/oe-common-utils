# oe-common-utils
A well defined useful set of customizations on oe-apps packed as a pluggable module.

CachingMixinNSC : mixin to enable caching on any model connected to mongodb via oe-connector-mongodb. Supports caching by node-cache module.

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
