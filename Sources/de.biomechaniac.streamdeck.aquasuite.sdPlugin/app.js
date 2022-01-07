/* global $CC, Utils, $SD */

/**
 * Here are a couple of wrappers we created to help you quickly setup
 * your plugin and subscribe to events sent by Stream Deck to your plugin.
 */

/**
 * The 'connected' event is sent to your plugin, after the plugin's instance
 * is registered with Stream Deck software. It carries the current websocket
 * and other information about the current environmet in a JSON object
 * You can use it to subscribe to events you want to use in your plugin.
 */

$SD.on('connected', (jsonObj) => connected(jsonObj));

function connected(jsn) {
    // Subscribe to the willAppear and other events
    $SD.on('de.biomechaniac.streamdeck.aquasuite.actionmonitorsensor.willAppear', (jsonObj) => actionMonitorSensor.onWillAppear(jsonObj));
    $SD.on('de.biomechaniac.streamdeck.aquasuite.actionmonitorsensor.willDisappear', (jsonObj) => actionMonitorSensor.onWillDisappear(jsonObj));
    $SD.on('de.biomechaniac.streamdeck.aquasuite.actionmonitorsensor.sendToPlugin', (jsonObj) => actionMonitorSensor.onSendToPlugin(jsonObj));
    $SD.on('de.biomechaniac.streamdeck.aquasuite.actionmonitorsensor.didReceiveSettings', (jsonObj) => actionMonitorSensor.onDidReceiveSettings(jsonObj));
    $SD.on('de.biomechaniac.streamdeck.aquasuite.actionmonitorsensor.didReceiveGlobalSettings', (jsonObj) => actionMonitorSensor.onDidReceiveGlobalSettings(jsonObj));
    $SD.on('de.biomechaniac.streamdeck.aquasuite.actionmonitorsensor.propertyInspectorDidAppear', (jsonObj) => {
        console.log('%c%s', 'color: white; background: black; font-size: 13px;', '[app.js]propertyInspectorDidAppear:');
    });
    $SD.on('de.biomechaniac.streamdeck.aquasuite.actionmonitorsensor.propertyInspectorDidDisappear', (jsonObj) => {
        console.log('%c%s', 'color: white; background: red; font-size: 13px;', '[app.js]propertyInspectorDidDisappear:');
    });
};

// ACTIONS

var actionMonitorSensor = {
    settingsPerAction:{},
    DestinationEnum : Object.freeze({"HARDWARE_AND_SOFTWARE":0, "HARDWARE_ONLY":1, "SOFTWARE_ONLY":2}),
    intervalFetchDataPerAccessKey:{},
    dataPerAccessKey:{},
    intervalUpdateSensorDataOnStreamdeck:{},
    onDidReceiveGlobalSettings: function(jsn) {
        console.log('%c%s', 'color: white; background: red; font-size: 15px;', '[app.js]onDidReceiveGlobalSettings:');

        //$SD.api.setGlobalSettings(Utils.getProp(jsn, 'payload.settings', {}));

         this.setTitle(jsn);
    },
    onDidReceiveSettings: function(jsn) {
        console.log('%c%s', 'color: white; background: red; font-size: 15px;', '[app.js]onDidReceiveSettings:');

        this.settingsPerAction[jsn.context] = Utils.getProp(jsn, 'payload.settings', {});

        /**
         * In this example we put a HTML-input element with id='mynameinput'
         * into the Property Inspector's DOM. If you enter some data into that
         * input-field it get's saved to Stream Deck persistently and the plugin
         * will receive the updated 'didReceiveSettings' event.
         * Here we look for this setting and use it to change the title of
         * the key.
         */

         this.setTitle(jsn);
    },

    /** 
     * The 'willAppear' event is the first event a key will receive, right before it gets
     * shown on your Stream Deck and/or in Stream Deck software.
     * This event is a good place to setup your plugin and look at current settings (if any),
     * which are embedded in the events payload.
     */

    onWillAppear: function (jsn) {
        this.setTitle(jsn, "Loading...");
        /**
         * The willAppear event carries your saved settings (if any). You can use these settings
         * to setup your plugin or save the settings for later use. 
         * If you want to request settings at a later time, you can do so using the
         * 'getSettings' event, which will tell Stream Deck to send your data 
         * (in the 'didReceiveSettings above)
         * 
         * $SD.api.getSettings(jsn.context);
        */
        this.settingsPerAction[jsn.context] = jsn.payload.settings;

        var aquasuite_accesscode_value = jsn.payload.settings.aquasuite_accesscode_value;
        // setup of fetch data from aquasuite web export
        if(aquasuite_accesscode_value !== undefined &&
            this.intervalFetchDataPerAccessKey[aquasuite_accesscode_value] === undefined){
            this.intervalFetchDataPerAccessKey[aquasuite_accesscode_value] = 
                                setInterval(this.fetchAquasuiteData(aquasuite_accesscode_value), 15000);
            
            // initial call
            this.fetchAquasuiteData(aquasuite_accesscode_value)();
        }

        // setup of updating streamdeck data
        this.intervalUpdateSensorDataOnStreamdeck[jsn.context] = setInterval(this.updateSensorData(jsn), 15000);
        setTimeout(
            // initial call, wait for aquasuite response
            this.updateSensorData(jsn)
            , 200);
    },

    onWillDisappear: function (jsn) {
        var aquasuite_accesscode_value = this.settingsPerAction[jsn.context].aquasuite_accesscode_value;
        // clear fetch data interval (per access key) -> todo dont remove interval if other actions still present for that access key
        if(this.intervalFetchDataPerAccessKey[aquasuite_accesscode_value] !== undefined){
            clearInterval(this.intervalFetchDataPerAccessKey[aquasuite_accesscode_value]);
            delete this.intervalFetchDataPerAccessKey[aquasuite_accesscode_value];
        }

        // clear update streamdeck interval (per action)
        clearInterval(this.intervalUpdateSensorDataOnStreamdeck[jsn.context]);
        delete this.intervalUpdateSensorDataOnStreamdeck[jsn.context];
    },


    updateSensorData: function(jsn){
        return () =>{
            var actionSettings = this.settingsPerAction[jsn.context];
            var accessCode = actionSettings.aquasuite_accesscode_value;

            const data = this.dataPerAccessKey[accessCode];
            var value = data[actionSettings.select_sensor_dropdown_value];
            
            var sensorName = actionSettings.sensor_name_value ?? actionSettings.select_sensor_dropdown_value;
            var sensorUnit = actionSettings.sensor_unit_value ? " " + actionSettings.sensor_unit_value : "";

            this.setTitle(jsn, sensorName + "\r\n" + value + sensorUnit);
        }
    },

    fetchAquasuiteData: function(accessCode){
        return async () =>{
            try{
                const resp = await fetch("https://aquasuite.aquacomputer.de/circonus/"+accessCode);
                this.dataPerAccessKey[accessCode] = await resp.json();
            }catch(error){
                this.setTitle(jsn, "Error");
                $SD.api.showAlert(jsn.context);
            }
        }
    },

    onSendToPlugin: async function (jsn) {
        /**
         * This is a message sent directly from the Property Inspector 
         * (e.g. some value, which is not saved to settings) 
         * You can send this event from Property Inspector (see there for an example)
         */ 

        console.log(jsn);
        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});
        if (sdpi_collection.key && sdpi_collection.key === 'aquasuite_accesscode_value' && sdpi_collection.value && sdpi_collection.value !== undefined) {
        }
    },

    /**
     * This snippet shows how you could save settings persistantly to Stream Deck software.
     * It is not used in this example plugin.
     */

    saveSettings: function (jsn, sdpi_collection) {
        console.log('saveSettings:', jsn);
        if (sdpi_collection.hasOwnProperty('key') && sdpi_collection.key != '') {
            if (sdpi_collection.value && sdpi_collection.value !== undefined) {
                this.settingsPerAction[jsn.context][sdpi_collection.key] = sdpi_collection.value;
                console.log('setSettings....', this.settingsPerAction[jsn.context]);
                $SD.api.setSettings(jsn.context, this.settingsPerAction[jsn.context]);
            }
        }
    },

    /**
     * Here's a quick demo-wrapper to show how you could change a key's title based on what you
     * stored in settings.
     * If you enter something into Property Inspector's name field (in this demo),
     * it will get the title of your key.
     * 
     * @param {JSON} jsn // The JSON object passed from Stream Deck to the plugin, which contains the plugin's context
     * 
     */

    setTitle: function(jsn, title) {
        console.log("Updating Title...", title);
        $SD.api.setTitle(jsn.context, title);
    }, 


};