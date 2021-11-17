// Protype which represents an action
function Action(inContext, inSettings) {
    // Init Action
    var instance = this;

    // Private variable containing the context of the action
    var context = inContext;

    // Private variable containing the settings of the action
    var settings = inSettings;

    // Set the default values
    setDefaults();

    // Public function returning the context
    this.getContext = function() {
        return context;
    };

    // Public function returning the settings
    this.getSettings = function() {
        return settings;
    };

    // Public function for setting the settings
    this.setSettings = function(inSettings) {
        settings = inSettings;
    };

    // Public function called when new cache is available
    this.newCacheAvailable = function(inCallback) {
        // Set default settings
        setDefaults(inCallback);
    };

    // Private function to set the defaults
    function setDefaults(inCallback) {
        // Find out type of action
        var action;
        if (instance instanceof MonitorSensorAction) {
            action = 'de.biomechaniac.streamdeck.aquasuite.actionMonitorSensor';
        }
        else if (instance instanceof ColorAction) { 
            action = 'de.biomechaniac.streamdeck.aquasuite.actionMultiMonitorCycling';
        }
        else if (instance instanceof ColorAction) {
            action = 'de.biomechaniac.streamdeck.aquasuite.actionMultiMonitorAll';
        }

        /*if (!('aquasuiteAccessCode' in inSettings)) {
            log('No aquasuite accessCode configured');

            $SD.api.setGlobalSettings(inContext, JSON.stringify(defaultSettings));
            return;
        }*/

        // If a callback function was given
        if (inCallback !== undefined) {
            // Execute the callback function
            inCallback();
        }
    }
}