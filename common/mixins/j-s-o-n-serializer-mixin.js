'use strict';

module.exports = function JSONSerializerMixin(Model) {

    Model.prototype._toJSONDataSerializationAdapter = function _toJSONDataSerializationAdapter(options, next) {
        let self = this;
        self._seriablization_changes = { _modifiedAtSrlzn: 'Y' };
        process.nextTick(next);
    }

    Model.observe('loaded',(ctx,next)=>{
        process.nextTick(next);
    })

}