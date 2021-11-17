function MonitorSensorAction(inContext, inSettings){
    // Init MonitorSensorAction
    var instance = this;

    // Inherit from Action
    Action.call(this, inContext, inSettings);

    // Set the default values
    setDefaults();
}