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
    $SD.on('de.biomechaniac.streamdeck.aquasuite.actionmonitorsensor.keyUp', (jsonObj) => actionMonitorSensor.onKeyUp(jsonObj));
    $SD.on('de.biomechaniac.streamdeck.aquasuite.actionmonitorsensor.keyDown', (jsonObj) => actionMonitorSensor.onKeyDown(jsonObj));
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
    onDidReceiveGlobalSettings: function(jsn) {
        console.log('%c%s', 'color: white; background: red; font-size: 15px;', '[app.js]onDidReceiveGlobalSettings:');

        //$SD.api.setGlobalSettings(Utils.getProp(jsn, 'payload.settings', {}));
        this.doSomeThing(this.settingsPerAction[jsn.context], 'onDidReceiveGlobalSettings', 'orange');

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

        this.updateSensorData(jsn)();
        this.intervalFetchDataPerAccessKey[jsn.context] = setInterval(this.updateSensorData(jsn), 15000);
    },

    onWillDisappear: function (jsn) {
        clearInterval(this.intervalFetchDataPerAccessKey[jsn.context]);
    },


    updateSensorData: function(jsn){
        return async () =>{
            try{
                const response = await this.fetchAquasuiteData(this.settingsPerAction[jsn.context].aquasuite_accesscode_value);
                this.setTitle(jsn, this.settingsPerAction[jsn.context].select_sensor_dropdown_value + "\r\n" + response[this.settingsPerAction[jsn.context].select_sensor_dropdown_value]);
            }catch(error){
                this.setTitle(jsn, "Error");
                $SD.api.showAlert(jsn.context);
            }
        }
    },

    fetchAquasuiteData: async function(accessCode){
        const resp = await fetch("https://aquasuite.aquacomputer.de/circonus/"+accessCode);
        const respjson = await resp.json();
        return respjson;
    },

    onKeyUp: function (jsn) {
        this.doSomeThing(jsn, 'onKeyUp', 'green');
    },

    onKeyDown: function (jsn) {
        this.doSomeThing(jsn, 'onKeyDown', 'red');
        this.setTitle(jsn, "keydown");
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
        console.log("watch the key on your StreamDeck - it got a new title...", title);
        $SD.api.setTitle(jsn.context, title);
    },

    /**
     * Finally here's a method which gets called from various events above.
     * This is just an idea on how you can act on receiving some interesting message
     * from Stream Deck.
     */

    doSomeThing: function(inJsonData, caller, tagColor) {
        console.log('%c%s', `color: white; background: ${tagColor || 'grey'}; font-size: 15px;`, `[app.js]doSomeThing from: ${caller}`);
        // console.log(inJsonData);
    }, 


};

